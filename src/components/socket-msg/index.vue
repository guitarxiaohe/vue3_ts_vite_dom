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

function resolveMeetingId(message: WsMessage): string {
  const paramMeetingId = String(message.params?.meetingId || '');
  if (paramMeetingId) {
    return paramMeetingId;
  }
  if (
    message.data &&
    typeof message.data === 'object' &&
    'meetingId' in message.data
  ) {
    return String((message.data as { meetingId?: unknown }).meetingId || '');
  }
  return '';
}

const handleClick = async () => {
  const meetingId = resolveMeetingId(props.msgInfo);
  if (String(props.msgInfo.type || '').startsWith('meeting_') || meetingId) {
    if (meetingId) {
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
