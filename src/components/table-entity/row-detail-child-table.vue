<script setup lang="ts">
import {
  computed,
  defineComponent,
  h,
  isVNode,
  reactive,
  ref,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import type { PropType } from 'vue';
import {
  getByEntityKeyAndFieldKeyApi,
  getListByEntityKeyApi,
} from '@/api/modules/dynamic-entity';
import { getApiErrorText, isApiSuccess } from '@/utils/api-success';
import { getEntityTableConfig } from '@/utils/entity-config';
import { mapFieldConfigRowsToColumns } from './composables/use-table-columns';
import { formatCellText } from './utils/column-utils';
import MultiviewFuzzyFilter from '@/features/multiview/components/multiview-fuzzy-filter.vue';
import { resolveBackendFilterFields } from '@/features/entities/_shared/resolve-entity-filters';
import type { ColumnsItem, TableListQuery } from './index.type';
import type {
  EntityTableChildConfig,
  EntityTableChildRelationFieldConfig,
} from '@/types/entity-config';
import type { FilterFormValue } from '@/features/multiview/types';

/******************************** 组件入参 ********************************/

const CellRender = defineComponent({
  name: 'CellRender',
  props: {
    content: {
      type: [Object, Function, String, Number, Boolean] as PropType<any>,
      required: true,
    },
  },
  setup(renderProps) {
    return () =>
      isVNode(renderProps.content)
        ? renderProps.content
        : typeof renderProps.content === 'object' ||
            typeof renderProps.content === 'function'
          ? h(renderProps.content)
          : h('span', {}, String(renderProps.content ?? '--'));
  },
});

const props = withDefaults(
  defineProps<{
    config: EntityTableChildConfig;
    row: Record<string, any>;
    showTitle?: boolean;
  }>(),
  {
    showTitle: true,
  }
);

const { t, te } = useI18n();

/******************************** 基础状态 ********************************/

const tableLoading = ref<boolean>(false);
const currentPage = ref<number>(1);
const total = ref<number>(0);
const rows = ref<Record<string, any>[]>([]);
const fieldConfigRows = ref<Record<string, any>[]>([]);
const filterForm = reactive<Record<string, FilterFormValue>>({});

const entityTableConfig = computed(() =>
  getEntityTableConfig(props.config.entityKey)
);
const pageSize = computed<number>(
  () => props.config.pageSize ?? entityTableConfig.value.pageSize ?? 10
);
const resolvedHeight = computed<number>(() => props.config.height ?? 500);
const relationFields = computed<EntityTableChildRelationFieldConfig[]>(() => {
  const source = props.config.relationField;
  return Array.isArray(source) ? source : [source];
});
const hiddenColumnKeySet = computed(
  () => new Set((props.config.hiddenColumnKeys ?? []).map(String))
);

const resolvedColumns = computed<ColumnsItem[]>(() => {
  const localColumns = props.config.columns?.length
    ? props.config.columns
    : entityTableConfig.value.columns?.length
      ? entityTableConfig.value.columns
      : fieldConfigRows.value.length
        ? mapFieldConfigRowsToColumns(fieldConfigRows.value)
        : [];

  return localColumns.filter(
    (column) => !hiddenColumnKeySet.value.has(String(column.dataKey ?? ''))
  );
});

const resolvedTitle = computed<string>(() => {
  if (props.config.labelKey && te(props.config.labelKey)) {
    return t(props.config.labelKey);
  }

  return props.config.label || props.config.entityKey;
});

const relationChildKeySet = computed(
  () => new Set(relationFields.value.map((item) => String(item.childKey)))
);

const filterFields = computed(() =>
  resolveBackendFilterFields({
    entityKey: props.config.entityKey,
    backendFields: fieldConfigRows.value as any,
    t,
  }).filter((field) => !relationChildKeySet.value.has(String(field.key)))
);

const resolvedQuery = computed<TableListQuery>(() => {
  return {
    pageNum: currentPage.value,
    pageSize: pageSize.value,
    ...buildFilterParams(),
    ...buildRelationParams(),
    ...(props.config.dataParams ?? {}),
  };
});

/******************************** 工具方法 ********************************/

// 读取路径值
function getValueByPath(source: Record<string, any>, path: string) {
  const normalizedPath = String(path ?? '')
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean);

  let current: unknown = source;

  for (const key of normalizedPath) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

// 构建父子关联参数
function buildRelationParams() {
  const params: Record<string, string | number | boolean | undefined> = {};

  relationFields.value.forEach((item) => {
    const value = getValueByPath(props.row, item.parentKey);
    params[item.childKey] =
      value == null ? undefined : (value as string | number | boolean);
  });

  return params;
}

// 构建子表筛选参数
function buildFilterParams() {
  const params: Record<string, string | number | boolean | undefined> = {};

  Object.entries(filterForm).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    if (Array.isArray(value)) {
      params[key] = value.join(',');
      return;
    }
    if (value instanceof Date) {
      params[key] = value.getTime();
      return;
    }
    params[key] = value as string | number | boolean;
  });

  return params;
}

// 清空子表筛选
function clearFilters() {
  Object.keys(filterForm).forEach((key) => {
    delete filterForm[key];
  });
}

// 重置并刷新子表筛选
function resetFilters() {
  clearFilters();
  currentPage.value = 1;
  loadRows();
}

// 执行子表筛选
function searchRows() {
  currentPage.value = 1;
  loadRows();
}

// 判断是否可以加载子表
function canLoadChildTable() {
  return relationFields.value.every((item) => {
    const value = getValueByPath(props.row, item.parentKey);
    return value !== undefined && value !== null && value !== '';
  });
}

// 加载子表列
async function loadColumns() {
  if (props.config.columns?.length || entityTableConfig.value.columns?.length) {
    return;
  }

  try {
    const response = await getByEntityKeyAndFieldKeyApi(props.config.entityKey);
    fieldConfigRows.value = Array.isArray(response?.data) ? response.data : [];
  } catch (error) {
    console.error('load child detail columns failed:', error);
  }
}

// 加载子表数据
async function loadRows() {
  if (!canLoadChildTable()) {
    rows.value = [];
    total.value = 0;
    return;
  }

  tableLoading.value = true;

  try {
    const query = resolvedQuery.value;

    if (props.config.fetcher) {
      const result = await props.config.fetcher(query);
      rows.value = result.rows ?? [];
      total.value = Number(result.total) || 0;
      return;
    }

    const response = (await getListByEntityKeyApi(
      props.config.entityKey,
      query
    )) as {
      code?: number;
      msg?: string;
      message?: string;
      total?: number;
      rows?: Record<string, any>[];
    };

    if (response.code != null && !isApiSuccess(response.code)) {
      throw new Error(getApiErrorText(response));
    }

    rows.value = response.rows ?? [];
    total.value = Number(response.total) || 0;
  } catch (error) {
    console.error('load child detail rows failed:', error);
    ElMessage.error(
      error instanceof Error ? error.message : t('common.failed')
    );
  } finally {
    tableLoading.value = false;
  }
}

// 分页切换
function onPageChange(page: number) {
  currentPage.value = page;
}

function renderTableCell(row: Record<string, any>, column: ColumnsItem) {
  const dataKey = String(column.dataKey ?? '');
  const value = dataKey ? row[dataKey] : undefined;
  const rendered = column.cellRenderer?.({
    column,
    rowData: row,
    rowIndex: rows.value.indexOf(row),
    cellData: value,
    isScrolling: false,
  } as unknown as Parameters<NonNullable<ColumnsItem['cellRenderer']>>[0]);

  return rendered ?? formatCellText(value);
}

/******************************** 监听 ********************************/

watch(
  () => props.config,
  async () => {
    currentPage.value = 1;
    clearFilters();
    await loadColumns();
    await loadRows();
  },
  { deep: true, immediate: true }
);

watch(
  () => props.row,
  async () => {
    currentPage.value = 1;
    await loadRows();
  },
  { deep: true }
);

watch(currentPage, async () => {
  await loadRows();
});
</script>

<template>
  <div class="row-detail-child-table">
    <!-------------------------- 标题栏 -------------------------->
    <div v-if="props.showTitle" class="row-detail-child-table__header">
      <div class="row-detail-child-table__title">{{ resolvedTitle }}</div>
      <div class="row-detail-child-table__total">
        {{ t('common.total', { count: total }) }}
      </div>
    </div>

    <!-------------------------- 子表内容 -------------------------->
    <MultiviewFuzzyFilter
      v-if="filterFields.length"
      v-model="filterForm"
      class="row-detail-child-table__filter"
      :fields="filterFields"
      @search="searchRows"
      @reset="resetFilters"
    />

    <el-table
      v-loading="tableLoading"
      :data="rows"
      border
      size="small"
      :height="resolvedHeight"
      :empty-text="t('common.noData')"
    >
      <el-table-column
        v-for="column in resolvedColumns"
        :key="String(column.key ?? column.dataKey)"
        :prop="String(column.dataKey ?? '')"
        :label="String(column.title ?? column.dataKey ?? '')"
        :min-width="Number(column.width ?? 120)"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <CellRender
            v-if="column.cellRenderer"
            :content="renderTableCell(row, column)"
          />
          <template v-else>
            {{ formatCellText(row[String(column.dataKey ?? '')]) }}
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-------------------------- 子表分页 -------------------------->
    <div
      v-if="props.config.showPagination !== false"
      class="row-detail-child-table__pagination"
    >
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        background
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.row-detail-child-table {
  padding: 16px 0 0;
}

.row-detail-child-table__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.row-detail-child-table__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.row-detail-child-table__total {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.row-detail-child-table__filter {
  margin-bottom: 12px;
}

.row-detail-child-table__pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
}
</style>
