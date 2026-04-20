<template>
  <div class="table-entlty">
    <ElTableV2
      :loading="tableLoading"
      :columns="tableColumns"
      :data="dataList"
      :width="props.width ?? 700"
      :height="props.height ?? 400"
      :row-event-handlers="selectable ? rowEventHandlers : undefined"
      fixed
    />
    <!-- 分页 -->
    <div v-if="showPagination" class="table-entlty__pagination">
      <el-pagination
        :current-page="props.currentPage ?? 1"
        :page-size="props.pageSize ?? 20"
        :total="props.total ?? 0"
        layout="total, prev, pager, next"
        background
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, watch, reactive } from 'vue';
import { ElTableV2, ElCheckbox, TableV2FixedDir } from 'element-plus';
import type { ColumnsItem, TableEntlty } from './index.type';
import { getByEntityKeyAndFieldKeyApi } from '@/api/modules/user';
import { isEmptyValue, snakeToCamel } from '@/utils/value';
import { httpClient } from '@/api/client';

const props = withDefaults(defineProps<TableEntlty>(), {
  height: 400,
  width: 700,
  selectable: true,
  multiple: true,
  rowKey: 'id',
  selectedKeys: () => [],
  total: 0,
  pageSize: 20,
  currentPage: 1,
  showPagination: false,
});

const emit = defineEmits<{
  'update:selectedKeys': [keys: any[]];
  'update:currentPage': [page: number];
  'selection-change': [rows: Record<string, any>[]];
  'page-change': [page: number];
}>();
const dataList = ref<Record<string, any>[]>([]);

const tableLoading = ref(false);
const pagination = reactive({
  total: 0,
  pageNum: 1,
  pageSize: 10,
});

// ── Selection ─────────────────────────────────────────────────────────────

/** 已选 key 集合 */
const selectedKeySet = ref<Set<any>>(new Set());
/** key → rowData，跨分页保留完整行数据 */
const selectedRowsMap = ref<Map<any, Record<string, any>>>(new Map());

// 从 props.selectedKeys 同步
watch(
  () => props.selectedKeys,
  (keys) => {
    selectedKeySet.value = new Set(keys ?? []);
  },
  { immediate: true }
);

// 数据变化时补充 rowData
watch(
  () => props.data,
  (data) => {
    if (!Array.isArray(data)) return;
    data.forEach((row) => {
      const key = row[props.rowKey];
      if (selectedKeySet.value.has(key)) {
        selectedRowsMap.value.set(key, row);
      }
    });
  }
);

function isSelected(row: Record<string, any>) {
  return selectedKeySet.value.has(row[props.rowKey]);
}

function toggleRow(row: Record<string, any>) {
  const key = row[props.rowKey];
  if (props.multiple) {
    if (selectedKeySet.value.has(key)) {
      selectedKeySet.value.delete(key);
      selectedRowsMap.value.delete(key);
    } else {
      selectedKeySet.value.add(key);
      selectedRowsMap.value.set(key, row);
    }
    selectedKeySet.value = new Set(selectedKeySet.value);
  } else {
    selectedKeySet.value = new Set([key]);
    selectedRowsMap.value.clear();
    selectedRowsMap.value.set(key, row);
  }
  emitSelection();
}

function toggleAll() {
  const allKeys = dataList.value.map((r) => r[props.rowKey]);
  const allSelected = allKeys.every((k) => selectedKeySet.value.has(k));
  if (allSelected) {
    allKeys.forEach((k) => {
      selectedKeySet.value.delete(k);
      selectedRowsMap.value.delete(k);
    });
  } else {
    dataList.value.forEach((row) => {
      const k = row[props.rowKey];
      selectedKeySet.value.add(k);
      selectedRowsMap.value.set(k, row);
    });
  }
  selectedKeySet.value = new Set(selectedKeySet.value);
  emitSelection();
}

function emitSelection() {
  emit('update:selectedKeys', [...selectedKeySet.value]);
  emit('selection-change', [...selectedRowsMap.value.values()]);
}

const allCurrentSelected = computed(
  () =>
    dataList.value.length > 0 &&
    dataList.value.every((r) => selectedKeySet.value.has(r[props.rowKey]))
);

const someCurrentSelected = computed(() =>
  dataList.value.some((r) => selectedKeySet.value.has(r[props.rowKey]))
);

// ── 公开方法 ──────────────────────────────────────────────────────────────

function clearSelection() {
  selectedKeySet.value = new Set();
  selectedRowsMap.value.clear();
  emitSelection();
}

function getSelectedRows() {
  return [...selectedRowsMap.value.values()];
}

function getSelectedCount() {
  return selectedKeySet.value.size;
}

function setSelectedKeys(keys: any[]) {
  selectedKeySet.value = new Set(keys);
  dataList.value.forEach((row) => {
    const key = row[props.rowKey];
    if (selectedKeySet.value.has(key)) {
      selectedRowsMap.value.set(key, row);
    }
  });
  emitSelection();
}

defineExpose({
  clearSelection,
  getSelectedRows,
  getSelectedCount,
  setSelectedKeys,
});

// ── Hover 追踪 ────────────────────────────────────────────────────────────

const hoveredIndex = ref(-1);

const rowEventHandlers = {
  onMouseenter: ({ rowIndex }: { rowIndex: number }) => {
    hoveredIndex.value = rowIndex;
  },
  onMouseleave: () => {
    hoveredIndex.value = -1;
  },
  onClick: ({ rowData }: { rowData: Record<string, any> }) => {
    toggleRow(rowData);
  },
};

// ── 分页 ──────────────────────────────────────────────────────────────────

function onPageChange(page: number) {
  emit('update:currentPage', page);
  emit('page-change', page);
  console.log('onPageChange ==>', page);
  pagination.pageNum = page;
  initData();
}

// ── Selection Column ──────────────────────────────────────────────────────

const SEL_WIDTH = 55;

const selectionColumn = computed(
  (): ColumnsItem => ({
    key: '__sel__',
    width: SEL_WIDTH,
    align: 'center' as const,
    fixed: TableV2FixedDir.LEFT,
    cellRenderer: ({
      rowData,
      rowIndex,
    }: {
      rowData: Record<string, any>;
      rowIndex: number;
    }) => {
      const selected = isSelected(rowData);
      const hovered = hoveredIndex.value === rowIndex;

      // 默认显示序号，hover 或已选中时显示选择控件
      if (!selected && !hovered) {
        return h('span', { class: 'sel-index' }, rowIndex + 1);
      }

      if (props.multiple) {
        return h(ElCheckbox, {
          modelValue: selected,
          onClick: (e: MouseEvent) => {
            e.stopPropagation();
            toggleRow(rowData);
          },
        });
      } else {
        return h('span', {
          class: ['sel-radio', selected && 'sel-radio--checked'],
          onClick: (e: MouseEvent) => {
            e.stopPropagation();
            toggleRow(rowData);
          },
        });
      }
    },
    headerCellRenderer: () => {
      if (!props.multiple) {
        return h('span', { class: 'sel-header' }, '');
      }
      return h(ElCheckbox, {
        modelValue: allCurrentSelected.value,
        indeterminate: someCurrentSelected.value && !allCurrentSelected.value,
        disabled: dataList.value.length === 0,
        onClick: (e: MouseEvent) => {
          e.stopPropagation();
          toggleAll();
        },
      });
    },
  })
);

// ── Columns 组装 ──────────────────────────────────────────────────────────

// 宽度辅助函数
const fontWidth = (fint: string | undefined): number => {
  if (!fint) return 150;
  return fint.length * 30;
};

/** 接口可能返回字符串，映射为 TableV2 的 FixedDir 枚举 */
function normalizeColumnFixed(v: unknown): true | TableV2FixedDir | undefined {
  if (v === true) return true;
  if (v === TableV2FixedDir.LEFT || v === 'left') return TableV2FixedDir.LEFT;
  if (v === TableV2FixedDir.RIGHT || v === 'right')
    return TableV2FixedDir.RIGHT;
  return undefined;
}

const tableColumns = ref<ColumnsItem[]>([]);

// ------------ 实体请求 --------------------
const init = async () => {
  try {
    if (!props?.entityKey) return console.warn('请提供entityKey');
    tableLoading.value = true;
    const list = await getByEntityKeyAndFieldKeyApi(props?.entityKey || '');
    const responseData = list?.data || [];

    if (!isEmptyValue(responseData)) {
      const columns = responseData.map(
        (col): ColumnsItem => ({
          // ...col,
          width: col.width ? col.width : (fontWidth(col.fieldName) ?? 150),
          title: col.fieldName ?? '--',
          key: col.id ?? '--',
          // 转义
          dataKey: snakeToCamel(col.fieldKey ?? '--'),
          fixed: normalizeColumnFixed(col.fixed),
        })
      );
      tableColumns.value = props.selectable
        ? [selectionColumn.value, ...columns]
        : columns;
    }
  } catch (error) {
    console.error('Failed to load field config:', error);
  } finally {
    tableLoading.value = false;
  }
};
// ── Data ──────────────────────────────────────────────────────────────────

// ------------- 数据组装 --------------------

/** 分页列表：拦截器返回的 body 即为 { total, rows }，与 httpClient 声明的 ApiResponse 不一致处用断言 */
type PaginatedListPayload = {
  total: number;
  rows: Record<string, any>[];
};

const initData = async () => {
  try {
    if (!props?.dataUrl) return [];
    const result = (await httpClient.get<PaginatedListPayload>(
      props.dataUrl,
      pagination
    )) as unknown as PaginatedListPayload;
    const payload = result;
    pagination.total = Number(payload.total) || 0;
    dataList.value = payload.rows ?? [];
  } catch {}
};
init();
initData();
</script>

<style scoped>
.table-entlty {
  width: 100%;
}

.table-entlty__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

/* ── 序号 ── */
:deep(.sel-index) {
  display: inline-block;
  width: 100%;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  pointer-events: none;
  user-select: none;
}

/* ── 单选圆点 ── */
:deep(.sel-radio) {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid var(--el-border-color);
  box-sizing: border-box;
  cursor: pointer;
  transition:
    border-color 0.15s,
    border-width 0.15s;
}

:deep(.sel-radio:hover),
:deep(.sel-radio--checked) {
  border-color: var(--el-color-primary);
}

:deep(.sel-radio--checked) {
  border-width: 4px;
  background-color: #fff;
}
</style>
