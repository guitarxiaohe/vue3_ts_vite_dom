import { h, ref, watch, type ComputedRef, type Ref } from 'vue';
import type { Slots } from 'vue';
import { ElTooltip } from 'element-plus';
import { getByEntityKeyAndFieldKeyApi } from '@/api/modules/dynamic-entity';
import { isEmptyValue, snakeToCamel } from '@/utils/value';
import { queryClient } from '@/api/query-client';
import { DICT_DATA_ALL_QUERY_KEY } from '@/api/modules/dict';
import type { DictDataItem } from '@/types/dict';
import type { ColumnsItem, TableEntlty } from '../index.type';
import { normalizeColumnFixed } from '../utils/column-utils';
import { applyColumnSlots } from '../utils/column-slots';
import UserCell from '../cells/avatar-cell.vue';
import FileCell from '../cells/file-cell.vue';
import PictureCell from '../cells/picture-cell.vue';
import DictTag from '@/components/dict-tag/index.vue';
import { useImageUrl } from '@/composables/use-image-url';
import { formatTimestampText } from '@/utils/datetime';
/******************************** 列配置加载与插槽合并 ********************************/

// 兼容字段配置的 camelCase 与 snake_case
function resolveFieldValue(field: Record<string, any>, camelKey: string) {
  if (field[camelKey] !== undefined) {
    return field[camelKey];
  }

  const snakeKey = camelKey.replace(
    /[A-Z]/g,
    (value) => `_${value.toLowerCase()}`
  );
  return field[snakeKey];
}

// 解析字段角色配置
function resolveFieldRole(field: Record<string, any>) {
  return String(resolveFieldValue(field, 'fieldRole') ?? '').trim();
}

// 解析文件增强对象键名
function resolveFileInfoKey(field: Record<string, any>) {
  const fieldKey = String(resolveFieldValue(field, 'fieldKey') ?? '');
  const camelFieldKey = snakeToCamel(fieldKey);
  return camelFieldKey === 'fileUrl' ? 'fileInfo' : `${camelFieldKey}Info`;
}

// 解析审计用户对象
function resolveAuditUser(
  field: Record<string, any>,
  rowData: Record<string, any>
) {
  const fieldRole = resolveFieldRole(field);
  const fieldKey = String(
    resolveFieldValue(field, 'fieldKey') ?? ''
  ).toLowerCase();

  if (fieldRole === 'updateUser' || fieldKey === 'updateuser') {
    return rowData.updateUser ?? null;
  }

  if (fieldRole === 'createUser' || fieldKey === 'createuser') {
    return rowData.createUser ?? null;
  }

  if (fieldKey === 'update_by' || fieldKey === 'updateby') {
    return rowData.updateUser ?? null;
  }

  return rowData.createUser ?? null;
}

// 图片字段兼容字符串、数组和附件对象
function resolveImageUrls(value: unknown) {
  const { resolveImageUrl } = useImageUrl();
  const values = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',').map((item) => item.trim())
      : value
        ? [value]
        : [];

  return values
    .map((item) => {
      if (!item) return '';
      if (typeof item === 'object') {
        const record = item as Record<string, any>;
        return record.fileUrl ?? record.url ?? record.path ?? '';
      }
      return String(item);
    })
    .filter(Boolean)
    .map((url) => resolveImageUrl(url));
}

// 从全局字典缓存中解析标签
function resolveDictLabelFromCache(
  dictCode: string,
  value: unknown
): string | undefined {
  if (!dictCode || value == null || value === '') return undefined;
  const allDict = queryClient.getQueryData<DictDataItem[]>(
    DICT_DATA_ALL_QUERY_KEY
  );
  if (!allDict) return undefined;
  const matched = allDict.find(
    (item) =>
      item.dictType === dictCode && String(item.dictValue) === String(value)
  );
  return matched ? String(matched.dictLabel ?? value) : undefined;
}

function resolveDictMetaFromCache(dictCode: string, value: unknown) {
  if (!dictCode || value == null || value === '') return undefined;
  const allDict = queryClient.getQueryData<DictDataItem[]>(
    DICT_DATA_ALL_QUERY_KEY
  );
  if (!allDict) return undefined;
  return allDict.find(
    (item) =>
      item.dictType === dictCode && String(item.dictValue) === String(value)
  );
}

function resolveDictFieldColor(
  field: Record<string, any>,
  rowData: Record<string, any>
) {
  const fieldKey = String(resolveFieldValue(field, 'fieldKey') ?? '').trim();
  const dataKey = snakeToCamel(fieldKey);
  const candidates = [
    `${dataKey}Color`,
    `${dataKey}TagColor`,
    `${dataKey}DictColor`,
    `${fieldKey}Color`,
    `${fieldKey}_color`,
    `${fieldKey}_tag_color`,
    'color',
  ].filter(Boolean);

  for (const key of candidates) {
    const value = rowData[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

// 解析字典选项文案（静态 options 优先，fallback 到字典缓存）
function resolveDictLabel(
  field: Record<string, any>,
  value: unknown
): string | undefined {
  if (value == null || value === '') return undefined;

  // 1. 静态 options 数组
  const options = field.options;
  if (Array.isArray(options)) {
    const matched = options.find((item) => {
      if (!item || typeof item !== 'object') return false;
      return String((item as Record<string, any>).value) === String(value);
    }) as Record<string, any> | undefined;
    if (matched) return String(matched.label ?? value);
  }

  // 2. dictCode → 全局字典缓存
  const dictCode = field.dictCode || field.dict_code;
  if (dictCode) {
    const label = resolveDictLabelFromCache(String(dictCode), value);
    if (label) return label;
  }

  return undefined;
}

function resolveDictMeta(
  field: Record<string, any>,
  rowData: Record<string, any>,
  value: unknown
) {
  if (value == null || value === '') {
    return {
      label: '--',
      dictType: String(field.dictCode ?? field.dict_code ?? ''),
      color: undefined,
      semanticColor: undefined,
    };
  }

  const options = field.options;
  if (Array.isArray(options)) {
    const matched = options.find((item) => {
      if (!item || typeof item !== 'object') return false;
      return String((item as Record<string, any>).value) === String(value);
    }) as Record<string, any> | undefined;

    if (matched) {
      return {
        label: String(matched.label ?? value),
        dictType: String(field.dictCode ?? field.dict_code ?? ''),
        color:
          resolveDictFieldColor(field, rowData) ??
          (typeof matched.color === 'string' ? matched.color : undefined),
        semanticColor: matched.semanticColor as DictDataItem['semanticColor'],
      };
    }
  }

  const dictType = String(field.dictCode ?? field.dict_code ?? '');
  const matched = resolveDictMetaFromCache(dictType, value);

  return {
    label: String(matched?.dictLabel ?? value),
    dictType,
    color:
      resolveDictFieldColor(field, rowData) ??
      (typeof matched?.color === 'string' ? matched.color : undefined),
    semanticColor: matched?.semanticColor,
  };
}

function isDictTagField(field: Record<string, any>, fieldType: string) {
  return (
    fieldType === 'dict' ||
    Boolean(String(field.dictCode ?? field.dict_code ?? '').trim())
  );
}

// 根据字段类型解析详情抽屉文本
function resolveDetailTextByFieldType(
  field: Record<string, any>,
  rowData: Record<string, any>,
  cellData: unknown
) {
  const fieldType = String(
    resolveFieldValue(field, 'fieldType') ?? ''
  ).toLowerCase();

  if (
    fieldType === 'by' ||
    fieldType === 'createuser' ||
    fieldType === 'updateuser'
  ) {
    const auditUser = resolveAuditUser(field, rowData);
    return String(
      auditUser?.nickName ?? auditUser?.userName ?? cellData ?? '--'
    );
  }

  if (
    fieldType === 'text' ||
    fieldType === 'input' ||
    fieldType === 'textarea'
  ) {
    return cellData == null || cellData === '' ? '--' : String(cellData);
  }

  if (fieldType === 'switch') {
    const v = String(cellData ?? '');
    if (v === '1' || v === 'true') return '是';
    if (v === '0' || v === 'false') return '否';
    return v || '--';
  }

  if (fieldType === 'number') {
    return cellData == null || cellData === '' ? '--' : String(cellData);
  }

  if (fieldType === 'date') {
    return formatTimestampText(cellData, { dateOnly: true });
  }

  if (fieldType === 'datetime') {
    return formatTimestampText(cellData);
  }

  if (fieldType === 'dict' || fieldType === 'select') {
    return resolveDictLabel(field, cellData) ?? String(cellData ?? '--');
  }

  if (fieldType === 'user') {
    return String(rowData.nickName ?? rowData.userName ?? cellData ?? '--');
  }

  if (
    fieldType === 'image' ||
    fieldType === 'picture' ||
    fieldType === 'avatar'
  ) {
    return cellData == null || cellData === '' ? '--' : String(cellData);
  }

  return cellData == null || cellData === '' ? '--' : String(cellData);
}

// 根据字段类型解析单元格渲染器
function resolveCellRendererByFieldType(field: Record<string, any>) {
  const fieldType = String(
    resolveFieldValue(field, 'fieldType') ?? ''
  ).toLowerCase();

  if (fieldType === 'file') {
    return ({
      rowData,
      cellData,
    }: {
      rowData: Record<string, any>;
      cellData: string | number | null;
    }) => {
      const fileInfoKey = resolveFileInfoKey(field);
      const attachment = rowData[fileInfoKey];
      return h(FileCell, {
        row: rowData,
        value: cellData,
        attachments: attachment ? [attachment] : [],
      });
    };
  }

  if (
    fieldType === 'image' ||
    fieldType === 'picture' ||
    fieldType === 'avatar'
  ) {
    return ({ cellData }: { cellData: unknown }) =>
      h(PictureCell, {
        urls: resolveImageUrls(cellData),
      });
  }

  if (fieldType === 'user') {
    return ({
      rowData,
      cellData,
    }: {
      rowData: Record<string, any>;
      cellData: string | number | null;
    }) =>
      h(UserCell, {
        row: rowData,
        value: cellData,
        userId: rowData.userId,
        ...rowData,
      });
  }

  if (
    fieldType === 'by' ||
    fieldType === 'createuser' ||
    fieldType === 'updateuser'
  ) {
    return ({
      rowData,
      cellData,
    }: {
      rowData: Record<string, any>;
      cellData: unknown;
    }) => {
      const auditUser = resolveAuditUser(field, rowData);
      if (!auditUser) return h('div', '--');
      // 审计列统一使用后端增强后的操作人对象，避免误用当前行用户数据
      return h(UserCell, {
        ...auditUser,
        row: auditUser,
        value: cellData,
      });
    };
  }
  if (fieldType === 'textarea') {
    return ({ cellData }: { cellData: unknown }) => {
      const text =
        cellData == null || cellData === '' ? '--' : String(cellData);
      return h(
        ElTooltip,
        {
          content: text,
          placement: 'right',
          showAfter: 300,
          popperStyle: {
            maxWidth: '500px',
            maxHeight: '500px',
            overflow: 'auto',
          },
        },
        {
          default: () =>
            h(
              'span',
              {
                style: {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                  cursor: 'pointer',
                },
              },
              text
            ),
        }
      );
    };
  }

  if (fieldType === 'text' || fieldType === 'input') {
    return ({ cellData }: { cellData: unknown }) =>
      h(
        'span',
        {},
        cellData == null || cellData === '' ? '--' : String(cellData)
      );
  }

  if (fieldType === 'date') {
    return ({ cellData }: { cellData: unknown }) =>
      h('span', {}, formatTimestampText(cellData, { dateOnly: true }));
  }

  if (fieldType === 'datetime') {
    return ({ cellData }: { cellData: unknown }) =>
      h('span', {}, formatTimestampText(cellData));
  }

  if (fieldType === 'switch') {
    return ({ cellData }: { cellData: unknown }) => {
      const v = String(cellData ?? '');
      if (v === '1' || v === 'true') return h('span', {}, '是');
      if (v === '0' || v === 'false') return h('span', {}, '否');
      return h('span', {}, v || '--');
    };
  }

  if (fieldType === 'number') {
    return ({ cellData }: { cellData: unknown }) =>
      h(
        'span',
        {},
        cellData == null || cellData === '' ? '--' : String(cellData)
      );
  }

  if (fieldType === 'dict' || fieldType === 'select') {
    return ({
      rowData,
      cellData,
    }: {
      rowData: Record<string, any>;
      cellData: unknown;
    }) => {
      if (!isDictTagField(field, fieldType)) {
        return h(
          'span',
          {},
          resolveDictLabel(field, cellData) ?? String(cellData ?? '--')
        );
      }

      const meta = resolveDictMeta(field, rowData, cellData);
      return h(DictTag, {
        dictType: meta.dictType,
        value: cellData as string | number | null,
        label: meta.label,
        color: meta.color,
        semanticColor: meta.semanticColor,
      });
    };
  }

  return ({ cellData: _cellData }: { cellData: unknown }) =>
    h('div', '未找到对应类型 =>' + fieldType);
}

// 将字段配置转换为表格列（支持 i18n key 查找）
export function mapFieldConfigRowsToColumns(
  rows: Record<string, any>[],
  t?: (key: string) => string
) {
  return rows.map((col): ColumnsItem => {
    const fieldType = String(
      resolveFieldValue(col, 'fieldType') ?? ''
    ).toLowerCase();
    const rawTitle = resolveFieldValue(col, 'fieldName') ?? '--';
    const labelKey = resolveFieldValue(col, 'labelKey') as string | undefined;
    const configuredWidth = Number(resolveFieldValue(col, 'width'));
    // i18n key 优先，field_name 兜底；t() 找不到翻译时返回 key 本身，需排除
    let title = rawTitle;
    if (t && labelKey) {
      const translated = t(labelKey);
      if (translated && translated !== labelKey) {
        title = translated;
      }
    }

    const defaultWidth = 200;
    return {
      width:
        Number.isFinite(configuredWidth) && configuredWidth > 0
          ? configuredWidth
          : defaultWidth,
      title,
      key: col.id ?? '--',
      dataKey: snakeToCamel(resolveFieldValue(col, 'fieldKey') ?? '--'),
      fixed: normalizeColumnFixed(resolveFieldValue(col, 'fixed')),
      fieldType,
      detailTextFormatter: (rowData, cellData) =>
        resolveDetailTextByFieldType(col, rowData, cellData),
      cellRenderer: resolveCellRendererByFieldType(col),
    };
  });
}

// props.columns 优先；否则按 entityKey 拉字段配置并合并 `{dataKey}Col` 插槽
export function useTableColumns(
  props: TableEntlty,
  slots: Slots,
  tableLoading: Ref<boolean>,
  selectionColumn: ComputedRef<ColumnsItem>
) {
  const tableColumns = ref<ColumnsItem[]>([]);
  const businessColumns = ref<ColumnsItem[]>([]);
  const fieldConfigRows = ref<Record<string, any>[]>([]);

  // 组装业务列并合并插槽
  function buildBusinessColumns(columns: ColumnsItem[]) {
    return applyColumnSlots(
      columns.map((c) => ({ ...c })),
      slots
    );
  }

  // 组装 tableColumns（含可选选择列）
  function setTableColumns(columns: ColumnsItem[]) {
    businessColumns.value = columns;
    tableColumns.value = props.selectable
      ? [selectionColumn.value, ...columns]
      : columns;
  }

  // 初始化列配置
  async function initColumns() {
    try {
      if (props.columns?.length) {
        fieldConfigRows.value = Array.isArray(props.fieldConfigRows)
          ? [...props.fieldConfigRows]
          : [];
        setTableColumns(buildBusinessColumns(props.columns));
        return;
      }
      if (!props?.entityKey) {
        console.warn('请提供 entityKey 或 columns');
        return;
      }
      tableLoading.value = true;
      const list = await getByEntityKeyAndFieldKeyApi(props.entityKey || '');
      const responseData: Record<string, any>[] = Array.isArray(list?.data)
        ? list.data
        : [];
      fieldConfigRows.value = Array.isArray(responseData) ? responseData : [];

      if (!isEmptyValue(responseData)) {
        const columns = mapFieldConfigRowsToColumns(responseData);
        setTableColumns(buildBusinessColumns(columns));
        return;
      }

      setTableColumns([]);
    } catch (error) {
      console.error('Failed to load field config:', error);
    } finally {
      tableLoading.value = false;
    }
  }

  // 重新拉取列配置
  async function reloadColumns() {
    await initColumns();
  }

  watch(
    () => props.columns,
    () => {
      if (props.columns?.length) void initColumns();
    },
    { deep: true }
  );

  watch(
    () => props.fieldConfigRows,
    () => {
      if (props.columns?.length) {
        fieldConfigRows.value = Array.isArray(props.fieldConfigRows)
          ? [...props.fieldConfigRows]
          : [];
      }
    },
    { deep: true }
  );

  watch(
    () => props.entityKey,
    () => {
      if (!props.columns?.length && props.entityKey) void initColumns();
    }
  );

  return {
    tableColumns,
    businessColumns,
    fieldConfigRows,
    initColumns,
    reloadColumns,
  };
}
