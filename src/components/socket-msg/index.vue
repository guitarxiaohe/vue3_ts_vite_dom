<template>
  <div>
    <div>{{ msgInfo.text }}</div>
    <div style="display: flex; justify-content: space-between">
      <div></div>
      <ElButton size="small" @click="handleClick">去查看</ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WsMessage } from '@/types/ws';
import { ElButton } from 'element-plus';
import { useRouter } from 'vue-router';
import { useMeetingStore } from '@/stores';

const props = defineProps<{
  msgInfo: WsMessage;
}>();

const router = useRouter();
const meetingStore = useMeetingStore();

function resolveMeetingId(message: WsMessage) {
  const paramMeetingId = Number(message.params?.meetingId || 0);
  if (paramMeetingId > 0) {
    return paramMeetingId;
  }
  if (message.data && typeof message.data === 'object' && 'meetingId' in message.data) {
    return Number((message.data as { meetingId?: number }).meetingId || 0);
  }
  return 0;
}

const handleClick = async () => {
  const meetingId = resolveMeetingId(props.msgInfo);
  if (String(props.msgInfo.type || '').startsWith('meeting_') || meetingId > 0) {
    if (meetingId > 0) {
      await meetingStore.enterMeeting(meetingId);
    }
    meetingStore.openDrawer();
    return;
  }

  if (props.msgInfo.path) {
    router.push({
      path: props.msgInfo.path,
      query: props.msgInfo.params as any,
    });
  }
};
</script>
