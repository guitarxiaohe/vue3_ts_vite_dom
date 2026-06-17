<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { ref } from 'vue';
import { generateMeetingLinkApi } from '@/api/modules/meeting-public';

const props = defineProps<{
  selectedRows: Record<string, any>[];
  selectedKeys: string[];
  entityKey: string;
  clearSelection?: () => void;
  refresh: () => void; // 刷新列表
}>();

const loading = ref(false);

async function generateMeetingLink() {
  if (loading.value) {
    return;
  }

  loading.value = true;
  try {
    await generateMeetingLinkApi({
      scheduledEndAt: '2026-06-17 18:00:00',
      scheduledStartAt: '2026-06-15 18:00:00',
      title: '测试生成链接',
    });
    props.refresh();
    ElMessage.success('链接生成完成');
  } finally {
    loading.value = false;
  }
}

console.log('props ==>', props);
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
