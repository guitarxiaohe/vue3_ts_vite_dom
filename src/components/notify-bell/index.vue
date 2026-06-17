<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Bell } from 'lucide-vue-next';
import { useNotificationStore } from '@/stores';
import type { WsMessage } from '@/types/ws';

const router = useRouter();
const notificationStore = useNotificationStore();

const unreadCount = computed(() => notificationStore.unreadCount);
const messages = computed(() => notificationStore.messages);

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

async function handleClick(msg: WsMessage) {
  const meetingId = resolveMeetingId(msg);
  if (String(msg.type || '').startsWith('meeting_') || meetingId) {
    if (meetingId) {
      await router.push({
        path: '/external-meeting',
        query: { meetingId },
      });
    }
    return;
  }

  if (msg.path) {
    router.push({ path: msg.path, query: msg.params as any });
  }
}

function handleMarkAllRead() {
  notificationStore.markAllRead();
}
</script>

<template>
  <el-popover
    placement="bottom-end"
    :width="360"
    trigger="click"
    :show-arrow="false"
    popper-class="notify-bell-popover"
  >
    <template #reference>
      <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
        <button class="notify-bell-btn">
          <Bell :size="18" />
        </button>
      </el-badge>
    </template>

    <div class="notify-bell-panel">
      <div class="notify-bell-panel__header">
        <span class="notify-bell-panel__title">消息通知</span>
        <el-button
          v-if="unreadCount > 0"
          type="primary"
          link
          size="small"
          @click="handleMarkAllRead"
        >
          全部已读
        </el-button>
      </div>

      <div v-if="messages.length === 0" class="notify-bell-panel__empty">
        暂无新消息
      </div>

      <div v-else class="notify-bell-panel__list">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="notify-bell-panel__item"
          @click="handleClick(msg)"
        >
          <div class="notify-bell-panel__item-title">
            {{ msg.title || '新消息' }}
          </div>
          <div v-if="msg.text" class="notify-bell-panel__item-text">
            {{ msg.text }}
          </div>
        </div>
      </div>
    </div>
  </el-popover>
</template>

<style scoped lang="scss">
.notify-bell-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
  }
}

.notify-bell-panel {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 8px;
    margin-bottom: 8px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
  }

  &__empty {
    padding: 24px 0;
    text-align: center;
    color: var(--color-text-placeholder);
    font-size: 13px;
  }

  &__list {
    max-height: 320px;
    overflow-y: auto;
  }

  &__item {
    padding: 8px 4px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s;

    &:hover {
      background: var(--el-fill-color-light);
    }

    & + & {
      margin-top: 4px;
    }
  }

  &__item-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-primary);
    line-height: 1.4;
  }

  &__item-text {
    margin-top: 2px;
    font-size: 12px;
    color: var(--color-text-secondary);
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
