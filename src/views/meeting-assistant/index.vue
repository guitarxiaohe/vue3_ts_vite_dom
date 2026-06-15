<script lang="ts" setup>
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useMeetingStore } from '@/stores';

const route = useRoute();
const { t } = useI18n();
const meetingStore = useMeetingStore();

async function openMeetingDrawer() {
  const meetingId = meetingStore.toMeetingId(route.query.meetingId);
  if (meetingId) {
    await meetingStore.enterMeeting(meetingId);
    meetingStore.openDrawer();
    return;
  }

  if (meetingStore.currentMeetingId) {
    await meetingStore.loadMeetingDetail(meetingStore.currentMeetingId);
    meetingStore.openDrawer();
    return;
  }

  const currentMeeting = await meetingStore.loadCurrentMeeting();
  if (currentMeeting?.session?.id) {
    meetingStore.openDrawer();
    return;
  }

  meetingStore.openDrawer();
}

onMounted(() => {
  void openMeetingDrawer();
});
</script>

<template>
  <div class="meeting-launcher">
    <el-result
      icon="success"
      :title="t('meeting.routeTitle')"
      :sub-title="t('meeting.routeDescription')"
    >
      <template #extra>
        <el-button type="primary" @click="openMeetingDrawer">
          {{ t('meeting.reopenDrawer') }}
        </el-button>
      </template>
    </el-result>
  </div>
</template>

<style lang="scss" scoped>
.meeting-launcher {
  min-height: calc(100vh - 180px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
</style>
