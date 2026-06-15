import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

/******************************** 在线状态 Store ********************************/

export const usePresenceStore = defineStore('presence', () => {
  const onlineUserIds = ref<string[]>([]);

  // 全量覆盖当前在线用户快照
  function setOnlineUserIds(userIds: string[]) {
    onlineUserIds.value = Array.from(new Set(userIds));
  }

  // 判断指定用户是否在线
  function isUserOnline(userId?: string | null) {
    if (!userId) {
      return false;
    }
    return onlineUserIds.value.includes(userId);
  }

  const onlineCount = computed(() => onlineUserIds.value.length);

  return { onlineUserIds, onlineCount, setOnlineUserIds, isUserOnline };
});
