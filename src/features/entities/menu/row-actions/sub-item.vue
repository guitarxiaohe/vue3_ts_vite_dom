<script setup lang="ts">
import type { RowActionRuntimeActions } from '../../_shared/row-actions-types';

const props = defineProps<{
  row: Record<string, any>;
  actions: RowActionRuntimeActions;
}>();

const emit = defineEmits<{
  (e: 'action', payload: { actionKey: string; row: Record<string, any> }): void;
}>();

console.log(props);
</script>

<template>
  <el-button link size="small">子项</el-button>
</template>
<style scoped lang="scss"></style>
