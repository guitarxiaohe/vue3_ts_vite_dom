<script setup lang="ts">
import { MoreFilled } from '@element-plus/icons-vue';
import type {
  RowActionRenderConfig,
  RowActionRuntimeActions,
} from '@/features/entities/_shared/row-actions-types';

/******************************** 组件入参 ********************************/

const props = withDefaults(
  defineProps<{
    row: Record<string, any>;
    actions: RowActionRuntimeActions;
    primaryActions: RowActionRenderConfig[];
    extraActions: RowActionRenderConfig[];
  }>(),
  {
    primaryActions: () => [],
    extraActions: () => [],
  }
);

const emit = defineEmits<{
  refresh: [];
}>();

/******************************** 事件方法 ********************************/

// 子按钮刷新列表
function onRefresh() {
  emit('refresh');
}

// 执行内置行操作
function runBuiltinAction(action: RowActionRenderConfig) {
  if (!action.actionKey) return;
  void props.actions[action.actionKey](props.row);
}
</script>

<template>
  <div class="action-column">
    <!-------------------------- 主要按钮 -------------------------->
    <template v-for="action in props.primaryActions" :key="action.key">
      <component
        :is="action.component"
        v-if="action.component"
        :row="props.row"
        :actions="props.actions"
        @refresh="onRefresh"
      />
      <el-button
        v-else
        :type="action.danger ? 'danger' : 'primary'"
        link
        size="small"
        @click.stop="runBuiltinAction(action)"
      >
        {{ action.label }}
      </el-button>
    </template>

    <!-------------------------- 更多按钮 -------------------------->
    <el-dropdown
      v-if="props.extraActions.length"
      trigger="hover"
      class="action-column__more"
    >
      <el-button
        type="primary"
        link
        size="small"
        :icon="MoreFilled"
      />
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="action in props.extraActions"
            :key="action.key"
          >
            <component
              :is="action.component"
              v-if="action.component"
              :row="props.row"
              :actions="props.actions"
              @refresh="onRefresh"
            />
            <el-button
              v-else
              :type="action.danger ? 'danger' : 'primary'"
              link
              size="small"
              @click.stop="runBuiltinAction(action)"
            >
              {{ action.label }}
            </el-button>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped lang="scss">
.action-column {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  gap: 8px;
}

.action-column :deep(.el-button + .el-button) {
  margin-left: 0;
}

.action-column__more :deep(.el-button) {
  padding: 0 4px;
}
</style>
