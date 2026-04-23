<template>
  <div v-if="showColumnSettings" class="table-entity__toolbar">
    <div class="table-entity__toolbar-right">
      <el-popover
        placement="bottom-end"
        :width="320"
        trigger="click"
        popper-class="table-entity__settings-popover"
      >
        <template #reference>
          <el-button
            circle
            class="table-entity__settings-trigger"
            :title="t('common.columnSettings')"
          >
            <el-icon><Operation /></el-icon>
          </el-button>
        </template>

        <div class="table-entity__settings-panel overflow-y-auto h-50">
          <div class="table-entity__settings-title">
            {{ t('common.columnSettings') }}
          </div>

          <!-------------------------- 列拖拽列表 -------------------------->
          <VueDraggable
            v-model="localColumns"
            handle=".table-entity__settings-handle"
            :animation="180"
            ghost-class="table-entity__settings-row--ghost"
            chosen-class="table-entity__settings-row--chosen"
            drag-class="table-entity__settings-row--drag"
            :disabled="columnSortLoading"
            @end="onDragEnd"
          >
            <div
              v-for="column in localColumns"
              :key="column.key"
              class="table-entity__settings-row"
            >
              <div class="table-entity__settings-main">
                <el-icon class="table-entity__settings-handle">
                  <Grid />
                </el-icon>
                <span class="table-entity__settings-label">
                  {{ column.title }}
                </span>
              </div>

              <el-checkbox
                :model-value="!hiddenColumnKeySet.has(column.dataKey)"
                :disabled="isColumnVisibleLocked(column.dataKey)"
                @change="
                  (checked: boolean | string | number) =>
                    emit('column-visible-change', {
                      dataKey: column.dataKey,
                      checked,
                    })
                "
              >
              </el-checkbox>
            </div>
          </VueDraggable>
        </div>
      </el-popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Operation, Grid } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { VueDraggable } from 'vue-draggable-plus';
import type { SortableEvent } from 'vue-draggable-plus';
import type {
  TableColumnReorderPayload,
  TableColumnSettingItem,
} from './index.type';

/******************************** 组件入参 ********************************/

const props = withDefaults(
  defineProps<{
    showColumnSettings?: boolean;
    settingsColumns: TableColumnSettingItem[];
    hiddenColumnKeys?: string[];
    visibleColumnCount: number;
    columnSortLoading?: boolean;
  }>(),
  {
    showColumnSettings: false,
    hiddenColumnKeys: () => [],
    columnSortLoading: false,
  }
);

const emit = defineEmits<{
  'column-visible-change': [
    payload: { dataKey: string; checked: boolean | string | number },
  ];
  'column-move': [payload: { columnKey: string; direction: 'up' | 'down' }];
  'column-reorder': [payload: TableColumnReorderPayload];
}>();

const { t } = useI18n();

/******************************** 组件状态 ********************************/

const localColumns = ref<TableColumnSettingItem[]>([]);

const hiddenColumnKeySet = computed(
  () => new Set((props.hiddenColumnKeys ?? []).map(String))
);

/******************************** 监听 ********************************/

watch(
  () => props.settingsColumns,
  (columns) => {
    localColumns.value = columns.map((column) => ({ ...column }));
  },
  { immediate: true, deep: true }
);

/******************************** 组件方法 ********************************/

// 判断当前列是否必须保持可见
function isColumnVisibleLocked(dataKey: string) {
  return (
    props.visibleColumnCount <= 1 && !hiddenColumnKeySet.value.has(dataKey)
  );
}

// 拖拽结束后通知父级刷新列顺序
function onDragEnd(event: SortableEvent) {
  const oldIndex = event.oldDraggableIndex ?? event.oldIndex;
  const newIndex = event.newDraggableIndex ?? event.newIndex;

  if (
    oldIndex == null ||
    newIndex == null ||
    oldIndex === newIndex ||
    oldIndex < 0 ||
    newIndex < 0
  ) {
    return;
  }

  const column = localColumns.value[newIndex];

  if (!column) {
    return;
  }

  emit('column-reorder', {
    columnKey: column.key,
    oldIndex,
    newIndex,
    orderedKeys: localColumns.value.map((item) => item.key),
  });
}
</script>

<style scoped lang="scss">
.table-entity__settings-panel {
  max-height: 320px;
}

.table-entity__settings-title {
  margin-bottom: 10px;
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 600;
}

.table-entity__settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 36px;
  padding: 6px 8px;
  border-radius: 8px;
  background: var(--color-bg-card);
  transition:
    background-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.table-entity__settings-row + .table-entity__settings-row {
  margin-top: 4px;
}

.table-entity__settings-row:hover {
  background: var(--color-bg-hover);
}

.table-entity__settings-main {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
}

.table-entity__settings-handle {
  flex-shrink: 0;
  color: var(--color-text-secondary);
  cursor: grab;
}

.table-entity__settings-handle:active {
  cursor: grabbing;
}

.table-entity__settings-label {
  overflow: hidden;
  color: var(--color-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.table-entity__settings-row--ghost {
  opacity: 0.45;
  background: var(--color-primary-bg);
}

.table-entity__settings-row--chosen {
  box-shadow: var(--shadow-sm);
}

.table-entity__settings-row--drag {
  background: var(--color-bg-card);
  box-shadow: var(--shadow-lg);
}
</style>
