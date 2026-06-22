<script lang="ts" setup>
import { computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import {
  useMeetingStore,
  useNotificationStore,
  useSystemStore,
} from '@/stores';
import type { CmsMeetingPendingInvite } from '@/api/modules/meeting.type';
import ConventionalMenu from '@/components/conventional-menu/index.vue';
import NoticeBar from '@/components/notice-bar/index.vue';
import NotifyBell from '@/components/notify-bell/index.vue';
import AiChat from '@/components/ai-chat/index.vue';
import {
  showMeetingInviteNotification,
  useWebSocket,
} from '@/composables/use-websocket';
import { getRecentWsLogsApi } from '@/api/modules/ws-log';
import HeaderAvatar from './compoments/header-avatar.vue';
const systemStore = useSystemStore();
const notificationStore = useNotificationStore();
const meetingStore = useMeetingStore();
const { t } = useI18n();
const router = useRouter();

const { connect, disconnect } = useWebSocket();

const isSideNav = computed(() => systemStore.navigationMode === 'side');

const isTopNav = computed(() => systemStore.navigationMode === 'top');

const pageTransitionName = computed(() =>
  systemStore.pageTransition === 'none'
    ? ''
    : `page-${systemStore.pageTransition}`
);

const layoutTransitionStyle = computed(() => {
  const speedMap = {
    slow: '420ms',
    normal: '260ms',
    fast: '160ms',
  };
  return {
    '--page-transition-duration': speedMap[systemStore.animationSpeed],
  };
});
const showMeetingReentry = computed(() => meetingStore.hasActiveMeeting);
const meetingReentryTitle = computed(
  () => meetingStore.meetingDetail?.session.title || t('meeting.drawerTitle')
);

function reopenMeetingDrawer() {
  const meetingId = meetingStore.currentMeetingId;
  if (!meetingId) {
    return;
  }
  router.push({
    path: '/external-meeting',
    query: { meetingId },
  });
}

/******************************** 初始化 WebSocket + 历史消息 ********************************/

onMounted(async () => {
  // 加载最近消息日志
  try {
    const res = (await getRecentWsLogsApi()) as any;
    if (res.code === 200 && Array.isArray(res.data)) {
      notificationStore.initFromLogs(res.data);
    }
  } catch {
    // 忽略
  }
  // 建立 WebSocket 连接
  connect();
  await meetingStore.loadPendingMeetings();
  const pendingMessages = meetingStore.buildPendingInviteMessages();
  pendingMessages.forEach((message) => {
    notificationStore.push(message);
    const invite = message.data as CmsMeetingPendingInvite;
    showMeetingInviteNotification(invite);
  });
});

onUnmounted(() => {
  disconnect();
});
</script>

<template>
  <div class="common-layout" :style="layoutTransitionStyle">
    <el-container>
      <ConventionalMenu v-if="isSideNav" mode="side" />

      <el-container direction="vertical">
        <div
          class="layout-topbar"
          :class="{ 'is-fixed': systemStore.fixedHeader }"
        >
          <!-------------------------- 顶部栏 -------------------------->
          <el-header class="layout-header">
            <div class="layout-header__left">
              <span class="layout-header__brand">XiaoHe</span>
              <ConventionalMenu v-if="isTopNav" mode="top" />
            </div>

            <div class="layout-header__right">
              <NotifyBell />
              <HeaderAvatar />
            </div>
          </el-header>

          <NoticeBar v-if="systemStore.showNoticeBar" />
        </div>

        <el-main>
          <router-view v-slot="{ Component }">
            <transition :name="pageTransitionName" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
    <transition name="meeting-entry-float">
      <button
        v-if="showMeetingReentry"
        type="button"
        class="meeting-entry-float"
        @click="reopenMeetingDrawer"
      >
        <span class="meeting-entry-float__dot" />
        <span class="meeting-entry-float__text">
          {{ meetingReentryTitle }}
        </span>
        <strong>进入会议</strong>
      </button>
    </transition>
    <AiChat />
  </div>
</template>

<style lang="scss" scoped>
.layout-topbar {
  background: var(--color-bg-card);

  &.is-fixed {
    position: sticky;
    top: 0;
    z-index: var(--z-dropdown);
  }
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--color-bg-card);
}

.layout-header__left {
  display: flex;
  align-items: center;
  gap: 24px;
  min-width: 0;
  flex: 1;
  align-self: stretch;
}

.layout-header__brand {
  flex-shrink: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 0.5px;
}

.layout-header__right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.layout-header__user-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: 0;
  background: var(--color-bg-card);
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);

  &:hover {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-bg);
  }
}

.layout-header__avatar {
  background: var(--color-primary);
  color: var(--color-bg-card);
  font-size: 13px;
  font-weight: 700;
}

.layout-header__user-name {
  display: inline-block;
  max-width: 160px;
  overflow: hidden;
  color: var(--color-text-primary);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.page-fade-enter-active),
:global(.page-fade-leave-active),
:global(.page-slide-enter-active),
:global(.page-slide-leave-active),
:global(.page-zoom-enter-active),
:global(.page-zoom-leave-active) {
  transition:
    opacity var(--page-transition-duration) ease,
    transform var(--page-transition-duration) ease;
}

:global(.page-fade-enter-from),
:global(.page-fade-leave-to) {
  opacity: 0;
}

:global(.page-slide-enter-from) {
  opacity: 0;
  transform: translateY(8px);
}

:global(.page-slide-leave-to) {
  opacity: 0;
  transform: translateY(-8px);
}

:global(.page-zoom-enter-from),
:global(.page-zoom-leave-to) {
  opacity: 0;
  transform: scale(0.985);
}

.meeting-entry-float-enter-active,
.meeting-entry-float-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.meeting-entry-float-enter-from,
.meeting-entry-float-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.meeting-entry-float {
  position: fixed;
  right: 24px;
  bottom: 88px;
  z-index: calc(var(--z-modal) - 1);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 0;
  border-radius: 999px;
  padding: 12px 18px;
  background: linear-gradient(135deg, #112d4e 0%, #1d4d7d 100%);
  color: #fff;
  box-shadow: 0 18px 36px rgba(10, 30, 60, 0.24);
  cursor: pointer;
}

.meeting-entry-float__dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #67e8a5;
  box-shadow: 0 0 0 6px rgba(103, 232, 165, 0.16);
}

.meeting-entry-float__text {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.9;
}
</style>
