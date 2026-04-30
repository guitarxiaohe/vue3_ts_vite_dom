<template>
  <el-drawer
    :model-value="modelValue"
    :title="drawerTitle"
    :size="drawerSize"
    destroy-on-close
    append-to-body
    :show-close="true"
    class="row-detail-drawer"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="totalRows > 0" class="row-detail-drawer__toolbar">
      <el-button
        :icon="ArrowUp"
        :disabled="rowIndex <= 0"
        circle
        size="small"
        @click="emit('prev')"
      />
      <span class="row-detail-drawer__pos">
        {{ rowIndex + 1 }}
      </span>
      <el-button
        :icon="ArrowDown"
        :disabled="rowIndex >= totalRows - 1"
        circle
        size="small"
        @click="emit('next')"
      />
    </div>
    <!-------------------------- 头部：左上切换 + 标题 -------------------------->
    <template #header>
      <div class="row-detail-drawer__header">
        <span class="row-detail-drawer__title">{{ drawerTitle }}</span>
      </div>
    </template>

    <!-------------------------- 基础信息：≤10 项一行三列，>10 一行四列 -------------------------->
    <el-row v-if="row" :gutter="12" class="row-detail-drawer__grid">
      <el-col
        v-for="col in detailColumns"
        :key="String(col.key)"
        :span="detailColumnSpan"
      >
        <div class="row-detail-drawer__item">
          <div class="row-detail-drawer__label">
            {{ String(col.title ?? col.dataKey ?? '') }}:
          </div>
          <DetailRender
            v-if="renderMap?.[String(col.dataKey)]"
            :content="renderMap[String(col.dataKey)]({ row, column: col })"
          />
          <DetailRender
            v-else-if="shouldUseRichRenderer(col)"
            :content="renderColumnDetail(row, col)"
          />
          <el-tooltip
            v-else
            :content="detailText(row, col)"
            placement="top"
            :show-after="200"
          >
            <div class="row-detail-drawer__value">
              {{ detailText(row, col) }}
            </div>
          </el-tooltip>
        </div>
      </el-col>
    </el-row>

    <!-------------------------- 子表区域 -------------------------->
    <section v-if="row && hasChildTables" class="row-detail-drawer__children">
      <el-tabs
        v-if="showChildTabs"
        v-model="activeChildTab"
        class="row-detail-drawer__tabs"
      >
        <el-tab-pane
          v-for="child in resolvedChildTables"
          :key="child.entityKey"
          :label="child.label"
          :name="child.name"
        >
          <RowDetailChildTable
            :config="child.config"
            :row="row"
            :show-title="false"
          />
        </el-tab-pane>
      </el-tabs>

      <RowDetailChildTable
        v-else-if="resolvedChildTables[0]"
        :config="resolvedChildTables[0].config"
        :row="row"
      />
    </section>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, isVNode, ref, watch } from 'vue';
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import type { PropType } from 'vue';
import type {
  ColumnsItem,
  DetailRenderMap,
  DetailRenderResult,
} from './index.type';
import { formatCellText } from './utils/column-utils';
import type { EntityTableChildConfig } from '@/types/entity-config';
import RowDetailChildTable from './row-detail-child-table.vue';

/******************************** 行详情抽屉（当前页 dataList 内上一条 / 下一条） ********************************/

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    width?: string | number;
    columns: ColumnsItem[];
    row: Record<string, any> | null;
    rowIndex: number;
    totalRows: number;
    renderMap?: DetailRenderMap;
    visibleCount?: number;
    hiddenKeys?: string[];
    childTables?: EntityTableChildConfig[];
  }>(),
  {
    title: '详情',
    rowIndex: 0,
    totalRows: 0,
    visibleCount: 11,
    hiddenKeys: () => [],
    childTables: () => [],
  }
);

const emit = defineEmits<{
  'update:modelValue': [v: boolean];
  prev: [];
  next: [];
}>();
const { t, te } = useI18n();
const activeChildTab = ref<string>('');

const DetailRender = defineComponent({
  name: 'DetailRender',
  props: {
    content: {
      type: [Object, Function] as PropType<DetailRenderResult>,
      required: true,
    },
  },
  setup(renderProps) {
    return () =>
      isVNode(renderProps.content)
        ? renderProps.content
        : h(renderProps.content);
  },
});

const drawerTitle = computed(() => props.title ?? '详情');
const renderMap = computed(() => props.renderMap);
const hasChildTables = computed(() => (props.childTables?.length ?? 0) > 0);
const resolvedChildTables = computed(() => {
  return (props.childTables ?? []).map((item, index) => ({
    name: `${item.entityKey}-${index}`,
    label:
      item.labelKey && te(item.labelKey)
        ? t(item.labelKey)
        : item.label || item.entityKey,
    config: item,
    entityKey: `${item.entityKey}-${index}`,
  }));
});
const showChildTabs = computed(() => resolvedChildTables.value.length > 1);

// 排除选择列、操作列，并支持隐藏字段与最大展示数量
const detailColumns = computed(() => {
  const hiddenKeySet = new Set(props.hiddenKeys.map(String));
  return props.columns
    .filter(
      (c) =>
        c.key !== '__sel__' &&
        c.key !== '__ops__' &&
        c.dataKey != null &&
        c.dataKey !== '' &&
        !hiddenKeySet.has(String(c.dataKey))
    )
    .slice(0, props.visibleCount);
});

// 字段数 ≤10：一行 3 列；>10：一行 4 列
const detailColumnSpan = computed(() =>
  detailColumns.value.length > 10 ? 6 : 8
);

const drawerSize = computed(() => {
  if (props.width != null) return props.width;
  if (hasChildTables.value) return '1080px';
  return detailColumnSpan.value === 6 ? '880px' : '480px';
});

function cellDisplay(row: Record<string, any>, col: ColumnsItem) {
  const dk = col.dataKey as string;
  return formatCellText(row[dk]);
}

// 判断详情是否使用富内容渲染
function shouldUseRichRenderer(col: ColumnsItem) {
  return (
    typeof col.cellRenderer === 'function' &&
    ['file', 'user', 'by'].includes(String(col.fieldType ?? '').toLowerCase())
  );
}

// 复用表格列的 cellRenderer，保证详情与列表展示一致
function renderColumnDetail(row: Record<string, any>, col: ColumnsItem) {
  const dataKey = String(col.dataKey ?? '');
  const rendered = col.cellRenderer?.({
    column: col,
    rowData: row,
    rowIndex: props.rowIndex,
    cellData: dataKey ? row[dataKey] : undefined,
    isScrolling: false,
  } as unknown as Parameters<NonNullable<ColumnsItem['cellRenderer']>>[0]);

  return rendered ?? h('span', {}, cellDisplay(row, col));
}

// 详情抽屉单行文案：默认省略，hover 用 tooltip 展示全文
function detailText(row: Record<string, any>, col: ColumnsItem) {
  const dataKey = String(col.dataKey ?? '');
  const cellData = dataKey ? row[dataKey] : undefined;
  const rawText = col.detailTextFormatter
    ? col.detailTextFormatter(row, cellData)
    : cellDisplay(row, col);
  return formatCellText(rawText);
}

watch(
  () => [props.modelValue, props.row],
  () => {
    activeChildTab.value = resolvedChildTables.value[0]?.name ?? '';
  },
  { immediate: true, deep: true }
);
</script>

<style scoped lang="scss">
.row-detail-drawer__header {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 24px;
  gap: 12px;
}

// 抽屉头部左侧：切换与序号
.row-detail-drawer__toolbar {
  background-color: var(--color-bg-card);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: absolute;
  top: calc(50% - 350px);
  left: -28px;
  width: 25px;
}

.row-detail-drawer__pos {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

// 标题占满剩余空间，与关闭按钮由 el-drawer 头布局处理
.row-detail-drawer__title {
  flex: 1;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.row-detail-drawer__grid {
  margin-top: 0;
}

.row-detail-drawer__children {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.row-detail-drawer__tabs:deep(.el-tabs__header) {
  margin-bottom: 8px;
}

.row-detail-drawer__item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  min-width: 0;
}

.row-detail-drawer__label {
  flex-shrink: 0;
  margin-right: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 20px;
}

.row-detail-drawer__value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--el-text-color-primary);
  line-height: 22px;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 12px;
}

.row-detail-drawer:deep(.el-drawer__header) {
  margin-bottom: 12px;
}

// 头部左侧工具条 + 标题与右侧关闭按钮对齐
.row-detail-drawer:deep(.el-drawer__header) {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}
</style>
