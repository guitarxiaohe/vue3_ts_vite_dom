import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ConnectionState } from 'livekit-client';
import type { ParticipantInfo } from '@/composables/use-livekit-room';
import type { MeetingRtcTokenResponse } from '@/api/modules/meeting-rtc.type';

export const useMeetingRtcStore = defineStore('meeting-rtc', () => {
  /** RTC Token 信息 */
  const tokenInfo = ref<MeetingRtcTokenResponse | null>(null);

  /** 连接状态 */
  const connectionState = ref<ConnectionState>(ConnectionState.Disconnected);

  /** 参与者列表 */
  const participants = ref<ParticipantInfo[]>([]);

  /** 活跃发言人 */
  const activeSpeakers = ref<string[]>([]);

  /** 麦克风是否启用 */
  const isMicEnabled = ref(true);

  /** 是否已连接 */
  const isConnected = computed(() => connectionState.value === ConnectionState.Connected);

  /** 是否正在重连 */
  const isReconnecting = computed(() => connectionState.value === ConnectionState.Reconnecting);

  /** 在线参与者数量 */
  const onlineCount = computed(() => participants.value.length);

  /**
   * 设置 Token 信息
   */
  function setTokenInfo(info: MeetingRtcTokenResponse) {
    tokenInfo.value = info;
  }

  /**
   * 更新连接状态
   */
  function setConnectionState(state: ConnectionState) {
    connectionState.value = state;
  }

  /**
   * 更新参与者列表
   */
  function setParticipants(list: ParticipantInfo[]) {
    participants.value = list;
  }

  /**
   * 更新活跃发言人
   */
  function setActiveSpeakers(speakers: string[]) {
    activeSpeakers.value = speakers;
  }

  /**
   * 更新麦克风状态
   */
  function setMicEnabled(enabled: boolean) {
    isMicEnabled.value = enabled;
  }

  /**
   * 重置状态
   */
  function reset() {
    tokenInfo.value = null;
    connectionState.value = ConnectionState.Disconnected;
    participants.value = [];
    activeSpeakers.value = [];
    isMicEnabled.value = true;
  }

  return {
    tokenInfo,
    connectionState,
    participants,
    activeSpeakers,
    isMicEnabled,
    isConnected,
    isReconnecting,
    onlineCount,
    setTokenInfo,
    setConnectionState,
    setParticipants,
    setActiveSpeakers,
    setMicEnabled,
    reset,
  };
});
