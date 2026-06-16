<script setup lang="ts">
import { computed } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useMeetingStore, useUserStore } from '@/stores';

const props = defineProps<{
  selectedRows: Record<string, any>[];
  clearSelection?: () => void;
}>();

const { t } = useI18n();
const meetingStore = useMeetingStore();
const userStore = useUserStore();

const inviteRows = computed(() =>
  props.selectedRows.filter(
    (item) => Number(item.userId) !== Number(userStore.userInfo?.userId)
  )
);

const inviteUserIds = computed(() =>
  inviteRows.value.map((item) => String(item.userId ?? '')).filter(Boolean)
);

const disabled = computed(
  () => inviteUserIds.value.length === 0 || meetingStore.loading
);

function formatNow() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function buildMeetingTitle() {
  const names = inviteRows.value
    .slice(0, 2)
    .map((item) => item.nickName || item.userName)
    .filter(Boolean);
  const suffix =
    inviteRows.value.length > 2
      ? t('meeting.startTitleSuffix', { count: inviteRows.value.length })
      : names.join('、');
  const hostName = userStore.displayName || t('meeting.defaultHostName');
  return t('meeting.quickStartTitle', {
    hostName,
    guestNames: suffix || t('meeting.defaultGuestName'),
    time: formatNow(),
  });
}

async function handleStartMeeting() {
  if (inviteUserIds.value.length === 0) {
    ElMessage.warning(t('meeting.selectOtherUsers'));
    return;
  }

  if (meetingStore.hasActiveMeeting) {
    meetingStore.openDrawer();
    ElMessage.info(t('meeting.resumeCurrent'));
    return;
  }

  const detail = await meetingStore.createMeeting({
    title: buildMeetingTitle(),
    remark: '',
    inviteUserIds: inviteUserIds.value,
  });

  meetingStore.openDrawer();
  props.clearSelection?.();

  ElMessage.success(
    t('meeting.createdWithCount', {
      count: detail.participants.filter((item) => item.isHost !== 1).length,
    })
  );
}
</script>

<template>
  <el-button
    type="primary"
    :loading="meetingStore.loading"
    @click="handleStartMeeting"
  >
    {{ t('meeting.startAction') }}
  </el-button>
</template>
