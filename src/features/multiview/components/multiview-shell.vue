<template>
  <div class="multiview-shell">
    <!-------------------------- 页面头部 -------------------------->
    <section class="multiview-shell__header">
      <div>
        <h2 class="multiview-shell__title">{{ pageTitle }}</h2>
        <p class="multiview-shell__subtitle">
          {{ entityKey }} · {{ t('common.total', { count: total }) }}
        </p>
      </div>

      <div v-if="!hideHeaderActions" class="multiview-shell__actions">
        <el-button
          v-if="resolvedActions.showCreate"
          type="primary"
          @click="emit('create')"
        >
          {{ resolvedActions.createName }}
        </el-button>
        <el-button
          v-if="resolvedActions.showDelete"
          type="danger"
          :disabled="selectedKeys.length === 0"
          @click="onDeleteSelected"
        >
          {{ t('common.delete') }}
        </el-button>
        <el-button v-if="resolvedActions.showImport" @click="openImportDialog">
          {{ t('common.import') }}
        </el-button>
        <el-button
          v-if="resolvedActions.showExport"
          @click="emit('export', { entityKey, params: requestParams })"
        >
          {{ t('common.export') }}
        </el-button>
      </div>
    </section>

    <!-------------------------- 筛选区域 -------------------------->
    <section
      v-if="showFilters && filterFields.length"
      class="multiview-shell__filter"
    >
      <el-form
        :model="filterForm"
        label-position="top"
        class="multiview-shell__filter-form"
      >
        <el-form-item
          v-for="field in filterFields"
          :key="field.key"
          :label="field.label"
          class="multiview-shell__filter-item"
        >
          <el-input
            v-if="field.component === 'input'"
            v-model="filterForm[field.key]"
            :placeholder="field.placeholder || t('common.enterKeyword')"
            clearable
            @keyup.enter="search"
          />

          <el-select
            v-else-if="field.component === 'select'"
            v-model="filterForm[field.key]"
            :placeholder="field.placeholder || t('common.pleaseSelect')"
            clearable
          >
            <el-option
              v-for="option in field.options ?? []"
              :key="String(option.value)"
              :label="option.label"
              :value="option.value"
            />
          </el-select>

          <AsyncSelect
            v-else-if="field.component === 'async-select'"
            v-model="filterForm[field.key]"
            :entity-config="field.entityConfig"
            :value-key="field.valueKey || 'value'"
            :label-key="field.labelKey || 'label'"
            :drag-key="field.dragKey"
            :placeholder="field.placeholder || t('common.pleaseSelect')"
          />

          <el-date-picker
            v-else-if="field.component === 'date'"
            v-model="filterForm[field.key]"
            type="date"
            :placeholder="field.placeholder || t('common.pleaseSelect')"
            clearable
          />
        </el-form-item>
      </el-form>

      <div class="multiview-shell__filter-actions">
        <el-button v-if="showSearchButton" type="primary" @click="search">
          {{ t('common.search') }}
        </el-button>
        <el-button v-if="showResetButton" @click="reset">
          {{ t('common.reset') }}
        </el-button>
      </div>
    </section>

    <!-------------------------- 表格区域 -------------------------->
    <section class="multiview-shell__table-card">
      <TableEntlty
        ref="tableRef"
        v-model:selected-keys="selectedKeys"
        v-model:current-page="currentPage"
        v-model:hidden-column-keys="hiddenColumnKeys"
        :entity-key="entityKey"
        :data="fetchTableData"
        :data-params="requestParams"
        :row-key="tableConfig.rowKey || rowKey"
        :height="tableConfig.height || 520"
        :width="tableConfig.width"
        :page-size="pageSize"
        :selectable="effectiveShowSelection"
        :multiple="tableConfig.multiple ?? true"
        :columns="tableConfig.columns || []"
        :row-action-column="actionColumn"
        :show-pagination="!hidePagination"
        :show-column-settings="tableConfig.showColumnSettings ?? true"
        :detail-drawer-title="detailConfig.title"
        :detail-drawer-width="detailConfig.width"
        :detail-visible-count="detailConfig.visibleCount"
        :detail-hidden-keys="detailConfig.hiddenKeys"
        @selection-change="onSelectionChange"
        @page-change="onPageChange"
        @delete-success="onTableDeleteSuccess"
      />
    </section>

    <!-------------------------- 导入弹窗 -------------------------->
    <ImportDialog
      v-model="importDialogVisible"
      :title="importDialogTitle"
      :target-fields="importTargetFields"
      :accept="['.xls', '.xlsx', '.csv']"
      :parse-file="parseImportFile"
      :submit-import="submitImportData"
      @download-template="onDownloadTemplate"
      @success="onImportSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import AsyncSelect from '@/components/async-select/async-select.vue';
import TableEntlty from '@/components/table-entity/index.vue';
import ImportDialog from '@/components/import-dialog';
import { getByEntityKeyAndFieldKeyApi, getListByEntityKeyApi } from '@/api/modules/user';
import {
  getEntityActionsConfig,
  getEntityConfig,
  getEntityTableConfig,
} from '@/utils/entity-config';
import type {
  EntityDetailConfig,
  EntityFilterFieldConfig,
  EntityTableConfig,
} from '@/types/entity-config';
import type { FieldConfig } from '@/types/user';
import type { TableListQuery } from '@/components/table-entity/index.type';
import type {
  ImportDialogMappingItem,
  ImportDialogParsePayload,
  ImportDialogParseResult,
  ImportDialogSubmitPayload,
  ImportDialogSubmitResult,
  ImportDialogTargetField,
} from '@/components/import-dialog';
import type { FilterFormValue } from '@/features/multiview/types';
import { useMultiviewActions } from '@/features/multiview/composables/use-multiview-actions';

/******************************** 类型 ********************************/

export interface MultiviewExportPayload {
  entityKey: string;
  params: Record<string, string | number | boolean | undefined>;
}

/******************************** 组件入参 ********************************/

const props = withDefaults(
  defineProps<{
    entityKey: string;
    cacheKey?: string;
    title?: string;
    rowKey?: string;
    pageSize?: number;
    showFilters?: boolean;
    showSelection?: boolean;
    hidePagination?: boolean;
    hideHeaderActions?: boolean;
    showSearchButton?: boolean;
    showResetButton?: boolean;
  }>(),
  {
    cacheKey: '',
    title: '',
    rowKey: 'id',
    pageSize: 20,
    showFilters: true,
    showSelection: true,
    hidePagination: false,
    hideHeaderActions: false,
    showSearchButton: true,
    showResetButton: true,
  }
);

const emit = defineEmits<{
  create: [];
  edit: [row: Record<string, any> | undefined];
  copy: [row: Record<string, any> | undefined];
  export: [payload: MultiviewExportPayload];
  'selection-change': [rows: Record<string, any>[]];
}>();

const { t } = useI18n();

/******************************** 基础状态 ********************************/

const tableRef = ref<InstanceType<typeof TableEntlty>>();
const selectedKeys = ref<any[]>([]);
const selectedRows = ref<Record<string, any>[]>([]);
const hiddenColumnKeys = ref<string[]>([]);
const currentPage = ref<number>(1);
const total = ref<number>(0);
const filterForm = reactive<Record<string, FilterFormValue>>({});
const importDialogVisible = ref(false);
const importTargetFields = ref<ImportDialogTargetField[]>([]);
const backendFieldConfigs = ref<FieldConfig[]>([]);

const entityConfig = computed(() => getEntityConfig(props.entityKey));

const hasEntityConfig = computed(() => Boolean(entityConfig.value));

const resolvedActions = computed(() => {
  if (!hasEntityConfig.value) {
    return {
      showCreate: false,
      createName: t('common.add'),
      showEdit: false,
      showCopy: false,
      showDelete: false,
      showImport: true,
      showExport: true,
    };
  }

  return getEntityActionsConfig(props.entityKey);
});

const tableConfig = computed<EntityTableConfig>(() =>
  getEntityTableConfig(props.entityKey)
);

const detailConfig = computed<EntityDetailConfig>(
  () => entityConfig.value?.detail ?? {}
);

const pageSize = computed<number>(
  () => tableConfig.value.pageSize ?? props.pageSize
);

const pageTitle = computed<string>(
  () => props.title || entityConfig.value?.title || props.entityKey
);

const importDialogTitle = computed(() => `${pageTitle.value}${t('common.import')}`);

const effectiveShowSelection = computed(
  () => hasEntityConfig.value && props.showSelection
);

// 判断字段是否启用模糊查询
function isFuzzyField(field: FieldConfig) {
  return (
    field.isFuzzySearch === true ||
    Number(field.isFuzzySearch ?? 0) === 1
  );
}

// 将后端字段配置转换为筛选项
function mapBackendFieldToFilter(field: FieldConfig): EntityFilterFieldConfig {
  const fieldType = String(field.fieldType ?? 'input').toLowerCase();

  if (fieldType === 'select') {
    return {
      key: field.fieldKey,
      label: field.fieldName,
      component: 'async-select',
      placeholder: t('common.pleaseSelect'),
      order: field.sort ?? 999,
      entityConfig: {
        entityKey: field.selectEntityKey ?? '',
      },
    };
  }

  if (fieldType === 'dict') {
    return {
      key: field.fieldKey,
      label: field.fieldName,
      component: 'async-select',
      placeholder: t('common.pleaseSelect'),
      order: field.sort ?? 999,
      entityConfig: {
        entityKey: field.selectEntityKey ?? '',
      },
    };
  }

  if (fieldType === 'text') {
    return {
      key: field.fieldKey,
      label: field.fieldName,
      component: 'input',
      placeholder: t('common.enterKeyword'),
      order: field.sort ?? 999,
    };
  }

  if (fieldType === 'date' || fieldType === 'datetime') {
    return {
      key: field.fieldKey,
      label: field.fieldName,
      component: 'date',
      placeholder: t('common.pleaseSelect'),
      order: field.sort ?? 999,
    };
  }

  return {
    key: field.fieldKey,
    label: field.fieldName,
    component: 'input',
    placeholder: t('common.enterKeyword'),
    order: field.sort ?? 999,
  };
}

const filterFields = computed<EntityFilterFieldConfig[]>(() => {
  const backendFilters = backendFieldConfigs.value
    .filter((field) => isFuzzyField(field))
    .map((field) => mapBackendFieldToFilter(field));

  if (backendFilters.length) {
    return backendFilters.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }

  if (!hasEntityConfig.value) {
    return [
      {
        key: 'keyword',
        label: t('common.keyword'),
        component: 'input',
        placeholder: t('common.enterKeyword'),
        order: 1,
      },
    ];
  }

  const fields = entityConfig.value?.filters?.fields ?? {};

  return Object.values(fields)
    .filter((field) => !field.hidden)
    .map((field) => ({
      ...field,
      component: field.component ?? 'input',
    }))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
});
setTimeout(() => {
  console.log(filterFields.value, 'filterFields');
}, 1000);

const requestParams = computed<
  Record<string, string | number | boolean | undefined>
>(() => buildRequestParams());

const data = computed(() => ({
  list: tableRows.value,
  total: total.value,
}));

const tableRows = ref<Record<string, any>[]>([]);

/******************************** 行内按钮 ********************************/

const rowActions = {
  view: openRowDetail,
  edit: editRow,
  copy: copyRow,
  delete: deleteRow,
  refresh: refetch,
};

const { actionColumn } = useMultiviewActions(
  computed(() => props.entityKey),
  rowActions,
  hasEntityConfig
);

/******************************** 数据方法 ********************************/

// 加载后端字段配置筛选项
async function loadBackendFieldConfigs() {
  if (!props.entityKey) {
    backendFieldConfigs.value = [];
    return;
  }

  try {
    const response = (await getByEntityKeyAndFieldKeyApi(
      props.entityKey
    )) as unknown as {
      data?: FieldConfig[];
    };

    backendFieldConfigs.value = Array.isArray(response.data)
      ? response.data
      : [];
  } catch (error) {
    backendFieldConfigs.value = [];
    console.error('failed to load backend field config filters', error);
  }
}

// 初始化筛选默认值
function initFilterForm() {
  for (const key of Object.keys(filterForm)) {
    delete filterForm[key];
  }

  for (const field of filterFields.value) {
    filterForm[field.key] = field.defaultValue;
  }
}

// 生成请求参数
function buildRequestParams() {
  const params: Record<string, string | number | boolean | undefined> = {};
  const defaultSort = tableConfig.value.defaultSort;

  for (const field of filterFields.value) {
    const value = filterForm[field.key];

    if (value === undefined || value === null || value === '') {
      continue;
    }

    if (value instanceof Date) {
      params[field.key] = value.toISOString();
      continue;
    }

    if (Array.isArray(value)) {
      params[field.key] = value
        .filter((item) => item !== undefined && item !== null && item !== '')
        .join(',');
      continue;
    }

    params[field.key] = value as string | number | boolean;
  }

  if (defaultSort?.field) {
    params.orderByColumn = defaultSort.field;
    params.isAsc = defaultSort.order ?? 'asc';
  }

  return params;
}

// 拉取表格数据
async function fetchTableData(query: TableListQuery) {
  const result = (await getListByEntityKeyApi(props.entityKey, {
    ...query,
    ...requestParams.value,
  })) as unknown as {
    total?: number;
    rows?: Record<string, any>[];
    data?: { total?: number; rows?: Record<string, any>[] };
  };

  const rows = result.rows ?? result.data?.rows ?? [];
  const nextTotal = Number(result.total ?? result.data?.total ?? rows.length);

  total.value = nextTotal;
  tableRows.value = rows;

  return {
    total: nextTotal,
    rows,
  };
}

/******************************** 事件方法 ********************************/

// 查询并回到第一页
function search() {
  currentPage.value = 1;
  void tableRef.value?.reload();
}

// 刷新当前列表
function refetch() {
  void tableRef.value?.reload();
}

// 打开行详情抽屉
function openRowDetail(row?: Record<string, any>) {
  if (!row) return;
  tableRef.value?.openDetail(row);
}

// 行内编辑复用页面编辑事件
function editRow(row?: Record<string, any>) {
  emit('edit', row);
}

// 行内复制复用页面复制事件
function copyRow(row?: Record<string, any>) {
  emit('copy', row);
}

// 行内删除复用表格内置删除确认
async function deleteRow(row?: Record<string, any>) {
  if (!row) return;
  await tableRef.value?.deleteRow(row);
}

// 打开导入弹窗并同步当前表格字段
function openImportDialog() {
  importTargetFields.value = buildImportTargetFields();
  importDialogVisible.value = true;
}

// 从当前表格列构建导入字段
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

// 读取导入文件文本内容
function readImportFileText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('read file failed'));
    reader.readAsText(file);
  });
}

// 轻量解析 CSV 行，满足通用导入组件预览联动
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

// 默认文件解析：优先按 CSV 文本预览，真实 Excel 解析可按实体替换为接口
async function parseImportFile(
  payload: ImportDialogParsePayload
): Promise<ImportDialogParseResult> {
  const text = await readImportFileText(payload.file);
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const headerCells = lines[0] ? splitCsvLine(lines[0]).filter(Boolean) : [];
  const fallbackHeaders = importTargetFields.value.map((field) => field.label);
  const headers = headerCells.length ? headerCells : fallbackHeaders;
  const previewColumns = headers.map((label, index) => ({
    prop: `col_${index}`,
    label,
    width: 140,
  }));
  const previewRows = lines.slice(1, 21).map((line) => {
    const cells = splitCsvLine(line);
    return previewColumns.reduce<Record<string, unknown>>((row, column, index) => {
      row[column.prop] = cells[index] ?? '';
      return row;
    }, {});
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

// 根据导入表头匹配目标字段
function buildImportMappings(headers: string[]): ImportDialogMappingItem[] {
  return importTargetFields.value.map((field) => {
    const sourceColumn =
      headers.find((header) => header === field.label || header === field.field) ?? '';

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

// 默认导入提交：先打通组件流程，后续实体可替换成真实后端接口
async function submitImportData(
  payload: ImportDialogSubmitPayload
): Promise<ImportDialogSubmitResult> {
  for (const progress of [20, 45, 70, 92]) {
    await new Promise((resolve) => window.setTimeout(resolve, 120));
    payload.onProgress?.(progress);
  }

  return {
    success: true,
    successCount: 0,
    failureCount: 0,
  };
}

// 下载模板占位
function onDownloadTemplate() {
  ElMessage.info(`${pageTitle.value}${t('components.importDialog.downloadTemplate')}`);
}

// 导入成功后刷新列表
function onImportSuccess() {
  ElMessage.success(t('common.success'));
  refetch();
}

// 重置筛选项
function reset() {
  initFilterForm();
  search();
}

// 清空选择态
function clearSelection() {
  selectedKeys.value = [];
  selectedRows.value = [];
  tableRef.value?.clearSelection();
}

// 记录表格分页
function onPageChange(page: number) {
  currentPage.value = page;
}

// 记录选中行
function onSelectionChange(rows: Record<string, any>[]) {
  selectedRows.value = rows;
  emit('selection-change', rows);
}

// 批量删除选中数据
async function onDeleteSelected() {
  const success = await tableRef.value?.deleteSelectedByEntityKey();

  if (success !== false) {
    clearSelection();
  }
}

// 表格删除后刷新选择态
function onTableDeleteSuccess() {
  clearSelection();
}

/******************************** 监听 ********************************/

watch(
  () => props.entityKey,
  async () => {
    clearSelection();
    hiddenColumnKeys.value = [];
    currentPage.value = 1;
    await loadBackendFieldConfigs();
    initFilterForm();
  },
  { immediate: true }
);

defineExpose({
  data,
  filterForm,
  selectedRows,
  selectedKeys,
  requestParams,
  refetch,
  search,
  reset,
  clearSelection,
});
</script>

<style scoped lang="scss">
.multiview-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.multiview-shell__header,
.multiview-shell__filter,
.multiview-shell__table-card {
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.multiview-shell__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0;
}

.multiview-shell__title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 20px;
  font-weight: 700;
}

.multiview-shell__subtitle {
  margin: 6px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.multiview-shell__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.multiview-shell__filter {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  padding: 0;
}

.multiview-shell__filter-form {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 14px;
}

.multiview-shell__filter-item {
  margin-bottom: 0;
}

.multiview-shell__filter-actions {
  display: flex;
  gap: 8px;
  padding-bottom: 2px;
}

.multiview-shell__table-card {
  padding: 0;
}

@media (max-width: 1024px) {
  .multiview-shell__header,
  .multiview-shell__filter {
    align-items: stretch;
    flex-direction: column;
  }

  .multiview-shell__actions,
  .multiview-shell__filter-actions {
    justify-content: flex-start;
  }

  .multiview-shell__filter-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .multiview-shell__filter-form {
    grid-template-columns: 1fr;
  }
}
</style>
