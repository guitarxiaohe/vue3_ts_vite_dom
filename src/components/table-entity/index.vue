<template>
  <div class="table-entity">
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
      :columns="tableColumns"
      :row="detailRow"
      :row-index="detailRowIndex"
      :total-rows="dataList.length"
      @prev="onDetailPrev"
      @next="onDetailNext"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive, useSlots, computed } from 'vue';
import { ElTableV2 } from 'element-plus';
import type { TableEntlty } from './index.type';
import { isDataFetcher } from './utils';
import { useTableSelection } from './use-table-selection';
import { useTableColumns } from './use-table-columns';
import { useTableData } from './use-table-data';
import { useEntityDelete } from './use-entity-delete';
import { buildOperationsColumn } from './row-operations';
import RowDetailDrawer from './row-detail-drawer.vue';

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
});

const slots = useSlots();

const emit = defineEmits<{
  'update:selectedKeys': [keys: any[]];
  'update:currentPage': [page: number];
  'selection-change': [rows: Record<string, any>[]];
  'page-change': [page: number];
  'delete-success': [];
  'delete-error': [payload: { message: string }];
  'row-action': [payload: { event: string; row: Record<string, any> }];
}>();

/******************************** 表格状态 ********************************/

const dataList = ref<Record<string, any>[]>([]);
const tableLoading = ref(false);
const pagination = reactive({
  total: 0,
  pageNum: props.currentPage ?? 1,
  pageSize: props.pageSize ?? 10,
});

const detailDrawerVisible = ref(false);
const detailRowIndex = ref(0);

const detailRow = computed(
  () => dataList.value[detailRowIndex.value] ?? null
);

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

const { tableColumns, initColumns } = useTableColumns(
  props,
  slots,
  tableLoading,
  selectionColumn
);

const { initData } = useTableData(props, dataList, tableLoading, pagination);

const { deleteSelectedByEntityKey, deleteRowByEntityKey } = useEntityDelete(
  props,
  selectedKeySet,
  tableLoading,
  clearSelection,
  initData,
  emit
);

// 数据列 + 可选右侧操作列
const displayColumns = computed(() => {
  const base = [...tableColumns.value];
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

// 分页切换后刷新列表
function onPageChange(page: number) {
  emit('update:currentPage', page);
  emit('page-change', page);
  pagination.pageNum = page;
  void initData();
}

// 行内删除后：若正在看该行，刷新后校正下标
async function handleRowDelete(row: Record<string, any>) {
  const rk = props.rowKey ?? 'id';
  const viewing =
    detailDrawerVisible.value &&
    detailRow.value &&
    String(detailRow.value[rk]) === String(row[rk]);

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
}

function onDetailPrev() {
  if (detailRowIndex.value > 0) detailRowIndex.value--;
}

function onDetailNext() {
  if (detailRowIndex.value < dataList.value.length - 1) {
    detailRowIndex.value++;
  }
}

void initColumns();
void initData();

/******************************** 对外 API ********************************/

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

function closeDetail() {
  detailDrawerVisible.value = false;
}

defineExpose({
  clearSelection,
  getSelectedRows,
  getSelectedCount,
  setSelectedKeys,
  reload: initData,
  deleteSelectedByEntityKey,
  deleteRowByEntityKey,
  openDetail,
  closeDetail,
});
</script>

<style scoped lang="scss" src="./index.scss"></style>
