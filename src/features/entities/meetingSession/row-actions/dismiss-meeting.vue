<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref } from 'vue';
import type { RowActionRuntimeActions } from '../../_shared/row-actions-types';
import { dismissMeetingApi } from '@/api/modules/meeting';

const props = defineProps<{
  row: Record<string, any>;
  actions: RowActionRuntimeActions;
}>();

const loading = ref(false);

async function handleDismissMeeting() {
  if (loading.value) {
    return;
  }

  await ElMessageBox.confirm(
    `确认解散会议《${props.row.title}》吗？解散后所有参会人都会被强制退出。`,
    '解散会议',
    {
      type: 'warning',
      confirmButtonText: '确认解散',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger',
    }
  );

  loading.value = true;
  try {
    await dismissMeetingApi(Number(props.row.id));
    ElMessage.success('会议已解散');
    props.actions.refresh();
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <el-button
    type="danger"
    link
    size="small"
    :loading="loading"
    @click.stop="handleDismissMeeting"
  >
    解散会议
  </el-button>
</template>
