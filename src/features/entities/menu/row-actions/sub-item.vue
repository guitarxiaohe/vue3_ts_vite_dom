<script setup lang="ts">
import type { RowActionRuntimeActions } from '../../_shared/row-actions-types';

/******************************** 组件入参 ********************************/

const props = defineProps<{
  row: Record<string, any>;
  actions: RowActionRuntimeActions;
}>();

/******************************** 事件方法 ********************************/

// 查看当前菜单的直接子项
function openSubItems() {
  void props.actions.subItems?.(props.row);
}
</script>

<template>
  <el-button type="primary" link size="small" @click.stop="openSubItems">
    子项
  </el-button>
</template>
