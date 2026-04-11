<script setup lang="ts">
import { ref, computed, h, watch, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElCheckbox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import type { VNode } from 'vue';

const { t } = useI18n();

// ── Types ─────────────────────────────────────────────────────────────────

export interface DialogListColumn {
  key: string;
  title: string;
  dataKey?: string;
  width?: number;
  flexGrow?: number;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
  cellRenderer?: (data: {
    rowData: Record<string, any>;
    rowIndex: number;
    cellData: any;
  }) => VNode;
}

export interface DialogListFetchParams {
  keyword?: string;
  page: number;
  pageSize: number;
}

export interface DialogListFetchResult {
  items: Record<string, any>[];
  total: number;
}

// ── Props / Emits ─────────────────────────────────────────────────────────

const props = withDefaults(
  defineProps<{
    visible: boolean;
    modelValue?: any | any[];
    multiple?: boolean;
    fetcher: (p: DialogListFetchParams) => Promise<DialogListFetchResult>;
    columns: DialogListColumn[];
    rowKey?: string;
    dialogTitle?: string;
    dialogWidth?: string | number;
    tableHeight?: number;
    pageSize?: number;
  }>(),
  {
    multiple: true,
    rowKey: 'id',
    dialogTitle: '',
    dialogWidth: '760px',
    tableHeight: 420,
    pageSize: 20,
  }
);

const emit = defineEmits<{
  'update:visible': [v: boolean];
  'update:modelValue': [v: any | any[]];
  confirm: [rows: Record<string, any>[]];
}>();

// ── Data / Fetching ───────────────────────────────────────────────────────
// 必须先于所有引用 tableData 的 computed / watch 声明

const keyword = ref('');
const page = ref(1);
const total = ref(0);
const tableData = ref<Record<string, any>[]>([]);
const loading = ref(false);

// ── Selection ─────────────────────────────────────────────────────────────

/** 已选 key 集合（O(1) 查询） */
const selectedKeys = ref<Set<any>>(new Set());
/** key → rowData，跨分页保留 row 数据 */
const selectedRowsMap = ref<Map<any, Record<string, any>>>(new Map());

function isSelected(row: Record<string, any>) {
  return selectedKeys.value.has(row[props.rowKey]);
}

function toggleRow(row: Record<string, any>) {
  const key = row[props.rowKey];
  if (props.multiple) {
    if (selectedKeys.value.has(key)) {
      selectedKeys.value.delete(key);
      selectedRowsMap.value.delete(key);
    } else {
      selectedKeys.value.add(key);
      selectedRowsMap.value.set(key, row);
    }
    // 触发响应式更新（Set 的 mutation 不会自动触发）
    selectedKeys.value = new Set(selectedKeys.value);
  } else {
    selectedKeys.value = new Set([key]);
    selectedRowsMap.value.clear();
    selectedRowsMap.value.set(key, row);
  }
}

function toggleAll() {
  const allKeys = tableData.value.map((r) => r[props.rowKey]);
  const allSelected = allKeys.every((k) => selectedKeys.value.has(k));
  if (allSelected) {
    allKeys.forEach((k) => {
      selectedKeys.value.delete(k);
      selectedRowsMap.value.delete(k);
    });
  } else {
    tableData.value.forEach((row) => {
      const k = row[props.rowKey];
      selectedKeys.value.add(k);
      selectedRowsMap.value.set(k, row);
    });
  }
  selectedKeys.value = new Set(selectedKeys.value);
}

const allCurrentSelected = computed(
  () =>
    tableData.value.length > 0 &&
    tableData.value.every((r) => selectedKeys.value.has(r[props.rowKey]))
);

const someCurrentSelected = computed(() =>
  tableData.value.some((r) => selectedKeys.value.has(r[props.rowKey]))
);

const selectedCount = computed(() => selectedKeys.value.size);

// 打开弹窗时从 modelValue 初始化选中状态
watch(
  () => props.visible,
  (visible) => {
    if (!visible) return;
    selectedKeys.value = new Set();
    selectedRowsMap.value = new Map();
    const vals = Array.isArray(props.modelValue)
      ? props.modelValue
      : props.modelValue != null
        ? [props.modelValue]
        : [];
    vals.forEach((v: any) => selectedKeys.value.add(v));
  }
);

// 数据加载后补充 rowData（用于确认时返回完整行）
watch(
  () => tableData.value,
  (data) => {
    data.forEach((row) => {
      const key = row[props.rowKey];
      if (selectedKeys.value.has(key)) {
        selectedRowsMap.value.set(key, row);
      }
    });
  }
);

// ── Hover ─────────────────────────────────────────────────────────────────

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

// ── Data / Fetching（续）────────────────────────────────────────────────

async function fetchData() {
  loading.value = true;
  try {
    const res = await props.fetcher({
      keyword: keyword.value || undefined,
      page: page.value,
      pageSize: props.pageSize,
    });
    tableData.value = res.items;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) return;
    keyword.value = '';
    page.value = 1;
    await fetchData();
  }
);

async function onSearch() {
  page.value = 1;
  await fetchData();
}

async function onPageChange(p: number) {
  page.value = p;
  await fetchData();
}

// ── Table Width（ResizeObserver）─────────────────────────────────────────

const containerRef = ref<HTMLElement>();
const tableWidth = ref(700);
let resizeObserver: ResizeObserver | null = null;

watch(containerRef, (el) => {
  if (!el) return;
  tableWidth.value = el.clientWidth;
  resizeObserver = new ResizeObserver(([entry]) => {
    tableWidth.value = entry.contentRect.width;
  });
  resizeObserver.observe(el);
});

onBeforeUnmount(() => resizeObserver?.disconnect());

// ── Columns ───────────────────────────────────────────────────────────────

const SEL_WIDTH = 55;

/** 序号 / 复选框 / 单选 特殊列 */
const selectionColumn = computed(() => ({
  key: '__sel__',
  width: SEL_WIDTH,
  align: 'center' as const,
  cellRenderer: ({
    rowData,
    rowIndex,
  }: {
    rowData: Record<string, any>;
    rowIndex: number;
  }) => {
    const selected = isSelected(rowData);
    const hovered = hoveredIndex.value === rowIndex;

    if (selected || hovered) {
      if (props.multiple) {
        // 多选：勾选框
        return h(ElCheckbox, {
          modelValue: selected,
          onClick: (e: MouseEvent) => {
            e.stopPropagation();
            toggleRow(rowData);
          },
        });
      } else {
        // 单选：自定义 radio 圆点
        return h('span', {
          class: ['sel-radio', selected && 'sel-radio--checked'],
          onClick: (e: MouseEvent) => {
            e.stopPropagation();
            toggleRow(rowData);
          },
        });
      }
    }

    // 默认显示序号
    return h('span', { class: 'sel-index' }, rowIndex + 1);
  },
  headerCellRenderer: () => {
    if (!props.multiple) {
      return h('span', { class: 'sel-index' }, '#');
    }
    return h(ElCheckbox, {
      modelValue: allCurrentSelected.value,
      indeterminate: someCurrentSelected.value && !allCurrentSelected.value,
      disabled: tableData.value.length === 0,
      onClick: (e: MouseEvent) => {
        e.stopPropagation();
        toggleAll();
      },
    });
  },
}));

/** 用户列 → EP TableV2 Column 格式 */
const tableColumns = computed(() => [
  selectionColumn.value,
  ...props.columns.map((col) => ({
    key: col.key,
    dataKey: col.dataKey ?? col.key,
    title: col.title,
    width: col.width ?? 150,
    flexGrow: col.flexGrow,
    align: col.align ?? 'left',
    fixed: col.fixed,
    cellRenderer:
      col.cellRenderer ??
      (({ cellData }: { cellData: any }) =>
        h(
          'span',
          { class: 'cell-text', title: String(cellData ?? '') },
          String(cellData ?? '-')
        )),
  })),
]);

// ── Confirm / Cancel ──────────────────────────────────────────────────────

function cancel() {
  emit('update:visible', false);
}

function confirm() {
  const rows = [...selectedRowsMap.value.values()];
  const keys = props.multiple
    ? [...selectedKeys.value]
    : ([...selectedKeys.value][0] ?? null);
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
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="dialog-list">
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

      <!-- 表格容器（ResizeObserver 测量宽度） -->
      <div ref="containerRef" class="dialog-list__table" v-loading="loading">
        <el-table-v2
          :columns="tableColumns"
          :data="tableData"
          :width="tableWidth"
          :height="tableHeight"
          :row-event-handlers="rowEventHandlers"
          :row-class="
            ({ rowIndex }: { rowIndex: number }) =>
              hoveredIndex === rowIndex ? 'is-hovered' : ''
          "
        />
      </div>

      <!-- 分页 -->
      <div class="dialog-list__pagination">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          background
          @current-change="onPageChange"
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
/* ── 布局 ── */
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
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
}

.dialog-list__pagination {
  display: flex;
  justify-content: flex-end;
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

/* ── 自定义单选圆点 ── */
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

/* ── 行悬浮高亮 ── */
:deep(.el-table-v2__row.is-hovered .el-table-v2__row-cell) {
  background-color: var(--el-fill-color-light);
}

/* ── 单元格文本省略 ── */
:deep(.cell-text) {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
