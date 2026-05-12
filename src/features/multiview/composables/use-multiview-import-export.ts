/**
 * 动态实体导入导出 composable。
 *
 * 基于 field_config 驱动：
 * - 导出：GET /system/dynamic/excel/export/{entityKey} ← 后端动态生成 Excel
 * - 导入：POST /system/dynamic/excel/import/{entityKey} ← 前端上传 → 后端解析落库
 * - 模板：GET /system/dynamic/excel/template/{entityKey}
 *
 * 子表支持：通过 children 参数传递关联配置。
 */

import { ref, type Ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { httpClient } from '@/api/client';
import type {
  ImportDialogMappingItem,
  ImportDialogParsePayload,
  ImportDialogParseResult,
  ImportDialogSubmitPayload,
  ImportDialogSubmitResult,
  ImportDialogTargetField,
} from '@/components/import-dialog';
import type { EntityTableConfig } from '@/types/entity-config';
import type { ColumnsItem } from '@/components/table-entity/index.type';

/** 子表关联配置 */
export interface ChildRelationConfig {
  entityKey: string;
  relationField: {
    parentKey: string;
    childKey: string;
  };
  sheetName?: string;
}

/** import.meta.glob 的 API 定义 */
interface GetColumnsRef {
  getColumns?: () => ColumnsItem[];
}

export function useMultiviewImportExport(
  entityKey: Ref<string>,
  tableRef: Ref<GetColumnsRef | undefined>,
  tableConfig: Ref<EntityTableConfig>
) {
  const { t } = useI18n();
  const importDialogVisible = ref(false);
  const importTargetFields = ref<ImportDialogTargetField[]>([]);
  const baseUrl = import.meta.env.VITE_APP_BASE_API || '/dev-api';

  // ===== 导出 =====

  /**
   * 导出当前实体数据为 Excel。
   * 下载后端基于 field_config 动态生成的 Excel 文件。
   */
  async function handleExport() {
    try {
      const children = buildChildExportConfig();

      const params: Record<string, string> = {
        _t: Date.now().toString(),
      };
      if (children.length > 0) {
        params.children = JSON.stringify(children);
      }

      const queryString = new URLSearchParams(params).toString();
      const token = localStorage.getItem('token') || '';

      const response = await fetch(
        `${baseUrl}/system/dynamic/excel/export/${entityKey.value}?${queryString}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entityKey.value}_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      ElMessage.success(t('common.success'));
    } catch (error) {
      console.error('Export failed:', error);
      ElMessage.error(t('common.exportFailed'));
    }
  }

  /**
   * 下载导入模板。
   */
  async function handleDownloadTemplate(entityName: string) {
    try {
      const children = buildChildExportConfig();

      const params: Record<string, string> = {
        _t: Date.now().toString(),
      };
      if (children.length > 0) {
        params.children = JSON.stringify(children);
      }

      const queryString = new URLSearchParams(params).toString();
      const token = localStorage.getItem('token') || '';

      const response = await fetch(
        `${baseUrl}/system/dynamic/excel/template/${entityKey.value}?${queryString}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Template download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entityName}_template.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download template failed:', error);
      ElMessage.error(t('common.downloadFailed'));
    }
  }

  // ===== 导入 =====

  /**
   * 打开导入弹窗时，从当前表格字段构建导入字段列表。
   */
  function buildImportTargetFields(): ImportDialogTargetField[] {
    const columns =
      tableRef.value?.getColumns?.() ?? tableConfig.value.columns ?? [];

    return columns
      .filter((column) => column.dataKey != null && column.dataKey !== '')
      .map((column) => {
        const field = String(column.dataKey);
        return {
          field,
          label: String(column.title ?? field),
          required: false,
          allowDuplicateCheck: true,
        };
      });
  }

  /**
   * 解析上传的 Excel 文件（前端预览用）。
   * 对 CSV 做轻量前端解析，Excel 等复杂格式可替换为后端解析接口。
   */
  async function parseImportFile(
    payload: ImportDialogParsePayload
  ): Promise<ImportDialogParseResult> {
    const text = await readFileText(payload.file);
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const headerCells = lines[0] ? splitCsvLine(lines[0]).filter(Boolean) : [];
    const fallbackHeaders = importTargetFields.value.map(
      (field) => field.label
    );
    const headers = headerCells.length ? headerCells : fallbackHeaders;
    const previewColumns = headers.map((label, index) => ({
      prop: `col_${index}`,
      label,
      width: 140,
    }));
    const previewRows = lines.slice(1, 21).map((line) => {
      const cells = splitCsvLine(line);
      return previewColumns.reduce<Record<string, unknown>>(
        (row, column, index) => {
          row[column.prop] = cells[index] ?? '';
          return row;
        },
        {}
      );
    });
    const mappings = buildImportMappings(headers);

    return {
      fileName: payload.file.name,
      total: Math.max(0, lines.length - 1),
      sheets: [{ label: 'Sheet1', value: 'Sheet1' }],
      currentSheet: 'Sheet1',
      previewColumns,
      previewRows,
      mappings,
    };
  }

  /**
   * 根据导入表头匹配目标字段。
   */
  function buildImportMappings(headers: string[]): ImportDialogMappingItem[] {
    return importTargetFields.value.map((field) => {
      const sourceColumn =
        headers.find(
          (header) => header === field.label || header === field.field
        ) ?? '';

      return {
        targetField: field.field,
        targetLabel: field.label,
        sourceColumn,
        required: field.required ?? false,
        duplicateCheck: false,
        allowDuplicateCheck: field.allowDuplicateCheck ?? true,
      };
    });
  }

  /**
   * 提交导入数据到后端。
   * 使用动态实体导入 API（multipart/form-data）。
   */
  async function submitImportData(
    payload: ImportDialogSubmitPayload
  ): Promise<ImportDialogSubmitResult> {
    try {
      const formData = new FormData();
      formData.append('file', payload.file);
      formData.append('mode', payload.mode);
      formData.append(
        'mappings',
        JSON.stringify(
          payload.mappings.map((m) => ({
            targetField: m.targetField,
            sourceColumn: m.sourceColumn,
            duplicateCheck: m.duplicateCheck,
          }))
        )
      );

      // 构建子表配置
      const children = buildChildExportConfig();
      if (children.length > 0) {
        formData.append('children', JSON.stringify(children));
      }

      const response = await httpClient.request<{
        success: number;
        fail: number;
        errors?: string[];
      }>({
        method: 'POST',
        url: `/system/dynamic/excel/import/${entityKey.value}`,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 50) / progressEvent.total
            );
            payload.onProgress?.(Math.min(percent, 50));
          }
        },
      });

      // httpClient 响应拦截器已解包 response.data（即 JSON body）
      // response 结构为 { code, message, data }
      const result = (response as any).data as {
        success: number;
        fail: number;
        errors?: string[];
      } | null;

      if (!result) {
        throw new Error('No result from server');
      }

      payload.onProgress?.(100);

      return {
        success: result.fail === 0,
        title:
          result.fail === 0
            ? t('components.importDialog.successTitle')
            : t('components.importDialog.errorTitle'),
        description:
          result.fail === 0
            ? t('components.importDialog.successDescription')
            : t('components.importDialog.errorDescription'),
        successCount: result.success,
        failureCount: result.fail,
        detail:
          result.errors && result.errors.length > 0
            ? result.errors.join('\n')
            : undefined,
      };
    } catch (error) {
      console.error('Import failed:', error);
      return {
        success: false,
        title: t('components.importDialog.errorTitle'),
        description: t('components.importDialog.errorDescription'),
        successCount: 0,
        failureCount: 0,
        detail:
          error instanceof Error
            ? error.message
            : t('components.importDialog.unknownError'),
      };
    }
  }

  // ===== 工具方法 =====

  function readFileText(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () =>
        reject(reader.error ?? new Error('read file failed'));
      reader.readAsText(file);
    });
  }

  function splitCsvLine(line: string) {
    const cells: string[] = [];
    let current = '';
    let inQuote = false;
    for (const char of line) {
      if (char === '"') {
        inQuote = !inQuote;
        continue;
      }
      if (char === ',' && !inQuote) {
        cells.push(current.trim());
        current = '';
        continue;
      }
      current += char;
    }
    cells.push(current.trim());
    return cells;
  }

  /** 从实体配置的 table.children 构建子表导出配置 */
  function buildChildExportConfig(): ChildRelationConfig[] {
    const children = tableConfig.value.children;
    if (!children || children.length === 0) return [];

    return children
      .filter((child) => child.entityKey)
      .map((child) => ({
        entityKey: child.entityKey!,
        sheetName: child.label || child.entityKey!,
        relationField: normalizeRelationField(child.relationField),
      }));
  }

  function normalizeRelationField(relationField: any): {
    parentKey: string;
    childKey: string;
  } {
    if (!relationField) {
      return { parentKey: 'id', childKey: '' };
    }
    if (Array.isArray(relationField)) {
      return {
        parentKey: relationField[0]?.parentKey || 'id',
        childKey: relationField[0]?.childKey || '',
      };
    }
    return {
      parentKey: relationField.parentKey || 'id',
      childKey: relationField.childKey || '',
    };
  }

  return {
    importDialogVisible,
    importTargetFields,
    handleExport,
    handleDownloadTemplate,
    buildImportTargetFields,
    parseImportFile,
    submitImportData,
  };
}
