import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { WsMessage } from '@/types/ws';

const STORAGE_KEY = 'ws_notifications';

export const useNotificationStore = defineStore('notification', () => {
  const messages = ref<WsMessage[]>(
    JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]')
  );

  const unreadCount = computed(() => messages.value.length);

  function push(msg: WsMessage) {
    messages.value.unshift(msg);
    // 最多保留 50 条
    if (messages.value.length > 50) {
      messages.value = messages.value.slice(0, 50);
    }
    save();
  }

  function markAllRead() {
    messages.value = [];
    save();
  }

  function remove(index: number) {
    messages.value.splice(index, 1);
    save();
  }

  function save() {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.value));
  }

  /** 从后端日志初始化（登录后调用） */
  function initFromLogs(
    logs: {
      title: string;
      content: string;
      path: string;
      queryParams: string;
      msgType: string;
    }[]
  ) {
    const mapped: WsMessage[] = logs.map((l) => ({
      type: l.msgType,
      title: l.title,
      text: l.content,
      path: l.path,
      params: l.queryParams ? JSON.parse(l.queryParams) : undefined,
    }));
    messages.value = mapped;
    save();
  }

  return { messages, unreadCount, push, markAllRead, remove, initFromLogs };
});
