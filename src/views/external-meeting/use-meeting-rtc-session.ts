import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type Ref,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { ConnectionState } from 'livekit-client';
import { getRtcTokenApi, startRtcApi } from '@/api/modules/meeting-rtc';
import { notifyMeetingDisconnect } from '@/api/modules/meeting';
import type { MeetingRtcTokenResponse } from '@/api/modules/meeting-rtc.type';
import type { ParticipantInfo } from '@/composables/use-livekit-room';
import { useMeetingStore, useUserStore } from '@/stores';
import { useMeetingRtcStore } from '@/stores/modules/meeting-rtc';
import { MEETING_RTC_OWNER_KEY } from '@/utils/meeting-cross-window';

/******************************** 类型定义 ********************************/

interface UseMeetingRtcSessionOptions {
  connectionState: Ref<ConnectionState>;
  rtcParticipants: Ref<ParticipantInfo[]>;
  activeSpeakers: Ref<string[]>;
  isMicEnabled: Ref<boolean>;
  playbackVolume: Ref<number>;
  bootstrapOnMount?: boolean;
  joinRoom: (tokenInfo: MeetingRtcTokenResponse) => Promise<void>;
  leaveRoom: () => Promise<void>;
  setPlaybackVolume: (value: number) => void;
  requestPlaybackPermission: () => void;
  prepareForPageUnload: () => void;
}

/******************************** RTC 会话逻辑 ********************************/

export function useMeetingRtcSession(options: UseMeetingRtcSessionOptions) {
  const {
    connectionState,
    rtcParticipants,
    activeSpeakers,
    isMicEnabled,
    playbackVolume,
    bootstrapOnMount = true,
    joinRoom,
    leaveRoom,
    setPlaybackVolume,
    requestPlaybackPermission,
    prepareForPageUnload,
  } = options;

  const route = useRoute();
  const router = useRouter();
  const { t } = useI18n();
  const meetingStore = useMeetingStore();
  const userStore = useUserStore();
  const rtcStore = useMeetingRtcStore();

  const isJoining = ref(false);
  const isStartingRtc = ref(false);
  const isStoppingMeeting = ref(false);
  const waitingMicPermission = ref(false);
  const lastJoinAttemptMeetingId = ref<string | null>(null);

  let rtcOwnershipHeartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let permissionStatus: PermissionStatus | null = null;
  let permissionRetryRegistered = false;
  let disconnectNotifiedMeetingId: string | null = null;

  const meetingDetail = computed(() => meetingStore.meetingDetail);
  const currentUser = computed(() => userStore.userInfo);

  /**
   * 有值就用，无值走兜底currentUserId
   * 主要是拿当前用户 id。
   */
  const currentUserId = computed(
    () =>
      meetingStore.toNumericId(currentUser.value?.userId) ||
      meetingStore.toNumericId(meetingDetail.value?.currentUserId)
  );
  const isConnected = computed(
    () => connectionState.value === ConnectionState.Connected
  );

  const isReconnecting = computed(
    () => connectionState.value === ConnectionState.Reconnecting
  );
  const isRtcRunning = computed(
    () => meetingDetail.value?.session.rtcStatus === 'RUNNING'
  );
  const currentMeetingId = computed(() => meetingDetail.value?.session.id);

  /**
   * 判断当前标签页是否持有指定会议的 RTC 所有权
   *
   * 背景：同一时间只允许一个浏览器标签页连入同一场会议的 LiveKit 音频，
   * 通过 localStorage 实现跨标签页互斥锁（key: MEETING_RTC_OWNER_KEY）。
   *
   * @returns
   *  true  — 当前标签页是该会议的 RTC owner，可以连接语音
   *  false — 两种情况：① 还没有任何标签页 claim（首次进入）；
   *           ② 另一个标签页持有所有权（本页不应连入）
   */
  const isCurrentTabRtcOwner = computed(() =>
    meetingStore.isCurrentTabRtcOwner(currentMeetingId.value)
  );
  const isRtcOwnedByOtherTab = computed(() =>
    meetingStore.isRtcOwnedByOtherTab(currentMeetingId.value)
  );

  // 当前用户是否可加入 RTC
  const canCurrentUserJoinRtc = computed(() => {
    if (!meetingDetail.value) {
      return false;
    }
    if (meetingDetail.value.session.status !== 'ACTIVE') {
      return false;
    }

    // 找到当前用户 id 数据证明加入了会议资格，并查看当前状态 是不是已经接受邀请
    return meetingDetail.value.participants.some(
      (item) =>
        meetingStore.toNumericId(item.userId) === currentUserId.value &&
        item.inviteStatus === 'ACCEPTED'
    );
  });

  // 是否显示“加入通话”按钮
  const showJoinRtcButton = computed(
    () => canCurrentUserJoinRtc.value && !isConnected.value
  );

  // 当前用户是否为主持人
  // const isHost = computed(
  //   () =>
  //     !!meetingDetail.value &&
  //     meetingStore.toNumericId(meetingDetail.value.session.hostUserId) ===
  //       currentUserId.value
  // );

  // 扬声器音量百分比
  const speakerVolumePercent = computed({
    get: () => Math.round(playbackVolume.value * 100),
    set: (value: number) => {
      setPlaybackVolume(value / 100);
    },
  });

  // 从 localStorage 同步 RTC 归属
  function syncRtcOwnership() {
    meetingStore.syncRtcOwnershipFromStorage();
  }

  // 判断当前页是否应自动加入 RTC
  function shouldAutoJoinCurrentMeeting() {
    return canCurrentUserJoinRtc.value && !isCurrentTabRtcOwner.value;
  }

  // 打开待处理会议
  async function openPendingMeeting(meetingId: string) {
    await meetingStore.enterMeeting(meetingId);
  }

  /**
   * 初始化会议抽屉（页面加载时调用）抽屉弃用
   *
   * 完整流程：
   * 1. 加载待处理的会议列表
   * 2. 检查 URL 是否携带 meetingId 查询参数：
   *    - 如果有 → 直接进入该会议并打开抽屉，结束
   * 3. 如果没有 meetingId 参数，加载当前用户参与的会议：
   *    a. 查找当前用户在该会议中的参与者记录（用于判断邀请状态）
   *    b. 如果会议活跃、用户已接受邀请、且没有其他标签页占用 RTC：
   *       → 标记“应恢复采集”并声明该标签页的 RTC 所有权
   *    c. 如果会议状态为 ACTIVE 且允许自动打开抽屉 → 打开抽屉
   *    d. 如果会议不是 ACTIVE 状态 → 关闭“自动打开抽屉”标记
   */
  async function bootstrapMeetingDrawer() {
    // 1. 加载本地持久化的待处理会议
    await meetingStore.loadPendingMeetings();

    // 2. 优先处理 URL 中指定的会议 ID
    const queryMeetingId = meetingStore.toMeetingId(route.query.meetingId);
    if (queryMeetingId) {
      await openPendingMeeting(queryMeetingId);
      return;
    }

    // 3. 没有指定会议 ID，加载当前活跃会议
    const currentMeeting = await meetingStore.loadCurrentMeeting();
    const activeMeetingId = currentMeeting?.session.id;

    // 从参与者列表中查找当前用户，用于后续判断邀请状态
    const currentParticipant =
      currentMeeting?.participants.find(
        (item) =>
          meetingStore.toNumericId(item.userId) ===
          meetingStore.toNumericId(currentMeeting.currentUserId)
      ) ?? null;

    // 4. 接管 RTC 所有权（条件：会议存在 + 活跃 + 用户已接受邀请 + 未被其他标签页占用）
    if (
      activeMeetingId &&
      currentMeeting?.session.status === 'ACTIVE' &&
      currentParticipant?.inviteStatus === 'ACCEPTED' &&
      !meetingStore.isRtcOwnedByOtherTab(activeMeetingId)
    ) {
      meetingStore.setShouldResumeCapture(true);
      meetingStore.claimRtcOwnership(activeMeetingId);
      // meetingStore.loadMeetingDetail(activeMeetingId);
    }

    // 5. 如果会议处于活跃状态，保持页面会议状态
    if (currentMeeting?.session.status === 'ACTIVE') {
      return;
    }

    // 6. 会议非活跃状态，关闭自动打开标记（避免下次误触发）
    meetingStore.setShouldAutoOpenDrawer(false);
  }

  // 判断是否为麦克风权限类错误
  function isMicrophonePermissionError(error: unknown) {
    const nextError = error as { name?: string; message?: string };
    return (
      nextError?.name === 'NotAllowedError' ||
      nextError?.name === 'NotReadableError' ||
      nextError?.name === 'PermissionDeniedError' ||
      /permission|denied|notallowed|notreadable|track start|device in use|麦克风|microphone|设备占用/i.test(
        nextError?.message || ''
      )
    );
  }

  // 判断是否为浏览器不支持麦克风
  function isMicrophoneUnsupportedError(error: unknown) {
    const nextError = error as { name?: string; message?: string };
    return (
      nextError?.name === 'NotFoundError' ||
      nextError?.name === 'NotSupportedError' ||
      /not supported|no audio input|device/i.test(nextError?.message || '')
    );
  }

  // 加入语音会议
  async function handleJoinVoice(silent = false) {
    if (!shouldAutoJoinCurrentMeeting() || isJoining.value) {
      return;
    }

    const meetingId = meetingDetail.value?.session.id ?? null;
    isJoining.value = true;
    waitingMicPermission.value = false;
    try {
      const { data } = await getRtcTokenApi(meetingId!);
      if (!data) {
        if (!silent) {
          ElMessage.error(t('meeting.autoJoinFailed'));
        }
        return;
      }
      rtcStore.setTokenInfo(data);
      await joinRoom(data);
      lastJoinAttemptMeetingId.value = meetingId;
      waitingMicPermission.value = false;
    } catch (error: any) {
      if (isMicrophonePermissionError(error)) {
        waitingMicPermission.value = true;
        registerPermissionRetry();
        if (lastJoinAttemptMeetingId.value !== meetingId) {
          ElMessage.warning(t('meeting.waitingMicPermission'));
        }
        lastJoinAttemptMeetingId.value = meetingId;
        return;
      }
      if (isMicrophoneUnsupportedError(error)) {
        ElMessage.error(t('meeting.browserUnsupported'));
        return;
      }
      if (!silent) {
        ElMessage.error(error?.message ?? t('meeting.autoJoinFailed'));
      }
    } finally {
      isJoining.value = false;
    }
  }

  // 接管当前会议的 RTC
  async function handleTakeOverRtc() {
    const meetingId = currentMeetingId.value;
    if (!meetingId || isJoining.value) {
      return;
    }
    if (!userStore.isLoggedIn) {
      await router.push({
        path: '/login',
        query: { redirect: route.fullPath },
      });
      return;
    }
    meetingStore.claimRtcOwnership(meetingId);
    await handleJoinVoice();
  }

  // 自动启动 RTC 服务（所有人均可触发）
  async function ensureRtcStarted() {
    if (
      !meetingDetail.value ||
      isStartingRtc.value ||
      isStoppingMeeting.value
    ) {
      return;
    }
    if (meetingDetail.value.session.status !== 'ACTIVE') {
      return;
    }
    if (meetingDetail.value.session.rtcStatus === 'RUNNING') {
      return;
    }

    isStartingRtc.value = true;
    try {
      await startRtcApi(meetingDetail.value.session.id);
      await meetingStore.loadMeetingDetail(meetingDetail.value.session.id);
    } catch (error: any) {
      ElMessage.error(error?.message ?? t('meeting.rtcStartFailed'));
    } finally {
      isStartingRtc.value = false;
    }
  }

  // 结束或离开会议
  async function handleStopMeeting() {
    const currentMeeting = meetingDetail.value;
    if (!currentMeeting || isStoppingMeeting.value) {
      return;
    }
    isStoppingMeeting.value = true;
    const exitingAsHost =
      meetingStore.toNumericId(currentMeeting.session.hostUserId) ===
      meetingStore.toNumericId(currentMeeting.currentUserId);

    try {
      await meetingStore.leaveMeeting();
      meetingStore.releaseRtcOwnership(currentMeeting.session.id);
      await leaveRoom();
      rtcStore.reset();
      meetingStore.clearMeetingRuntime();
      if (!exitingAsHost) {
        ElMessage.success(t('meeting.leaveSuccess'));
        return;
      }
      ElMessage.success(t('meeting.endSuccess'));
    } finally {
      isStoppingMeeting.value = false;
    }
  }

  // 拒绝待处理会议
  async function declinePendingMeeting(meetingId: string) {
    try {
      await meetingStore.declineMeeting(meetingId);
      ElMessage.success(t('meeting.declineSuccess'));
    } catch (error: any) {
      ElMessage.error(error?.message ?? t('meeting.declineFailed'));
    }
  }

  // 处理抽屉关闭确认
  function handleDrawerAttemptClose(done?: () => void) {
    if (
      !meetingDetail.value ||
      meetingDetail.value.session.status !== 'ACTIVE'
    ) {
      done?.();
      return;
    }

    ElMessageBox.confirm(
      t('meeting.backgroundConfirmMessage'),
      t('meeting.backgroundConfirmTitle'),
      {
        confirmButtonText: t('meeting.backgroundConfirmExit'),
        cancelButtonText: t('meeting.backgroundConfirmBackground'),
        distinguishCancelAndClose: true,
        closeOnClickModal: false,
        showClose: false,
        type: 'warning',
      }
    )
      .then(async () => {
        await handleStopMeeting();
        done?.();
      })
      .catch((action: any) => {
        if (action === 'cancel') {
          meetingStore.hideDrawerToBackground();
          done?.();
          ElMessage.info(t('meeting.backgroundRunning'));
        }
      });
  }

  // 权限恢复后自动重试加入 RTC
  async function retryJoinAfterPermission() {
    if (!waitingMicPermission.value || document.visibilityState !== 'visible') {
      return;
    }
    console.log('权限恢复后自动重试加入 RTC==>');
    await handleJoinVoice(true);
  }

  // 绑定浏览器麦克风权限变化监听
  async function bindPermissionStatusListener() {
    if (
      typeof navigator === 'undefined' ||
      !('permissions' in navigator) ||
      permissionStatus
    ) {
      return;
    }
    try {
      permissionStatus = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      });
      permissionStatus.onchange = () => {
        if (permissionStatus?.state === 'granted') {
          void retryJoinAfterPermission();
        }
      };
    } catch (_error) {
      permissionStatus = null;
      throw new Error(
        'Permission API is not supported:--> bindPermissionStatusListener方法失败'
      );
    }
  }

  // 注册麦克风权限重试链路
  function registerPermissionRetry() {
    void bindPermissionStatusListener();
    if (permissionRetryRegistered) {
      return;
    }
    permissionRetryRegistered = true;
    window.addEventListener('focus', handleWindowFocusRetry);
    document.addEventListener('visibilitychange', handleVisibilityRetry);
  }

  // 清理权限等待状态
  function clearPermissionRetry() {
    waitingMicPermission.value = false;
    lastJoinAttemptMeetingId.value = null;
  }

  // 窗口重新聚焦时重试加入
  function handleWindowFocusRetry() {
    void retryJoinAfterPermission();
  }

  // 页面恢复可见时重试加入
  function handleVisibilityRetry() {
    if (document.visibilityState === 'visible') {
      void retryJoinAfterPermission();
    }
  }

  // 页面隐藏时释放本地 RTC 并通知后端进入宽限期
  function handlePageHide() {
    const currentMeeting = meetingDetail.value;
    if (!currentMeeting || currentMeeting.session.status !== 'ACTIVE') {
      return;
    }
    if (disconnectNotifiedMeetingId !== currentMeeting.session.id) {
      notifyMeetingDisconnect(currentMeeting.session.id);
      disconnectNotifiedMeetingId = currentMeeting.session.id;
    }
    meetingStore.releaseRtcOwnership(currentMeeting.session.id);
    rtcStore.reset();
    prepareForPageUnload();
    void leaveRoom();
  }

  // 页面卸载时沿用同一套清理逻辑
  function handleBeforeUnload() {
    handlePageHide();
  }

  // RTC owner 变化时同步本地状态
  function handleRtcOwnershipStorageChange(event: StorageEvent) {
    if (event.storageArea !== localStorage) {
      return;
    }
    if (event.key && event.key !== MEETING_RTC_OWNER_KEY) {
      return;
    }
    syncRtcOwnership();
  }

  // 停止 RTC owner 心跳
  function stopRtcOwnershipHeartbeat() {
    if (!rtcOwnershipHeartbeatTimer) {
      return;
    }
    clearInterval(rtcOwnershipHeartbeatTimer);
    rtcOwnershipHeartbeatTimer = null;
  }

  /**
   * 启动 RTC owner 心跳（每 5 秒刷新 localStorage 中的所有权时间戳）
   *
   * 使用 canCurrentUserJoinRtc 而非 isCurrentTabRtcOwner 作为启动条件，
   * 避免 TTL 过期后心跳无法自恢复的死锁：
   *   claimOwnership → 15s TTL 过期 → isOwner=false → 心跳停 → 永远 false
   */
  function startRtcOwnershipHeartbeat() {
    stopRtcOwnershipHeartbeat();
    if (!currentMeetingId.value || !canCurrentUserJoinRtc.value) {
      return;
    }
    rtcOwnershipHeartbeatTimer = setInterval(() => {
      if (!currentMeetingId.value || !canCurrentUserJoinRtc.value) {
        stopRtcOwnershipHeartbeat();
        return;
      }
      meetingStore.claimRtcOwnership(currentMeetingId.value);
    }, 5000);
  }

  watch(
    () => meetingDetail.value?.session.status,
    async (status) => {
      if (status === 'ACTIVE') {
        disconnectNotifiedMeetingId = null;
      }
      if (status !== 'ACTIVE') {
        clearPermissionRetry();
      }
      if (isStoppingMeeting.value) {
        return;
      }
      if (status !== 'CLOSING' && !meetingStore.isTerminalStatus(status)) {
        return;
      }
      meetingStore.releaseRtcOwnership(currentMeetingId.value);
      await leaveRoom();
      rtcStore.reset();
      meetingStore.clearMeetingRuntime();
    }
  );

  watch(
    () => [
      meetingDetail.value?.session.id,
      meetingDetail.value?.session.status,
      meetingDetail.value?.session.rtcStatus,
      currentUserId.value,
    ],
    async () => {
      if (!meetingDetail.value || isStoppingMeeting.value) {
        return;
      }
      if (meetingDetail.value.session.status !== 'ACTIVE') {
        return;
      }
      if (meetingDetail.value.session.rtcStatus === 'RUNNING') {
        return;
      }
      await ensureRtcStarted();
    },
    { immediate: true }
  );

  watch(
    () => [
      meetingDetail.value?.session.id,
      meetingDetail.value?.session.status,
      meetingDetail.value?.session.rtcStatus,
      meetingDetail.value?.participants
        ?.map((item) => `${item.userId}:${item.inviteStatus}`)
        .join('|'),
      currentUserId.value,
      isCurrentTabRtcOwner.value,
      connectionState.value,
    ],
    async () => {
      if (
        !shouldAutoJoinCurrentMeeting() ||
        isConnected.value ||
        isReconnecting.value
      ) {
        return;
      }
      await handleJoinVoice(true);
    },
    { immediate: true }
  );

  watch(
    () => [
      currentMeetingId.value,
      isCurrentTabRtcOwner.value,
      isConnected.value,
    ],
    async () => {
      if (!isConnected.value) {
        stopRtcOwnershipHeartbeat();
        return;
      }
      if (!isCurrentTabRtcOwner.value) {
        stopRtcOwnershipHeartbeat();
        await leaveRoom();
        rtcStore.reset();
        return;
      }
      startRtcOwnershipHeartbeat();
    },
    { immediate: true }
  );

  watch(
    () => route.query.meetingId,
    async (value, oldValue) => {
      if (value === oldValue) {
        return;
      }
      const meetingId = meetingStore.toMeetingId(value);
      if (meetingId) {
        await openPendingMeeting(meetingId);
      }
    }
  );

  watch(connectionState, (state) => {
    rtcStore.setConnectionState(state);
  });

  watch(rtcParticipants, (list) => {
    rtcStore.setParticipants(list);
  });

  watch(activeSpeakers, (speakers) => {
    rtcStore.setActiveSpeakers(speakers);
  });

  watch(isMicEnabled, (enabled) => {
    rtcStore.setMicEnabled(enabled);
  });

  onMounted(async () => {
    requestPlaybackPermission();
    syncRtcOwnership();
    window.addEventListener('storage', handleRtcOwnershipStorageChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);
    if (bootstrapOnMount) {
      await bootstrapMeetingDrawer();
    }
  });

  onBeforeUnmount(() => {
    if (permissionRetryRegistered) {
      window.removeEventListener('focus', handleWindowFocusRetry);
      document.removeEventListener('visibilitychange', handleVisibilityRetry);
    }
    if (permissionStatus) {
      permissionStatus.onchange = null;
    }
    stopRtcOwnershipHeartbeat();
    window.removeEventListener('storage', handleRtcOwnershipStorageChange);
    window.removeEventListener('pagehide', handlePageHide);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    meetingStore.releaseRtcOwnership(currentMeetingId.value);
    void leaveRoom();
  });

  return {
    currentMeetingId,
    isConnected,
    isReconnecting,
    isRtcRunning,
    isCurrentTabRtcOwner,
    isRtcOwnedByOtherTab,
    showJoinRtcButton,
    speakerVolumePercent,
    waitingMicPermission,
    openPendingMeeting,
    handleTakeOverRtc,
    handleStopMeeting,
    declinePendingMeeting,
    handleDrawerAttemptClose,
  };
}
