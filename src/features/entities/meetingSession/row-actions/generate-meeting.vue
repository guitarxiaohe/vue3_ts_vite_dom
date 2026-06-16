<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref } from 'vue';
import type { RowActionRuntimeActions } from '../../_shared/row-actions-types';
import { dismissMeetingApi } from '@/api/modules/meeting';
import { useUserStore } from '@/stores/modules/user';

const props = defineProps<{
  row: Record<string, any>;
  actions: RowActionRuntimeActions;
}>();

const loading = ref(false);

async function generateMeetingLink() {
  if (loading.value) {
    return;
  }

  loading.value = true;
  try {
    const user = useUserStore();
    const userId = user.userInfo?.userId;
    // await dismissMeetingApi(userId ?? '');
    ElMessage.success('链接生成完成');
    props.actions.refresh();

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
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <el-button
    type="primary"
    :loading="loading"
    @click.stop="generateMeetingLink"
  >
    生成会议链接
  </el-button>
</template>
