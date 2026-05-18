<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Search } from '@element-plus/icons-vue';
import { useQuery } from '@tanstack/vue-query';
import TableEntlty from '@/components/table-entity/index.vue';
import MultiviewFuzzyFilter from '@/features/multiview/components/multiview-fuzzy-filter.vue';
import { getByEntityKeyAndFieldKeyApi } from '@/api/modules/dynamic-entity';
import { resolveBackendFilterFields } from '@/features/entities/_shared/resolve-entity-filters';
import type { ColumnsItem } from '@/components/table-entity/index.type';
import type { EntityFilterFieldConfig } from '@/types/entity-config';
import type { FieldConfig } from '@/types/user';

const { t } = useI18n();

/******************************** 类型定义 ********************************/

export interface DialogListColumn extends ColumnsItem {}

export interface DialogListFetchParams {
  keyword?: string;
  page: number;
  pageSize: number;
  params?: Record<string, any>;
}

export interface DialogListFetchResult {
  items: Record<string, any>[];
  total: number;
}

/******************************** 组件入参 ********************************/

const props = withDefaults(
  defineProps<{
    entityKey?: string;
    visible: boolean;
    modelValue?: any | any[];
    multiple?: boolean;
    fetcher: (p: DialogListFetchParams) => Promise<DialogListFetchResult>;
    columns?: DialogListColumn[];
    rowKey?: string;
    dialogTitle?: string;
    dialogWidth?: string | number;
    tableHeight?: number;
    tableWidth?: number;
    pageSize?: number;
    queryKey?: string | string[];
    staleTime?: number;
    /** 外部传入的筛选参数（由 AsyncSelect 的模糊筛选表单产生） */
    filterParams?: Record<string, any>;
  }>(),
  {
    multiple: true,
    rowKey: 'id',
    dialogTitle: '',
    dialogWidth: '760px',
    tableHeight: 420,
    tableWidth: 700,
    pageSize: 20,
    staleTime: 5 * 60 * 1000,
    filterParams: () => ({}),
  }
);

const emit = defineEmits<{
  'update:visible': [v: boolean];
  'update:modelValue': [v: any | any[]];
  confirm: [rows: Record<string, any>[]];
}>();

/******************************** 表格引用 ********************************/

const tableRef = ref<InstanceType<typeof TableEntlty>>();

/******************************** 表格数据 ********************************/

const keyword = ref('');
const page = ref(1);
const selectedKeys = ref<any[]>([]);
const filterFields = ref<EntityFilterFieldConfig[]>([]);
const filterForm = reactive<Record<string, any>>({});
const filterLoading = ref(false);

const internalFilterParams = computed(() => {
  const params: Record<string, any> = {};
  for (const [key, value] of Object.entries(filterForm)) {
    if (value !== '' && value != null) {
      params[key] = value;
    }
  }
  return params;
});

const mergedFilterParams = computed(() => ({
  ...props.filterParams,
  ...internalFilterParams.value,
}));

const resolvedQueryKey = computed(() => {
  if (props.queryKey) {
    return Array.isArray(props.queryKey) ? props.queryKey : [props.queryKey];
  }
  if (props.entityKey) {
    return ['__dialog-list__', props.entityKey];
  }
  return ['__dialog-list__', props.rowKey, props.pageSize];
});

const dialogQueryKey = computed(() => [
  ...resolvedQueryKey.value,
  page.value,
  props.pageSize,
  keyword.value || '',
  JSON.stringify(mergedFilterParams.value),
]);

const resolvedGcTime = computed(() =>
  Math.max(props.staleTime, 10 * 60 * 1000)
);

const { data: queryData, isFetching: loading } = useQuery({
  queryKey: dialogQueryKey,
  queryFn: () =>
    props.fetcher({
      keyword: keyword.value || undefined,
      page: page.value,
      pageSize: props.pageSize,
      params: mergedFilterParams.value,
    }),
  enabled: computed(() => props.visible),
  staleTime: computed(() => props.staleTime),
  gcTime: resolvedGcTime,
  refetchOnMount: false,
  refetchOnReconnect: false,
});

const tableData = computed(() => queryData.value?.items ?? []);
const total = computed(() => queryData.value?.total ?? 0);

// 打开弹窗时初始化
watch(
  () => props.visible,
  (visible) => {
    if (!visible) return;
    const vals = Array.isArray(props.modelValue)
      ? props.modelValue
      : props.modelValue != null
        ? [props.modelValue]
        : [];
    selectedKeys.value = vals;
    keyword.value = '';
    page.value = 1;
    void loadFilterFields();
  }
);

// 搜索列表
function onSearch() {
  page.value = 1;
}

function onFilterSearch() {
  page.value = 1;
}

function onFilterReset() {
  for (const key of Object.keys(filterForm)) {
    filterForm[key] = '';
  }
  page.value = 1;
}

// 加载实体模糊搜索字段配置
async function loadFilterFields() {
  if (!props.entityKey || props.entityKey.startsWith('__')) {
    filterFields.value = [];
    return;
  }

  filterLoading.value = true;
  try {
    const res = await getByEntityKeyAndFieldKeyApi(props.entityKey);
    const backendFields: FieldConfig[] = Array.isArray(res?.data)
      ? res.data
      : [];
    filterFields.value = resolveBackendFilterFields({
      entityKey: props.entityKey,
      backendFields,
      t,
    });

    for (const key of Object.keys(filterForm)) {
      if (!filterFields.value.some((field) => field.key === key)) {
        delete filterForm[key];
      }
    }
    for (const field of filterFields.value) {
      const fieldKey = String(field.key);
      const defaultValue = (field as { defaultValue?: unknown }).defaultValue;
      if (!(fieldKey in filterForm)) {
        filterForm[fieldKey] = defaultValue ?? '';
      }
    }
  } catch {
    filterFields.value = [];
  } finally {
    filterLoading.value = false;
  }
}

// 切换分页
function onPageChange(p: number) {
  page.value = p;
}

/******************************** 选择与确认 ********************************/

const selectedCount = computed(() => selectedKeys.value.length);

function onSelectionKeysUpdate(keys: any[]) {
  selectedKeys.value = keys;
}

let lastSelectedRows: Record<string, any>[] = [];
function onSelectionChange(rows: Record<string, any>[]) {
  lastSelectedRows = rows;
}

// 关闭弹窗
function cancel() {
  emit('update:visible', false);
}

// 确认选择
function confirm() {
  const rows =
    lastSelectedRows.length > 0
      ? lastSelectedRows
      : (tableRef.value?.getSelectedRows() ?? []);
  const keys = props.multiple
    ? [...selectedKeys.value]
    : (selectedKeys.value[0] ?? null);
  emit('update:modelValue', keys);
  emit('confirm', rows);
  emit('update:visible', false);
}

const computedDialogTitle = computed(
  () => props.dialogTitle || t('common.pleaseSelect')
);
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="computedDialogTitle"
    :width="dialogWidth"
    append-to-body
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="dialog-list">
      <!-- 模糊筛选：优先使用调用方插槽，否则按后端字段配置生成 -->
      <slot name="filter">
        <MultiviewFuzzyFilter
          v-if="filterFields.length"
          v-loading="filterLoading"
          v-model="filterForm"
          :fields="filterFields"
          compact
          @search="onFilterSearch"
          @reset="onFilterReset"
        />
      </slot>

      <!-- 搜索栏 -->
      <div class="dialog-list__bar">
        <el-input
          v-model="keyword"
          :placeholder="t('common.enterKeyword')"
          clearable
          style="width: 260px"
          @keyup.enter="onSearch"
          @clear="onSearch"
        >
          <template #append>
            <el-button :icon="Search" @click="onSearch" />
          </template>
        </el-input>
        <span v-if="selectedCount > 0" class="dialog-list__count">
          {{ t('common.selectedCount', { count: selectedCount }) }}
        </span>
      </div>

      <!-- 表格 + 分页 -->
      <div class="dialog-list__table" v-loading="loading">
        <TableEntlty
          :showColumnSettings="false"
          :entity-key="entityKey"
          ref="tableRef"
          :columns="columns"
          :data="tableData"
          :height="tableHeight"
          :width="tableWidth"
          :row-key="rowKey"
          :selected-keys="selectedKeys"
          selectable
          :multiple="multiple"
          show-pagination
          :total="total"
          :page-size="pageSize"
          :current-page="page"
          @update:selected-keys="onSelectionKeysUpdate"
          @selection-change="onSelectionChange"
          @page-change="onPageChange"
        />
      </div>
    </div>

    <template #footer>
      <el-button @click="cancel">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" @click="confirm">{{
        t('common.confirm')
      }}</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dialog-list__bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dialog-list__count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.dialog-list__table {
  width: 100%;
}
</style>
