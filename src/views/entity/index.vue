<template>
  <div class="field-config-page">
    <!-------------------------- 页面头部 -------------------------->
    <section class="field-config-page__header">
      <div>
        <h2 class="field-config-page__title">{{ t('fieldConfig.title') }}</h2>
        <p class="field-config-page__subtitle">
          {{ t('fieldConfig.searchSubtitle') }}
        </p>
      </div>

      <div class="field-config-page__actions">
        <el-button type="primary" @click="openCreate">
          {{ t('common.add') }}
        </el-button>
        <el-button :disabled="selectedKeys.length !== 1" @click="openEditBySelection">
          {{ t('common.edit') }}
        </el-button>
        <el-button type="danger" :disabled="selectedKeys.length === 0" @click="deleteSelected">
          {{ t('common.delete') }}
        </el-button>
      </div>
    </section>

    <!-------------------------- 查询区域 -------------------------->
    <section class="field-config-page__filter">
      <el-form :model="filterForm" label-position="top" class="field-config-page__filter-form">
        <el-form-item :label="t('fieldConfig.entityKey')">
          <el-input
            v-model="filterForm.entityKey"
            clearable
            :placeholder="t('validation.enterField', { field: t('fieldConfig.entityKey') })"
            @keyup.enter="reloadTable"
          />
        </el-form-item>

        <el-form-item :label="t('fieldConfig.fieldKey')">
          <el-input
            v-model="filterForm.fieldKey"
            clearable
            :placeholder="t('validation.enterField', { field: t('fieldConfig.fieldKey') })"
            @keyup.enter="reloadTable"
          />
        </el-form-item>

        <el-form-item :label="t('fieldConfig.fieldName')">
          <el-input
            v-model="filterForm.fieldName"
            clearable
            :placeholder="t('validation.enterField', { field: t('fieldConfig.fieldName') })"
            @keyup.enter="reloadTable"
          />
        </el-form-item>

        <el-form-item :label="t('fieldConfig.fieldType')">
          <el-select
            v-model="filterForm.fieldType"
            clearable
            :placeholder="t('validation.selectField', { field: t('fieldConfig.fieldType') })"
          >
            <el-option
              v-for="option in fieldTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <div class="field-config-page__filter-actions">
        <el-button type="primary" @click="reloadTable">
          {{ t('common.search') }}
        </el-button>
        <el-button @click="resetFilters">{{ t('common.reset') }}</el-button>
      </div>
    </section>

    <!-------------------------- 列表区域 -------------------------->
    <section class="field-config-page__table">
      <TableEntity
        ref="tableRef"
        v-model:selected-keys="selectedKeys"
        v-model:current-page="currentPage"
        :data="fetchFieldConfigList"
        :columns="columns"
        :row-action-column="rowActionColumn"
        :detail-render-map="detailRenderMap"
        row-key="id"
        :page-size="pageSize"
        :height="560"
        selectable
        multiple
        show-pagination
        show-column-settings
        @selection-change="onSelectionChange"
      />
    </section>

    <!-------------------------- 表单抽屉 -------------------------->
    <FieldConfigForm
      v-model:visible="formVisible"
      :is-create="isCreate"
      :record="currentRecord"
      :record-list="tableRows"
      :initial-index="currentRecordIndex"
      @save="handleSaveSuccess"
      @cancel="formVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, h, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, ElTag } from 'element-plus';
import { useI18n } from 'vue-i18n';
import TableEntity from '@/components/table-entity/index.vue';
import type {
  ColumnsItem,
  DetailRenderMap,
  TableListQuery,
} from '@/components/table-entity/index.type';
import ActionColumn from '@/features/multiview/components/action-column.vue';
import FieldConfigForm from '@/features/entities/fieldConfig/form/index.vue';
import {
  assertAjaxOk,
  deleteFieldConfig,
  getFieldConfig,
  listFieldConfig,
} from '@/api/modules/fieldConfig';
import type { FieldConfig, FieldConfigQuery } from '@/types/field-config';

/******************************** 基础状态 ********************************/

const { t } = useI18n();

const tableRef = ref<InstanceType<typeof TableEntity>>();
const currentPage = ref<number>(1);
const pageSize = 20;
const selectedKeys = ref<Array<number | string>>([]);
const selectedRows = ref<FieldConfig[]>([]);
const tableRows = ref<FieldConfig[]>([]);
const formVisible = ref<boolean>(false);
const isCreate = ref<boolean>(true);
const currentRecord = ref<Record<string, unknown>>();
const currentRecordIndex = ref<number>(0);

const filterForm = reactive({
  entityKey: '',
  fieldKey: '',
  fieldName: '',
  fieldType: '',
});

/******************************** 字典选项 ********************************/

const fieldTypeOptions = computed(() => [
  { label: t('fieldConfig.typeInput'), value: 'input' },
  { label: t('fieldConfig.typeSelect'), value: 'select' },
  { label: t('fieldConfig.typeDate'), value: 'date' },
  { label: t('fieldConfig.typeDatetime'), value: 'datetime' },
  { label: t('fieldConfig.typeTextarea'), value: 'textarea' },
  { label: t('fieldConfig.typeNumber'), value: 'number' },
  { label: t('fieldConfig.typeSwitch'), value: 'switch' },
]);

/******************************** 展示映射 ********************************/

// 字段类型文案映射
function formatFieldType(value: unknown) {
  const text = String(value ?? '');
  const map: Record<string, string> = {
    input: t('fieldConfig.typeInput'),
    select: t('fieldConfig.typeSelect'),
    date: t('fieldConfig.typeDate'),
    datetime: t('fieldConfig.typeDatetime'),
    textarea: t('fieldConfig.typeTextarea'),
    number: t('fieldConfig.typeNumber'),
    switch: t('fieldConfig.typeSwitch'),
  };
  return map[text] ?? text ?? '--';
}

// 是否值文案映射
function formatBooleanText(value: unknown) {
  return Number(value ?? 0) === 1 ? t('common.yes') : t('common.no');
}

// 固定列文案映射
function formatFixedText(value: unknown) {
  const text = String(value ?? '');
  if (!text) return t('fieldConfig.fixedNone');
  if (text === 'left') return t('fieldConfig.fixedLeft');
  if (text === 'right') return t('fieldConfig.fixedRight');
  return text;
}

// 时间格式化
function formatTimestamp(value: unknown) {
  if (!value) return '--';
  const date = new Date(Number(value));
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/******************************** 表格列 ********************************/

const columns = computed<ColumnsItem[]>(() => [
  {
    key: 'id',
    dataKey: 'id',
    title: t('fieldConfig.id'),
    width: 90,
  },
  {
    key: 'entityKey',
    dataKey: 'entityKey',
    title: t('fieldConfig.entityKey'),
    width: 140,
  },
  {
    key: 'fieldKey',
    dataKey: 'fieldKey',
    title: t('fieldConfig.fieldKey'),
    width: 160,
  },
  {
    key: 'fieldName',
    dataKey: 'fieldName',
    title: t('fieldConfig.fieldName'),
    width: 160,
  },
  {
    key: 'fieldType',
    dataKey: 'fieldType',
    title: t('fieldConfig.fieldType'),
    width: 120,
    cellRenderer: ({ cellData }) =>
      h(
        ElTag,
        { size: 'small', type: 'info' },
        () => formatFieldType(cellData)
      ),
  },
  {
    key: 'dictCode',
    dataKey: 'dictCode',
    title: t('fieldConfig.dictCode'),
    width: 140,
  },
  {
    key: 'selectEntityKey',
    dataKey: 'selectEntityKey',
    title: t('fieldConfig.selectEntityKey'),
    width: 150,
  },
  {
    key: 'sort',
    dataKey: 'sort',
    title: t('fieldConfig.sort'),
    width: 90,
  },
  {
    key: 'isFuzzySearch',
    dataKey: 'isFuzzySearch',
    title: t('fieldConfig.isFuzzySearch'),
    width: 110,
    cellRenderer: ({ cellData }) => formatBooleanText(cellData),
  },
  {
    key: 'isVisible',
    dataKey: 'isVisible',
    title: t('fieldConfig.isVisible'),
    width: 90,
    cellRenderer: ({ cellData }) => formatBooleanText(cellData),
  },
  {
    key: 'fixed',
    dataKey: 'fixed',
    title: t('fieldConfig.fixed'),
    width: 100,
    cellRenderer: ({ cellData }) => formatFixedText(cellData),
  },
  {
    key: 'updatedTime',
    dataKey: 'updatedTime',
    title: t('fieldConfig.updatedTime'),
    width: 180,
    cellRenderer: ({ cellData }) => formatTimestamp(cellData),
  },
]);

const detailRenderMap = computed<DetailRenderMap>(() => ({
  fieldType: ({ row }) => h('span', formatFieldType(row.fieldType)),
  isFuzzySearch: ({ row }) => h('span', formatBooleanText(row.isFuzzySearch)),
  isVisible: ({ row }) => h('span', formatBooleanText(row.isVisible)),
  fixed: ({ row }) => h('span', formatFixedText(row.fixed)),
  createdTime: ({ row }) => h('span', formatTimestamp(row.createdTime)),
  updatedTime: ({ row }) => h('span', formatTimestamp(row.updatedTime)),
}));

/******************************** 行内操作 ********************************/

const rowActions = {
  view: (row?: Record<string, any>) => {
    if (!row) return;
    tableRef.value?.openDetail(row);
  },
  edit: async (row?: Record<string, any>) => {
    if (!row) return;
    await openEdit(row);
  },
  copy: async (row?: Record<string, any>) => {
    if (!row) return;
    await openCopy(row);
  },
  delete: async (row?: Record<string, any>) => {
    if (!row?.id) return;
    await deleteRows([row.id]);
  },
  refresh: () => reloadTable(),
};

const primaryRowActions = computed(() => [
  { key: 'view', label: t('common.view'), actionKey: 'view', order: 10 },
  { key: 'edit', label: t('common.edit'), actionKey: 'edit', order: 20 },
  { key: 'copy', label: t('common.copy'), actionKey: 'copy', order: 30 },
  {
    key: 'delete',
    label: t('common.delete'),
    actionKey: 'delete',
    order: 40,
    danger: true,
  },
]);

const rowActionColumn = computed<ColumnsItem>(() => ({
  key: '__ops__',
  dataKey: '__ops__',
  title: t('common.operation'),
  width: 180,
  align: 'right' as const,
  cellRenderer: ({ rowData }) =>
    h(ActionColumn, {
      row: rowData,
      actions: rowActions,
      primaryActions: primaryRowActions.value,
      extraActions: [],
      onRefresh: reloadTable,
    }),
}));

/******************************** 数据方法 ********************************/

// 获取当前查询参数
function buildQuery(query: TableListQuery): FieldConfigQuery {
  return {
    pageNum: query.pageNum,
    pageSize: query.pageSize,
    entityKey: filterForm.entityKey || undefined,
    fieldKey: filterForm.fieldKey || undefined,
    fieldName: filterForm.fieldName || undefined,
    fieldType: filterForm.fieldType || undefined,
  };
}

// 拉取字段配置列表
async function fetchFieldConfigList(query: TableListQuery) {
  const response = (await listFieldConfig(buildQuery(query))) as {
    code?: number;
    msg?: string;
    total?: number;
    rows?: FieldConfig[];
  };

  assertAjaxOk(response);
  const rows = response.rows ?? [];
  tableRows.value = rows;

  return {
    total: Number(response.total ?? rows.length),
    rows,
  };
}

// 刷新表格
function reloadTable() {
  currentPage.value = 1;
  void tableRef.value?.reload();
}

// 重置筛选
function resetFilters() {
  filterForm.entityKey = '';
  filterForm.fieldKey = '';
  filterForm.fieldName = '';
  filterForm.fieldType = '';
  reloadTable();
}

// 获取完整记录详情
async function loadRecord(id: number | string) {
  const response = (await getFieldConfig(id)) as {
    code?: number;
    msg?: string;
    data?: FieldConfig;
  };

  assertAjaxOk(response);
  return response.data ?? {};
}

/******************************** 操作方法 ********************************/

// 更新勾选行
function onSelectionChange(rows: Record<string, any>[]) {
  selectedRows.value = rows as FieldConfig[];
}

// 打开新增
function openCreate() {
  isCreate.value = true;
  currentRecord.value = undefined;
  currentRecordIndex.value = 0;
  formVisible.value = true;
}

// 打开编辑
async function openEdit(row?: Record<string, any>) {
  const target = row ?? selectedRows.value[0];
  if (!target?.id) {
    ElMessage.warning(t('fieldConfig.selectOneToEdit'));
    return;
  }

  isCreate.value = false;
  currentRecordIndex.value = tableRows.value.findIndex(
    (item) => Number(item.id) === Number(target.id)
  );
  currentRecord.value = await loadRecord(target.id);
  formVisible.value = true;
}

// 按勾选打开编辑
async function openEditBySelection() {
  await openEdit(selectedRows.value[0]);
}

// 打开复制
async function openCopy(row: Record<string, any>) {
  if (!row?.id) return;

  const detail = await loadRecord(row.id);
  const copiedRecord = { ...detail };
  delete copiedRecord.id;

  isCreate.value = true;
  currentRecordIndex.value = tableRows.value.findIndex(
    (item) => Number(item.id) === Number(row.id)
  );
  currentRecord.value = copiedRecord;
  formVisible.value = true;
}

// 删除多条记录
async function deleteRows(ids: Array<number | string>) {
  await ElMessageBox.confirm(
    t('fieldConfig.deleteConfirm'),
    t('common.confirm'),
    {
      type: 'warning',
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
    }
  );

  const response = await deleteFieldConfig(ids);
  assertAjaxOk(response as { code?: number; msg?: string });
  ElMessage.success(t('fieldConfig.deleteSuccess'));
  selectedKeys.value = [];
  selectedRows.value = [];
  void tableRef.value?.reload();
}

// 删除勾选数据
async function deleteSelected() {
  if (!selectedKeys.value.length) return;
  await deleteRows(selectedKeys.value);
}

// 保存成功后刷新
function handleSaveSuccess(data: Record<string, unknown>) {
  formVisible.value = false;
  ElMessage.success(
    isCreate.value ? t('fieldConfig.addSuccess') : t('fieldConfig.editSuccess')
  );

  if (data.id) {
    currentRecord.value = data;
  }

  void tableRef.value?.reload();
}
</script>

<style scoped lang="scss">
.field-config-page {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  background: var(--color-bg-page);
}

.field-config-page__header,
.field-config-page__filter,
.field-config-page__table {
  padding: 20px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 18px;
  background: var(--color-bg-card);
  box-shadow: 0 10px 30px rgb(15 23 42 / 6%);
}

.field-config-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.field-config-page__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-text-primary);
}

.field-config-page__subtitle {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.field-config-page__actions,
.field-config-page__filter-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.field-config-page__filter {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.field-config-page__filter-form {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0 16px;
}

@media (max-width: 960px) {
  .field-config-page {
    padding: 14px;
  }

  .field-config-page__header,
  .field-config-page__filter {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
