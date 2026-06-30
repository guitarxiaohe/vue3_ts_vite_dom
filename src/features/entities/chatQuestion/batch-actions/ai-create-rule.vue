<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref } from 'vue';
import { aiCreateRuleApi, type ChatQuestionData } from '../services';

/******************************** 组件入参 ********************************/

const props = defineProps<{
  selectedRows: ChatQuestionData[];
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
  const objs = props.selectedRows.filter((t: ChatQuestionData) =>
    ['PENDING'].includes(t?.status)
  );

  let text,
    confirmButtonText = '';
  if (objs.length > 0) {
    text = `确认将选中的${objs.length}个问题批量生成为规则吗？`;
    confirmButtonText = '确认生成';
  } else {
    text = `目前没有符合状态操作`;
    confirmButtonText = '好的';
  }
  await ElMessageBox.confirm(
    `只有待处理可以生成规则，经过自动筛选，${text} `,
    '批量生成规则',
    {
      type: 'info',
      confirmButtonText,
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
