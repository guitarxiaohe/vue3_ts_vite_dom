<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref } from 'vue';
import type { RowActionRuntimeActions } from '../../_shared/row-actions-types';
import { aiCreateRuleApi } from '../services';

const props = defineProps<{
  row: Record<string, any>;
  actions: RowActionRuntimeActions;
}>();

const loading = ref(false);

async function handleCreateRule() {
  if (loading.value) return;

  const questionId = props.row.questionId;
  if (questionId == null) {
    ElMessage.warning('问题 ID 不存在');
    return;
  }

  await ElMessageBox.confirm(
    `确认将该问题「${props.row.question ?? ''}」生成为规则吗？`,
    'AI 生成规则',
    {
      type: 'info',
      confirmButtonText: '确认生成',
      cancelButtonText: '取消',
    }
  );

  loading.value = true;
  try {
    await aiCreateRuleApi(String(questionId));
    ElMessage.success('规则已生成');
    props.actions.refresh();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '生成规则失败');
    loading.value = false;
  }
}
</script>

<template>
  <el-button
    type="primary"
    link
    size="small"
    :loading="loading"
    @click.stop="handleCreateRule"
  >
    AI 生成规则
  </el-button>
</template>
