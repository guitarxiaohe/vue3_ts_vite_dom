<template>
  <div class="table-entity">
    <!-------------------------- 顶部工具区 -------------------------->
    <TableToolbar
      :show-column-settings="props.showColumnSettings"
      :settings-columns="columnSettingItems"
      :hidden-column-keys="hiddenColumnKeysState"
      :visible-column-count="visibleBusinessColumns.length"
      :column-sort-loading="columnSortLoading"
      @column-visible-change="onToolbarColumnVisibleChange"
      @column-move="onToolbarColumnMove"
      @column-reorder="onToolbarColumnReorder"
    />

    <!-------------------------- 虚拟表格 -------------------------->
    <div ref="tableViewportRef" class="table-entity__viewport">
      <ElTableV2
        :loading="tableLoading"
        :columns="displayColumns"
        :data="dataList"
        :width="resolvedTableWidth"
        :height="props.height ?? 400"
        :row-event-handlers="selectable ? rowEventHandlers : undefined"
        fixed
      />
    </div>
    <!-------------------------- 分页 -------------------------->
    <div v-if="showPagination" class="table-entlty__pagination">
      <el-pagination
        :current-page="props.currentPage ?? 1"
        :page-size="props.pageSize ?? 20"
        :total="props.total != null ? props.total : pagination.total"
        layout="total, prev, pager, next"
        background
        @current-change="onPageChange"
      />
    </div>
    <!-------------------------- 行详情抽屉 -------------------------->
    <RowDetailDrawer
      v-model="detailDrawerVisible"
      :title="props.detailDrawerTitle"
      :width="props.detailDrawerWidth"
      :columns="visibleBusinessColumns"
      :row="detailRow"
      :row-index="detailRowIndex"
      :total-rows="dataList.length"
      :render-map="props.detailRenderMap"
      :visible-count="props.detailVisibleCount"
      :hidden-keys="props.detailHiddenKeys"
      :child-tables="props.detailChildren"
      @prev="onDetailPrev"
      @next="onDetailNext"
    />
  </div>
</template>

<script setup lang="ts">
import { h, ref, watch, reactive, computed } from 'vue';
import { useElementSize } from '@vueuse/core';
import { ElMessage, ElMessageBox, ElTableV2 } from 'element-plus';
import { useSlots } from 'vue';
import { useI18n } from 'vue-i18n';
import { fieldConfigSort } from '@/api/modules/user';
import type { DataItem } from '@/types/user';
import type {
  ColumnsItem,
  TableColumnReorderPayload,
  TableEntlty,
} from './index.type';
import { isDataFetcher } from './utils/utils';
import { formatCellText, textDisplayWidth } from './utils/column-utils';
import { useTableSelection } from './composables/use-table-selection';
import { useTableColumns } from './composables/use-table-columns';
import { useTableData } from './composables/use-table-data';
import { useEntityDelete } from './composables/use-entity-delete';
import RowDetailDrawer from './row-detail-drawer.vue';
import TableToolbar from './table-toolbar.vue';

/******************************** 组件入参 ********************************/

const props = withDefaults(defineProps<TableEntlty>(), {
  height: 400,
  selectable: true,
  multiple: true,
  rowKey: 'id',
  selectedKeys: () => [],
  pageSize: 20,
  currentPage: 1,
  showPagination: false,
  columns: () => [],
  dataParams: () => ({}),
  rowActionColumn: undefined,
  hiddenColumnKeys: () => [],
  showColumnSettings: true,
});

const slots = useSlots();
const { t } = useI18n();

const emit = defineEmits<{
  'update:selectedKeys': [keys: any[]];
  'update:currentPage': [page: number];
  'update:hiddenColumnKeys': [keys: string[]];
  'selection-change': [rows: Record<string, any>[]];
  'page-change': [page: number];
  'delete-success': [];
  'delete-error': [payload: { message: string }];
  'column-visibility-change': [payload: { hiddenKeys: string[] }];
  'sort-change': [payload: { field: string; order: 'asc' | 'desc' }];
}>();

/******************************** 表格状态 ********************************/

const dataList = ref<Record<string, any>[]>([]);
const tableLoading = ref(false);
const columnSortLoading = ref(false);
const hiddenColumnKeysState = ref<string[]>([]);
const pagination = reactive({
  total: 0,
  pageNum: props.currentPage ?? 1,
  pageSize: props.pageSize ?? 10,
});

const detailDrawerVisible = ref(false);
const detailRowIndex = ref(0);
const tableViewportRef = ref<HTMLElement>();
const { width: viewportWidth } = useElementSize(tableViewportRef);

const detailRow = computed(() => dataList.value[detailRowIndex.value] ?? null);
const resolvedTableWidth = computed(() =>
  Math.max(1, Math.floor(props.width ?? viewportWidth.value))
);
const TEXT_COLUMN_MIN_WIDTH = 88;
const TEXT_COLUMN_MAX_WIDTH = 200;
const TEXT_COLUMN_PADDING = 36;

// 与父级分页 props 同步内部页码、每页条数
watch(
  () => props.currentPage,
  (p) => {
    pagination.pageNum = p ?? 1;
  }
);
watch(
  () => props.pageSize,
  (s) => {
    pagination.pageSize = s ?? 10;
  }
);

// 同步受控隐藏列
watch(
  () => props.hiddenColumnKeys,
  (keys) => {
    hiddenColumnKeysState.value = Array.isArray(keys) ? keys.map(String) : [];
  },
  { immediate: true }
);

// 静态数组数据源：父级驱动行与 total（非函数 data 时）
watch(
  () => [props.data, props.total] as const,
  () => {
    if (isDataFetcher(props.data)) return;
    if (Array.isArray(props.data)) {
      dataList.value = [...props.data];
      pagination.total =
        props.total != null ? Number(props.total) : props.data.length;
    }
  },
  { deep: true, immediate: true }
);

// 列表变短时校正详情下标，避免越界
watch(
  () => dataList.value.length,
  (len) => {
    if (!detailDrawerVisible.value) return;
    if (len === 0) {
      detailDrawerVisible.value = false;
      return;
    }
    if (detailRowIndex.value > len - 1) {
      detailRowIndex.value = len - 1;
    }
  }
);

/******************************** 组合能力 ********************************/

const {
  selectedKeySet,
  selectionColumn,
  rowEventHandlers,
  clearSelection,
  getSelectedRows,
  getSelectedCount,
  setSelectedKeys,
} = useTableSelection(props, emit, dataList);

const { businessColumns, fieldConfigRows, initColumns, reloadColumns } =
  useTableColumns(props, slots, tableLoading, selectionColumn);

const { initData } = useTableData(props, dataList, tableLoading, pagination);

const { deleteSelectedByEntityKey, deleteRowByEntityKey } = useEntityDelete(
  props,
  selectedKeySet,
  tableLoading,
  clearSelection,
  initData,
  emit
);

// 当前隐藏列集合
const hiddenColumnKeySet = computed(
  () => new Set(hiddenColumnKeysState.value.map(String))
);

// 可排序业务列
const sortableColumns = computed(() =>
  businessColumns.value.filter(
    (column) =>
      column.key != null && column.dataKey != null && column.dataKey !== ''
  )
);

// 顶部工具区列设置项
const columnSettingItems = computed(() =>
  sortableColumns.value.map((column) => ({
    key: String(column.key),
    dataKey: String(column.dataKey),
    title: String(column.title ?? column.dataKey ?? ''),
  }))
);

// 可见业务列
const visibleBusinessColumns = computed(() =>
  businessColumns.value.filter(
    (column) => !hiddenColumnKeySet.value.has(String(column.dataKey))
  )
);

// 数据列 + 外部注入的右侧操作列
const displayColumns = computed(() => {
  const base: ColumnsItem[] = [];
  if (props.selectable) {
    base.push(selectionColumn.value);
  }
  base.push(...autoFitBusinessColumns.value);
  if (props.rowActionColumn) {
    base.push(props.rowActionColumn);
  }

  return fillColumnsToViewport(base, resolvedTableWidth.value);
});

// 根据当前页内容自动估算业务列宽，超过上限交给省略号展示
const autoFitBusinessColumns = computed(() =>
  visibleBusinessColumns.value.map((column) => {
    const dataKey = String(column.dataKey ?? '');
    const titleText = String(column.title ?? dataKey);
    const valueWidth = dataList.value.reduce((maxWidth, row) => {
      const text = formatCellText(dataKey ? row[dataKey] : '');
      return Math.max(maxWidth, textDisplayWidth(text));
    }, textDisplayWidth(titleText));
    const nextWidth = Math.min(
      TEXT_COLUMN_MAX_WIDTH,
      Math.max(TEXT_COLUMN_MIN_WIDTH, valueWidth + TEXT_COLUMN_PADDING)
    );

    const sortable = props.sortableColumnKeys?.includes(dataKey) ?? false;
    const isCurrentSort = props.sortField === dataKey;
    const currentOrder = isCurrentSort ? props.sortOrder : undefined;

    return {
      ...column,
      width: nextWidth,
      headerCellRenderer: sortable
        ? () =>
            h(
              'button',
              {
                type: 'button',
                class: 'table-entity__sort-header',
                onClick: () => onColumnSortToggle(dataKey),
              },
              [
                h('span', { class: 'table-entity__sort-title' }, titleText),
                renderSortIndicator(currentOrder),
              ]
            )
        : undefined,
    };
  })
);

// 切换列头排序：同一列在升序/降序之间切换
function onColumnSortToggle(field: string) {
  const nextOrder: 'asc' | 'desc' =
    props.sortField === field && props.sortOrder === 'asc' ? 'desc' : 'asc';
  emit('sort-change', { field, order: nextOrder });
}

// 渲染排序指示器（上下双箭头，激活态高亮）
function renderSortIndicator(order?: 'asc' | 'desc') {
  return h('span', { class: 'table-entity__sort-icons' }, [
    h('span', {
      class: [
        'table-entity__sort-icon',
        'table-entity__sort-icon--up',
        order === 'asc' ? 'is-active' : '',
      ],
    }),
    h('span', {
      class: [
        'table-entity__sort-icon',
        'table-entity__sort-icon--down',
        order === 'desc' ? 'is-active' : '',
      ],
    }),
  ]);
}

// 当列总宽小于容器时，加空白填充列，避免改变业务列自身宽度
function fillColumnsToViewport(columns: ColumnsItem[], tableWidth: number) {
  if (!columns.length || tableWidth <= 1) return columns;

  const normalizedColumns = columns.map((column) => ({
    ...column,
    width: Number(column.width ?? 120),
  }));
  const totalWidth = normalizedColumns.reduce(
    (sum, column) => sum + Number(column.width ?? 0),
    0
  );

  if (totalWidth >= tableWidth) {
    return normalizedColumns;
  }

  const fillColumn: ColumnsItem = {
    key: '__fill__',
    dataKey: '__fill__',
    title: '',
    width: tableWidth - totalWidth,
  };
  const opsIndex = normalizedColumns.findIndex(
    (column) => String(column.key ?? '') === '__ops__'
  );

  if (opsIndex < 0) {
    return [...normalizedColumns, fillColumn];
  }
  return [
    ...normalizedColumns.slice(0, opsIndex),
    fillColumn,
    ...normalizedColumns.slice(opsIndex),
  ];
}

/******************************** 列设置 ********************************/

// 判断当前列是否必须保持可见
function isColumnVisibleLocked(column: ColumnsItem) {
  const visibleCount = visibleBusinessColumns.value.length;
  return (
    visibleCount <= 1 && !hiddenColumnKeySet.value.has(String(column.dataKey))
  );
}

// 同步隐藏列并对外抛出
function updateHiddenColumnKeys(keys: string[]) {
  hiddenColumnKeysState.value = keys;
  emit('update:hiddenColumnKeys', keys);
  emit('column-visibility-change', { hiddenKeys: keys });
}

// 切换列显隐
function onColumnVisibleChange(column: ColumnsItem, checked: unknown) {
  const columnKey = String(column.dataKey ?? '');
  if (!columnKey) return;

  if (checked) {
    updateHiddenColumnKeys(
      hiddenColumnKeysState.value.filter((key) => key !== columnKey)
    );
    return;
  }

  if (visibleBusinessColumns.value.length <= 1) {
    return;
  }

  if (!hiddenColumnKeySet.value.has(columnKey)) {
    updateHiddenColumnKeys([...hiddenColumnKeysState.value, columnKey]);
  }
}

// 顶部工具区切换列显隐
function onToolbarColumnVisibleChange(payload: {
  dataKey: string;
  checked: boolean | string | number;
}) {
  onColumnVisibleChange(
    {
      dataKey: payload.dataKey,
    } as ColumnsItem,
    payload.checked
  );
}

// 调整本地业务列顺序
function reorderBusinessColumns(orderedKeys: string[]) {
  const columnMap = new Map(
    businessColumns.value.map((column) => [String(column.key), column])
  );
  const nextColumns = orderedKeys
    .map((key) => columnMap.get(String(key)))
    .filter((column): column is ColumnsItem => !!column);
  const orderedKeySet = new Set(orderedKeys.map(String));
  const restColumns = businessColumns.value.filter(
    (column) => !orderedKeySet.has(String(column.key))
  );

  businessColumns.value = [...nextColumns, ...restColumns];
}

// 生成排序请求项
function buildSortItems(fromIndex: number, toIndex: number) {
  const nextRows = [...fieldConfigRows.value];
  const moved = nextRows.splice(fromIndex, 1)[0];
  if (!moved) {
    return {
      items: [],
      nextRows: [],
    };
  }
  nextRows.splice(toIndex, 0, moved);
  return {
    items: nextRows
      .filter((item) => item?.id != null)
      .map(
        (item, index): DataItem => ({
          id: Number(item.id),
          sort: index + 1,
        })
      ),
    nextRows,
  };
}

// 同步本地字段顺序，避免外部预加载场景重复拉取
function syncLocalFieldConfigRows(rows: Record<string, any>[]) {
  fieldConfigRows.value = rows;
  reorderBusinessColumns(rows.map((item) => String(item.id ?? '')));
}

// 顶部工具区调整列顺序
function onToolbarColumnMove(payload: {
  columnKey: string;
  direction: 'up' | 'down';
}) {
  const targetColumn = sortableColumns.value.find(
    (item) => String(item.key) === String(payload.columnKey)
  );
  if (!targetColumn) return;
  void moveColumn(targetColumn, payload.direction);
}

// 顶部工具区拖拽重排列顺序
function onToolbarColumnReorder(payload: TableColumnReorderPayload) {
  reorderBusinessColumns(payload.orderedKeys);
  void moveColumnToIndex(payload.oldIndex, payload.newIndex);
}

// 调整列顺序并刷新字段配置
async function moveColumn(column: ColumnsItem, direction: 'up' | 'down') {
  if (!props.entityKey || !fieldConfigRows.value.length) return;

  const currentIndex = sortableColumns.value.findIndex(
    (item) => String(item.key) === String(column.key)
  );
  if (currentIndex < 0) return;

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= sortableColumns.value.length) return;

  const { items, nextRows } = buildSortItems(currentIndex, targetIndex);
  if (!items.length || !nextRows.length) return;

  syncLocalFieldConfigRows(nextRows);

  columnSortLoading.value = true;
  try {
    await fieldConfigSort({
      entityKey: props.entityKey,
      items,
    });
    ElMessage.success(t('common.success'));
  } catch (error) {
    console.error('Failed to sort columns:', error);
    ElMessage.error(t('common.failed'));
    await reloadColumns();
  } finally {
    columnSortLoading.value = false;
  }
}

// 按拖拽目标下标调整列顺序并刷新字段配置
async function moveColumnToIndex(fromIndex: number, toIndex: number) {
  if (!props.entityKey || !fieldConfigRows.value.length) return;
  if (fromIndex < 0 || toIndex < 0) return;
  if (
    fromIndex >= sortableColumns.value.length ||
    toIndex >= sortableColumns.value.length
  ) {
    return;
  }

  const { items, nextRows } = buildSortItems(fromIndex, toIndex);
  if (!items.length || !nextRows.length) return;

  columnSortLoading.value = true;
  try {
    await fieldConfigSort({
      entityKey: props.entityKey,
      items,
    });
    syncLocalFieldConfigRows(nextRows);
    ElMessage.success(t('common.success'));
  } catch (error) {
    console.error('Failed to sort columns:', error);
    ElMessage.error(t('common.failed'));
    await reloadColumns();
  } finally {
    columnSortLoading.value = false;
  }
}

/******************************** 表格与详情 ********************************/

// 分页切换后刷新列表
function onPageChange(page: number) {
  emit('update:currentPage', page);
  emit('page-change', page);
  pagination.pageNum = page;
  void initData();
}

// 行内删除后：若正在看该行，刷新后校正下标
async function handleRowDelete(row: Record<string, any>) {
  try {
    const rk = props.rowKey ?? 'id';
    const viewing =
      detailDrawerVisible.value &&
      detailRow.value &&
      String(detailRow.value[rk]) === String(row[rk]);
    await ElMessageBox.confirm(
      t('common.confirmDeleteData'),
      t('common.delete'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      }
    );
    const ok = await deleteRowByEntityKey(row);
    if (!ok) return false;

    if (viewing) {
      if (!dataList.value.length) {
        detailDrawerVisible.value = false;
        return true;
      }
      detailRowIndex.value = Math.min(
        detailRowIndex.value,
        dataList.value.length - 1
      );
    }
    return true;
  } catch (e) {
    // throw new Error(e);
    return false;
  }
}

// 查看上一条详情
function onDetailPrev() {
  if (detailRowIndex.value > 0) detailRowIndex.value--;
}

// 查看下一条详情
function onDetailNext() {
  if (detailRowIndex.value < dataList.value.length - 1) {
    detailRowIndex.value++;
  }
}

void initColumns();
void initData();

/******************************** 对外 API ********************************/

// 打开指定行详情
function openDetail(row: Record<string, any>) {
  const rk = props.rowKey ?? 'id';
  const idx = dataList.value.findIndex(
    (r) => String(r[rk]) === String(row[rk])
  );
  if (idx >= 0) {
    detailRowIndex.value = idx;
    detailDrawerVisible.value = true;
  }
}

// 关闭详情抽屉
function closeDetail() {
  detailDrawerVisible.value = false;
}

defineExpose({
  clearSelection,
  getSelectedRows,
  getSelectedCount,
  setSelectedKeys,
  reload: initData,
  reloadColumns,
  deleteSelectedByEntityKey,
  deleteRowByEntityKey,
  deleteRow: handleRowDelete,
  openDetail,
  closeDetail,
  getColumns: () => visibleBusinessColumns.value,
});
</script>

<style scoped lang="scss" src="./index.scss"></style>
