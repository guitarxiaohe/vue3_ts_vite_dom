<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref } from 'vue';
import { aiCreateRuleApi } from '../services';

/******************************** 组件入参 ********************************/

const props = defineProps<{
  selectedRows: Record<string, any>[];
  selectedKeys: string[];
  entityKey: string;
  clearSelection: () => void;
  refresh: () => void;
}>();

const loading = ref(false);

/******************************** 事件方法 ********************************/

async function handleBatchCreateRule() {
  if (loading.value) return;

  if (!props.selectedRows.length) {
    ElMessage.warning('请先勾选要生成规则的问题');
    return;
  }

  await ElMessageBox.confirm(
    `确认将选中的 ${props.selectedRows.length} 个问题批量生成为规则吗？`,
    '批量生成规则',
    {
      type: 'info',
      confirmButtonText: '确认生成',
      cancelButtonText: '取消',
    }
  );

  loading.value = true;
  try {
    const ids = props.selectedRows
      .map((row) => row.questionId)
      .filter(Boolean)
      .join(',');
    await aiCreateRuleApi(ids);
    ElMessage.success('规则已批量生成');
    props.clearSelection();
    props.refresh();
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : '批量生成规则失败'
    );
    loading.value = false;
  }
}
</script>

<template>
  <el-button
    type="primary"
    :loading="loading"
    :disabled="!selectedRows.length"
    @click="handleBatchCreateRule"
  >
    AI 生成规则
  </el-button>
</template>
