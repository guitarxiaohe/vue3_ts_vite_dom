import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

/******************************** 在线状态 Store ********************************/

export const usePresenceStore = defineStore('presence', () => {
  const onlineUserIds = ref<number[]>([]);

  // 全量覆盖当前在线用户快照
  function setOnlineUserIds(userIds: number[]) {
    onlineUserIds.value = Array.from(new Set(userIds));
  }

  // 判断指定用户是否在线
  function isUserOnline(userId?: number | string | null) {
    if (userId === undefined || userId === null || userId === '') {
      return false;
    }
    const normalizedId = Number(userId);
    if (Number.isNaN(normalizedId)) {
      return false;
    }
    return onlineUserIds.value.includes(normalizedId);
  }

  const onlineCount = computed(() => onlineUserIds.value.length);

  return { onlineUserIds, onlineCount, setOnlineUserIds, isUserOnline };
});
