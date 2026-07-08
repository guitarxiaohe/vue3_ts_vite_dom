import {
  computed,
  nextTick,
  onMounted,
  onBeforeUnmount,
  ref,
  watch,
  type Ref,
  type ShallowRef,
} from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ConnectionState, LocalVideoTrack, Room } from 'livekit-client';
import { useI18n } from 'vue-i18n';
import {
  startScreenShareApi,
  stopScreenShareApi,
  notifyScreenShareStop,
} from '@/api/modules/meeting';
import { useMeetingStore, useUserStore } from '@/stores';
import type {
  RemoteScreenShareInfo,
  ScreenShareQuality,
} from '@/composables/use-livekit-room';
import { useFullscreen } from '@vueuse/core';
/******************************** 类型定义 ********************************/

interface UseMeetingScreenShareOptions {
  /** LiveKit Room 实例（ShallowRef） */
  room: ShallowRef<Room | null>;
  /** LiveKit 连接状态 */
  connectionState: Ref<ConnectionState>;
  /** 本地屏幕共享视频轨 */
  localScreenTrack: ShallowRef<LocalVideoTrack | null>;
  /** 远端屏幕共享信息（参与者标识、显示名、视频轨等） */
  remoteScreenShare: ShallowRef<RemoteScreenShareInfo | null>;
  /** 开始本地屏幕共享，返回屏幕视频轨 */
  startScreenShare: (quality?: ScreenShareQuality) => Promise<LocalVideoTrack>;
  /** 停止本地屏幕共享 */
  stopScreenShare: () => Promise<void>;
}

/******************************** 共享屏幕逻辑 ********************************/

/**
 * 会议屏幕共享管理 Composable
 *
 * 封装屏幕共享的完整生命周期，包括：
 * - 共享状态感知（是否有人正在共享、当前共享者是谁）
 * - 本地屏幕共享的启动与停止（含后端 API 调用）
 * - 远端屏幕共享视频轨的 DOM 挂载与清理
 * - 共享权限控制（同一时间只允许一人共享）
 * - 浏览器原生"停止共享"按钮的事件监听
 *
 * @param options - LiveKit 房间实例及相关响应式状态
 * @returns 屏幕共享相关的响应式数据和操作方法
 */
export function useMeetingScreenShare(options: UseMeetingScreenShareOptions) {
  const {
    room,
    connectionState,
    localScreenTrack,
    remoteScreenShare,
    startScreenShare,
    stopScreenShare,
  } = options;

  const { t } = useI18n();
  const meetingStore = useMeetingStore();
  const userStore = useUserStore();

  /******************************** 响应式状态 ********************************/

  /** 屏幕共享舞台的 DOM 容器引用，用于挂载视频轨 */
  const screenShareVideoRef = ref<HTMLDivElement | null>(null);
  /** 是否正在执行停止共享操作（防止重复调用） */
  const isStoppingScreenShare = ref(false);
  /** 当前页面是否可见，用于避免在后台标签页弹全屏确认 */
  const isPageVisible = ref(
    typeof document === 'undefined' || document.visibilityState === 'visible'
  );
  /** 本轮共享是否已经弹过全屏确认 */
  const promptedShareSessionKey = ref<string | null>(null);
  /** 是否正在等待本轮共享的全屏确认结果 */
  const fullscreenPromptingSessionKey = ref<string | null>(null);
  /** 是否由本次确认逻辑触发进入全屏 */
  const enteredFullscreenByPrompt = ref(false);

  /******************************** 计算属性 ********************************/

  /** 当前会议详情 */
  const meetingDetail = computed(() => meetingStore.meetingDetail);
  /** 当前登录用户信息 */
  const currentUser = computed(() => userStore.userInfo);
  /** 当前会议 ID */
  const currentMeetingId = computed(() => meetingDetail.value?.session.id);
  /** 屏幕共享状态（来自 WebSocket 推送，跨客户端同步） */
  const screenShareState = computed(() => meetingStore.screenShareState);
  /** 是否已连接到 LiveKit 房间 */
  const isConnected = computed(
    () => connectionState.value === ConnectionState.Connected
  );

  /**
   * 是否有人正在共享屏幕
   * 基于 WebSocket 推送的 screenShareState.shareActive 判断
   */
  const isSomeoneSharing = computed(
    () => screenShareState.value?.shareActive === true
  );

  /**
   * 当前登录用户是否就是共享者
   * 比较 screenShareState.sharerUserId 与 meetingDetail.currentUserId
   */
  const isCurrentUserSharing = computed(
    () =>
      !!screenShareState.value?.shareActive &&
      meetingDetail.value?.currentUserId != null &&
      screenShareState.value.sharerUserId === meetingDetail.value.currentUserId
  );

  /**
   * 是否展示共享舞台（远端有人共享 且 不是当前用户自己在共享）
   *
   * 双重判断兜底 WebSocket 推送不可靠的场景：
   * - screenShareState.shareActive：WebSocket 推送（正常路径）
   * - remoteScreenShare.track：LiveKit 实际订阅到的远端屏幕视频轨（兜底）
   */
  const shouldShowShareStage = computed(
    () =>
      (isSomeoneSharing.value || !!remoteScreenShare.value?.track) &&
      !isCurrentUserSharing.value
  );

  /**
   * 当前共享者的显示名称
   * - 如果是当前用户：使用自己的昵称/用户名
   * - 如果是远端用户：优先使用 RemoteScreenShareInfo 中的名称，其次使用 WebSocket 推送的 sharerIdentity
   */
  const currentSharerName = computed(() => {
    if (isCurrentUserSharing.value) {
      return (
        currentUser.value?.nickName ||
        currentUser.value?.userName ||
        t('meeting.defaultGuestName')
      );
    }
    return (
      remoteScreenShare.value?.participantName ||
      screenShareState.value?.sharerIdentity ||
      t('meeting.defaultGuestName')
    );
  });

  /**
   * 当前用户是否允许点击共享按钮
   * 禁用条件：
   * - 会议不在 ACTIVE 状态
   * - 已有其他人在共享（同一时间只允许一人共享）
   */
  const shareScreenDisabled = computed(
    () =>
      !meetingStore.isActiveStatus(meetingDetail.value?.session.status) ||
      (isSomeoneSharing.value && !isCurrentUserSharing.value)
  );

  /** 共享按钮文案：正在共享时显示"停止共享"，否则显示"共享屏幕" */
  const shareScreenLabel = computed(() => {
    if (isCurrentUserSharing.value) return '停止共享';
    return '共享屏幕';
  });
  /** 当前远端共享会话标识，用于确保每轮共享只弹一次全屏确认 */
  const currentRemoteShareSessionKey = computed(() => {
    if (!shouldShowShareStage.value || !screenShareState.value?.shareActive) {
      return null;
    }
    return [
      currentMeetingId.value || '',
      screenShareState.value.sharerIdentity || '',
      screenShareState.value.shareStartedAt || '',
    ].join(':');
  });

  /******************************** 全屏 ********************************/

  /**
   * 当有人共享屏幕时，自动将共享舞台容器进入全屏。
   * useFullscreen 必须在 setup 阶段调用，target 传入 screenShareVideoRef，
   * 通过 watch shouldShowShareStage 在共享开始时自动触发进入。
   */
  const {
    isFullscreen,
    enter: enterFullscreen,
    exit: exitFullscreen,
  } = useFullscreen(screenShareVideoRef);

  /******************************** 视频轨渲染 ********************************/

  /**
   * 将屏幕共享视频轨挂载到共享舞台 DOM 容器中
   *
   * 根据当前角色选择对应的视频轨：
   * - 本地共享者：使用 localScreenTrack
   * - 远端观看者：使用 remoteScreenShare.track
   *
   * 挂载前会清空容器内已有的 DOM 元素，避免重复挂载
   */
  function renderScreenShareTrack() {
    const container = screenShareVideoRef.value;
    if (!container) {
      return null;
    }

    container.innerHTML = '';

    const trackToRender = isCurrentUserSharing.value
      ? localScreenTrack.value
      : remoteScreenShare.value?.track;

    if (!trackToRender) {
      return null;
    }

    const element = trackToRender.attach() as HTMLVideoElement;
    element.style.width = '100%';
    element.style.height = '100%';
    element.style.objectFit = 'contain';
    element.autoplay = true;
    element.playsInline = true;
    container.appendChild(element);
    return element;
  }

  /** 清空共享舞台 DOM 容器中的所有子元素 */
  function clearScreenShareTrack() {
    const container = screenShareVideoRef.value;
    if (!container) {
      return;
    }
    container.innerHTML = '';
  }

  function syncPageVisibility() {
    isPageVisible.value =
      typeof document === 'undefined' || document.visibilityState === 'visible';
  }

  async function waitForVideoReady(element: HTMLVideoElement) {
    if (element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      await waitForNextVideoFrame(element);
      return;
    }

    await new Promise<void>((resolve) => {
      let settled = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        element.removeEventListener('loadedmetadata', handleReady);
        element.removeEventListener('canplay', handleReady);
        element.removeEventListener('playing', handleReady);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };

      const finish = () => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        resolve();
      };

      const handleReady = () => {
        void waitForNextVideoFrame(element).finally(finish);
      };

      element.addEventListener('loadedmetadata', handleReady, { once: true });
      element.addEventListener('canplay', handleReady, { once: true });
      element.addEventListener('playing', handleReady, { once: true });
      timeoutId = setTimeout(finish, 1800);
    });
  }

  async function waitForNextVideoFrame(element: HTMLVideoElement) {
    await new Promise<void>((resolve) => {
      if (
        'requestVideoFrameCallback' in element &&
        typeof element.requestVideoFrameCallback === 'function'
      ) {
        element.requestVideoFrameCallback(() => resolve());
        return;
      }
      requestAnimationFrame(() => resolve());
    });
  }

  async function promptFullscreenAfterVideoReady(
    element: HTMLVideoElement,
    shareSessionKey: string
  ) {
    if (
      promptedShareSessionKey.value === shareSessionKey ||
      fullscreenPromptingSessionKey.value === shareSessionKey
    ) {
      return;
    }

    fullscreenPromptingSessionKey.value = shareSessionKey;
    try {
      await waitForVideoReady(element);

      if (
        currentRemoteShareSessionKey.value !== shareSessionKey ||
        !shouldShowShareStage.value ||
        isCurrentUserSharing.value ||
        !isPageVisible.value ||
        isFullscreen.value
      ) {
        return;
      }

      await ElMessageBox.confirm('检测到屏幕共享，是否全屏查看？', '共享屏幕', {
        confirmButtonText: '全屏查看',
        cancelButtonText: '暂不',
        closeOnClickModal: false,
        closeOnPressEscape: true,
        type: 'info',
      });
      await enterFullscreen();
      enteredFullscreenByPrompt.value = true;
      promptedShareSessionKey.value = shareSessionKey;
    } catch (_error) {
      if (currentRemoteShareSessionKey.value === shareSessionKey) {
        promptedShareSessionKey.value = shareSessionKey;
      }
    } finally {
      if (fullscreenPromptingSessionKey.value === shareSessionKey) {
        fullscreenPromptingSessionKey.value = null;
      }
    }
  }

  /******************************** 共享控制 ********************************/

  /**
   * 停止当前用户的屏幕共享
   *
   * 执行步骤：
   * 1. 调用 LiveKit stopScreenShare 停止本地屏幕采集
   * 2. 调用后端 API 通知服务端共享已停止（用于 WebSocket 广播给其他客户端）
   *
   * 使用 isStoppingScreenShare 标记防止重复调用
   */
  async function stopCurrentScreenShare() {
    const meetingId = currentMeetingId.value;
    if (!meetingId || isStoppingScreenShare.value) {
      return;
    }
    isStoppingScreenShare.value = true;
    try {
      await stopScreenShare();
      await stopScreenShareApi(meetingId);
    } finally {
      isStoppingScreenShare.value = false;
    }
  }

  /**
   * 处理共享屏幕按钮点击
   *
   * 两种行为：
   * - 当前正在共享 → 停止共享
   * - 当前未共享 → 启动共享
   *
   * 启动共享前会进行前置校验：
   * - 是否已连接 LiveKit 房间
   * - 是否已有其他人在共享（同一时间只允许一人）
   *
   * 同时监听浏览器原生的屏幕共享停止事件（如点击浏览器"停止共享"按钮），
   * 确保通过浏览器 UI 停止共享时也能同步调用后端 API
   */
  async function handleSharedScreen(quality?: ScreenShareQuality) {
    const meetingId = currentMeetingId.value;
    if (!meetingId) {
      return;
    }

    // 前置检查：必须先加入 RTC 房间
    if (!room.value || !isConnected.value) {
      ElMessage.warning(t('meeting.shareScreenJoinRtcFirst'));
      return;
    }

    // 已有其他人在共享时不允许抢占
    if (shareScreenDisabled.value && !isCurrentUserSharing.value) {
      if (isSomeoneSharing.value) {
        ElMessage.info(t('meeting.shareScreenOccupied'));
      }
      return;
    }

    try {
      // 场景一：停止当前共享
      if (isCurrentUserSharing.value) {
        await stopCurrentScreenShare();
        ElMessage.success(t('meeting.shareScreenStopped'));
        return;
      }

      // 场景二：启动共享
      // 先通知后端，再启动本地屏幕采集
      await startScreenShareApi(meetingId);

      try {
        const screenTrack = await startScreenShare(quality);
        // 监听浏览器原生停止共享事件（点击浏览器停止共享按钮时触发）
        screenTrack.mediaStreamTrack?.addEventListener(
          'ended',
          () => {
            void stopCurrentScreenShare();
          },
          { once: true }
        );
        ElMessage.success(t('meeting.shareScreenStarted'));
      } catch (error) {
        // 本地采集失败时需回滚后端状态
        await stopScreenShareApi(meetingId);
        throw error;
      }
    } catch (error: any) {
      ElMessage.error(error?.message ?? t('meeting.shareScreenFailed'));
    }
  }

  /******************************** 副作用监听 ********************************/

  /**
   * 当共享舞台不再展示时清空 DOM
   * 避免切换共享者时残留旧的视频画面
   */
  watch(
    () => shouldShowShareStage.value,
    (sharing) => {
      if (!sharing) {
        clearScreenShareTrack();
      }
    }
  );

  /**
   * 当共享舞台状态或视频轨发生变化时重新渲染
   * 使用 nextTick 确保 DOM 已更新后再挂载视频轨
   * 有人在共享时自动进入全屏，共享结束时退出全屏
   */
  watch(
    () => [
      shouldShowShareStage.value,
      localScreenTrack.value,
      remoteScreenShare.value?.track,
      currentRemoteShareSessionKey.value,
      isPageVisible.value,
    ],
    async () => {
      await nextTick();
      if (!shouldShowShareStage.value) {
        clearScreenShareTrack();
        if (enteredFullscreenByPrompt.value && isFullscreen.value) {
          await exitFullscreen();
        }
        enteredFullscreenByPrompt.value = false;
        fullscreenPromptingSessionKey.value = null;
        return;
      }
      const element = renderScreenShareTrack();
      const shareSessionKey = currentRemoteShareSessionKey.value;
      if (!element || !shareSessionKey) {
        return;
      }
      await promptFullscreenAfterVideoReady(element, shareSessionKey);
    },
    { immediate: true }
  );

  /**
   * 监听 WebSocket 推送的共享状态变更
   * 当 shareActive 变为 false 且本地仍有屏幕轨迹时，自动停止本地共享
   * （处理服务端强制停止共享的场景）
   */
  watch(
    () => screenShareState.value?.shareActive,
    async (active) => {
      if (active) {
        return;
      }
      if (localScreenTrack.value) {
        await stopCurrentScreenShare();
      }
    }
  );

  /**
   * 页面关闭/刷新时通知服务端停止屏幕共享
   * 使用 notifyScreenShareStop (fetch + keepalive) 确保请求可靠发送
   */
  function handleScreenSharePageHide() {
    const meetingId = currentMeetingId.value;
    if (meetingId && (isCurrentUserSharing.value || !!localScreenTrack.value)) {
      notifyScreenShareStop(meetingId);
    }
  }

  /** 组件卸载时清理共享舞台 DOM */
  onMounted(() => {
    document.addEventListener('visibilitychange', syncPageVisibility);
    window.addEventListener('pagehide', handleScreenSharePageHide);
    window.addEventListener('beforeunload', handleScreenSharePageHide);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', syncPageVisibility);
    window.removeEventListener('pagehide', handleScreenSharePageHide);
    window.removeEventListener('beforeunload', handleScreenSharePageHide);
    clearScreenShareTrack();
  });

  return {
    /** 屏幕共享舞台的 DOM 容器引用 */
    screenShareVideoRef,
    /** 远端屏幕共享信息 */
    remoteScreenShare,
    /** 屏幕共享状态（来自 WebSocket 推送） */
    screenShareState,
    /** 是否有人正在共享屏幕 */
    isSomeoneSharing,
    /** 当前登录用户是否就是共享者 */
    isCurrentUserSharing,
    /** 是否展示共享舞台 */
    shouldShowShareStage,
    /** 当前共享者的显示名称 */
    currentSharerName,
    /** 共享按钮是否禁用 */
    shareScreenDisabled,
    /** 共享按钮文案 */
    shareScreenLabel,
    /** 处理共享屏幕按钮点击 */
    handleSharedScreen,
    /** 清空共享舞台 DOM */
    clearScreenShareTrack,
  };
}
