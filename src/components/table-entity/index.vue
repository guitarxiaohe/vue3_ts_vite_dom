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
    />

    <!-------------------------- 虚拟表格 -------------------------->
    <ElTableV2
      :loading="tableLoading"
      :columns="displayColumns"
      :data="dataList"
      :width="props.width ?? 700"
      :height="props.height ?? 400"
      :row-event-handlers="selectable ? rowEventHandlers : undefined"
      fixed
    />
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
      @prev="onDetailPrev"
      @next="onDetailNext"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive, computed } from 'vue';
import { ElMessage, ElMessageBox, ElTableV2 } from 'element-plus';
import { useSlots } from 'vue';
import { useI18n } from 'vue-i18n';
import { fieldConfigSort } from '@/api/modules/user';
import type { DataItem } from '@/types/user';
import type { ColumnsItem, TableEntlty } from './index.type';
import { isDataFetcher } from './utils';
import { useTableSelection } from './use-table-selection';
import { useTableColumns } from './use-table-columns';
import { useTableData } from './use-table-data';
import { useEntityDelete } from './use-entity-delete';
import { buildOperationsColumn } from './row-operations';
import RowDetailDrawer from './row-detail-drawer.vue';
import TableToolbar from './table-toolbar.vue';

/******************************** 组件入参 ********************************/

const props = withDefaults(defineProps<TableEntlty>(), {
  height: 400,
  width: 700,
  selectable: true,
  multiple: true,
  rowKey: 'id',
  selectedKeys: () => [],
  pageSize: 20,
  currentPage: 1,
  showPagination: false,
  columns: () => [],
  dataParams: () => ({}),
  showRowActions: true,
  showDefaultRowActions: true,
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
  'row-action': [payload: { event: string; row: Record<string, any> }];
  'column-visibility-change': [payload: { hiddenKeys: string[] }];
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

const detailRow = computed(() => dataList.value[detailRowIndex.value] ?? null);

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

// 数据列 + 可选右侧操作列
const displayColumns = computed(() => {
  const base: ColumnsItem[] = [];
  if (props.selectable) {
    base.push(selectionColumn.value);
  }
  base.push(...visibleBusinessColumns.value);
  if (props.showRowActions !== false) {
    base.push(
      buildOperationsColumn(props, {
        onDetail: (_row, idx) => {
          detailRowIndex.value = idx;
          detailDrawerVisible.value = true;
        },
        onDelete: (row) => {
          void handleRowDelete(row);
        },
        onCustomAction: (event, row) => {
          emit('row-action', { event, row });
        },
      })
    );
  }
  return base;
});

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

// 生成排序请求项
function buildSortItems(fromIndex: number, toIndex: number) {
  const nextRows = [...fieldConfigRows.value];
  const moved = nextRows.splice(fromIndex, 1)[0];
  if (!moved) return [];
  nextRows.splice(toIndex, 0, moved);
  return nextRows
    .filter((item) => item?.id != null)
    .map(
      (item, index): DataItem => ({
        id: Number(item.id),
        sort: index + 1,
      })
    );
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

// 调整列顺序并刷新字段配置
async function moveColumn(column: ColumnsItem, direction: 'up' | 'down') {
  if (!props.entityKey || !fieldConfigRows.value.length) return;

  const currentIndex = sortableColumns.value.findIndex(
    (item) => String(item.key) === String(column.key)
  );
  if (currentIndex < 0) return;

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= sortableColumns.value.length) return;

  const items = buildSortItems(currentIndex, targetIndex);
  if (!items.length) return;

  columnSortLoading.value = true;
  try {
    await fieldConfigSort({
      entityKey: props.entityKey,
      items,
    });
    await reloadColumns();
    ElMessage.success(t('common.success'));
  } catch (error) {
    console.error('Failed to sort columns:', error);
    ElMessage.error(t('common.failed'));
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
    if (!ok) return;

    if (viewing) {
      if (!dataList.value.length) {
        detailDrawerVisible.value = false;
        return;
      }
      detailRowIndex.value = Math.min(
        detailRowIndex.value,
        dataList.value.length - 1
      );
    }
  } catch (e) {
    // throw new Error(e);
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
  openDetail,
  closeDetail,
});
</script>

<style scoped lang="scss" src="./index.scss"></style>
