<script setup lang="ts">
import type { RowActionRuntimeActions } from '@/features/entities/_shared/row-actions-types';

/******************************** 组件入参 ********************************/

const props = defineProps<{
  row: Record<string, any>;
  actions: RowActionRuntimeActions;
}>();

/******************************** 事件方法 ********************************/

// 调用表格内置详情
function onView() {
  props.actions.view(props.row);
}
</script>

<template>
  <el-button type="primary" link size="small" @click.stop="onView">
    查看
  </el-button>
</template>
