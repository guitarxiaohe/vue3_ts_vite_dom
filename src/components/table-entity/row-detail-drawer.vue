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
    <!-------------------------- 头部：左上切换 + 标题 -------------------------->
    <template #header>
      <div class="row-detail-drawer__header">
        <div v-if="totalRows > 0" class="row-detail-drawer__toolbar">
          <el-button
            :icon="ArrowUp"
            :disabled="rowIndex <= 0"
            circle
            size="small"
            @click="emit('prev')"
          />
          <span class="row-detail-drawer__pos">
            {{ rowIndex + 1 }} / {{ totalRows }}
          </span>
          <el-button
            :icon="ArrowDown"
            :disabled="rowIndex >= totalRows - 1"
            circle
            size="small"
            @click="emit('next')"
          />
        </div>
        <span class="row-detail-drawer__title">{{ drawerTitle }}</span>
      </div>
    </template>

    <!-------------------------- 基础信息：≤10 项一行三列，>10 一行四列 -------------------------->
    <el-descriptions
      v-if="row"
      :column="descColumnCount"
      border
      class="row-detail-drawer__desc"
    >
      <el-descriptions-item
        v-for="col in detailColumns"
        :key="String(col.key)"
        :label="String(col.title ?? col.dataKey ?? '')"
      >
        {{ cellDisplay(row, col) }}
      </el-descriptions-item>
    </el-descriptions>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue';
import type { ColumnsItem } from './index.type';
import { formatCellText } from './column-utils';

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
  }>(),
  {
    title: '详情',
    width: '480px',
    rowIndex: 0,
    totalRows: 0,
  }
);

const emit = defineEmits<{
  'update:modelValue': [v: boolean];
  prev: [];
  next: [];
}>();

const drawerTitle = computed(() => props.title ?? '详情');
const drawerSize = computed(() => props.width ?? '480px');

// 排除选择列、操作列
const detailColumns = computed(() =>
  props.columns.filter(
    (c) =>
      c.key !== '__sel__' &&
      c.key !== '__ops__' &&
      c.dataKey != null &&
      c.dataKey !== ''
  )
);

// 字段数 ≤10：一行 3 列；>10：一行 4 列
const descColumnCount = computed(() =>
  detailColumns.value.length > 10 ? 4 : 3
);

function cellDisplay(row: Record<string, any>, col: ColumnsItem) {
  const dk = col.dataKey as string;
  return formatCellText(row[dk]);
}
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
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
}

.row-detail-drawer__pos {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

// 标题占满剩余空间，与关闭按钮由 el-drawer 头布局处理
.row-detail-drawer__title {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.row-detail-drawer__desc {
  margin-top: 0;
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
