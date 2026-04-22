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

        <div class="table-entity__settings-panel">
          <div class="table-entity__settings-title">
            {{ t('common.columnSettings') }}
          </div>
          <div
            v-for="(column, index) in settingsColumns"
            :key="column.key"
            class="table-entity__settings-item"
          >
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
              <span class="table-entity__settings-label">
                {{ column.title }}
              </span>
            </el-checkbox>
            <div class="table-entity__settings-actions">
              <el-button
                circle
                size="small"
                :disabled="index === 0 || columnSortLoading"
                @click="emit('column-move', { columnKey: column.key, direction: 'up' })"
              >
                <el-icon><ArrowUp /></el-icon>
              </el-button>
              <el-button
                circle
                size="small"
                :disabled="index === settingsColumns.length - 1 || columnSortLoading"
                @click="
                  emit('column-move', {
                    columnKey: column.key,
                    direction: 'down',
                  })
                "
              >
                <el-icon><ArrowDown /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </el-popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ArrowDown, ArrowUp, Operation } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import type { TableColumnSettingItem } from './index.type';

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
}>();

const { t } = useI18n();

/******************************** 组件状态 ********************************/

const hiddenColumnKeySet = computed(
  () => new Set((props.hiddenColumnKeys ?? []).map(String))
);

/******************************** 组件方法 ********************************/

// 判断当前列是否必须保持可见
function isColumnVisibleLocked(dataKey: string) {
  return props.visibleColumnCount <= 1 && !hiddenColumnKeySet.value.has(dataKey);
}
</script>
