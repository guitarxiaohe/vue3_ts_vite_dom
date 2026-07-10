import {
  computed,
  onMounted,
  onBeforeUnmount,
  ref,
  watch,
  nextTick,
  type Ref,
  type ShallowRef,
} from 'vue';
import { storeToRefs } from 'pinia';
import { ElMessage } from 'element-plus';
import {
  ConnectionState,
  LocalVideoTrack,
  RemoteVideoTrack,
  Room,
} from 'livekit-client';
import {
  startCameraApi,
  stopCameraApi,
  notifyCameraStop,
} from '@/api/modules/meeting';
import { useMeetingStore } from '@/stores';
import { useUserStore } from '@/stores';
/******************************** 类型定义 ********************************/
const cameraVideoRef = ref<Record<string, HTMLDivElement | null>>({});
interface UseMeetingCameraOptions {
  room: ShallowRef<Room | null>;
  connectionState: Ref<ConnectionState>;
  isCameraEnabled: Ref<boolean>;
  toggleCamera: () => Promise<void>;
  localVideoTrack: ShallowRef<LocalVideoTrack | null>;
  remoteCameraTracks: ShallowRef<Map<string, RemoteVideoTrack>>;
}

/******************************** 摄像头逻辑 ********************************/

export function useMeetingCamera(options: UseMeetingCameraOptions) {
  const {
    room,
    connectionState,
    isCameraEnabled,
    toggleCamera: toggleLiveKitCamera,
    localVideoTrack,
    remoteCameraTracks,
  } = options;

  const { meetingDetail, screenCameraState } = storeToRefs(useMeetingStore());
  const { userInfo } = storeToRefs(useUserStore());
  /******************************** 响应式状态 ********************************/

  const isTogglingCamera = ref(false);
  const currentMeetingId = computed(() => meetingDetail.value?.session.id);
  const isConnected = computed(
    () => connectionState.value === ConnectionState.Connected
  );

  /******************************** 摄像头控制 ********************************/

  async function handleToggleCamera() {
    const meetingId = currentMeetingId.value;

    if (!meetingId) return;
    if (!room.value || !isConnected.value) {
      ElMessage.warning('请先加入语音房间');
      return;
    }

    if (isTogglingCamera.value) return;
    isTogglingCamera.value = true;

    try {
      const willEnable = !isCameraEnabled.value;

      if (willEnable) {
        await startCameraApi(meetingId);
        await toggleLiveKitCamera();
        ElMessage.success('摄像头已开启');
      } else {
        await toggleLiveKitCamera();
        await stopCameraApi(meetingId);
        ElMessage.success('摄像头已关闭');
      }
    } catch (error: any) {
      ElMessage.error(error?.message ?? '摄像头操作失败');
    } finally {
      isTogglingCamera.value = false;
    }
  }

  /******************************** 视频轨渲染 ********************************/

  /** 将摄像头视频轨挂载到指定参与者的 DOM 容器中 */
  function renderCameraTrack(userId: string) {
    const container = cameraVideoRef.value[userId];

    if (!container) return;
    console.log(
      " String(userInfo.value?.userId ?? '') === userId && ==>",
      localVideoTrack.value
    );
    container.innerHTML = '';
    // 本地摄像头：使用 localVideoTrack
    if (
      String(userInfo.value?.userId ?? '') === userId &&
      localVideoTrack.value
    ) {
      console.log('variable111 ==>');
      const element = localVideoTrack.value.attach() as HTMLVideoElement;
      element.style.width = '100%';
      element.style.height = '100%';
      element.style.objectFit = 'cover';
      element.autoplay = true;
      element.playsInline = true;
      // 本地预览静音，避免回声
      element.muted = true;
      container.appendChild(element);
      return;
    }

    // 远端摄像头：从 remoteCameraTracks 按 identity 查找
    const remoteTrack = remoteCameraTracks.value.get(`user-${userId}`);
    if (remoteTrack) {
      const element = remoteTrack.attach() as HTMLVideoElement;
      element.style.width = '100%';
      element.style.height = '100%';
      element.style.objectFit = 'cover';
      element.autoplay = true;
      element.playsInline = true;
      container.appendChild(element);
    }
  }

  /** 清空指定参与者的视频容器 */
  function clearCameraTrack(userId: string) {
    const container = cameraVideoRef.value[userId];
    if (container) {
      container.innerHTML = '';
    }
  }

  /** 解析 cameraUserIds 字符串 "123,456" → 数组 ["123", "456"] */
  function parseCameraUserIds(raw: string | null | undefined): string[] {
    if (!raw) return [];
    return raw
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }
  // 当摄像头用户列表或远端视频轨变化时，重新渲染
  watch(
    () => [
      screenCameraState.value?.cameraUserIds,
      remoteCameraTracks.value,
      localVideoTrack.value,
    ],
    async () => {
      await nextTick();
      const activeUserIds = parseCameraUserIds(
        screenCameraState.value?.cameraUserIds
      );
      activeUserIds.forEach((uid) => renderCameraTrack(uid));
    },
    { deep: true }
  );

  /******************************** 被动开启摄像头 ********************************/

  /** WebSocket 推送要求开启摄像头时，自动启动本地摄像头 */
  async function handleCameraStreamStart() {
    const userId = String(userInfo.value?.userId ?? '');
    const isCameraStreamActive = parseCameraUserIds(
      screenCameraState.value?.cameraUserIds
    ).includes(userId);
    if (!isCameraStreamActive) return;

    const meetingId = currentMeetingId.value;
    if (!meetingId) return;

    if (!room.value || !isConnected.value) {
      ElMessage.warning('请先加入语音房间');
      return;
    }

    if (isCameraEnabled.value) return;

    try {
      await startCameraApi(meetingId);
      await toggleLiveKitCamera();
      ElMessage.success('摄像头已开启');
    } catch (error: any) {
      ElMessage.error(error?.message ?? '摄像头操作失败');
    }
  }

  /******************************** 页面生命周期 ********************************/

  function handleCameraPageHide() {
    const meetingId = currentMeetingId.value;
    if (meetingId && isCameraEnabled.value) {
      notifyCameraStop(meetingId);
    }
  }

  onMounted(() => {
    window.addEventListener('pagehide', handleCameraPageHide);
    window.addEventListener('beforeunload', handleCameraPageHide);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('pagehide', handleCameraPageHide);
    window.removeEventListener('beforeunload', handleCameraPageHide);
  });

  return {
    cameraVideoRef,
    isCameraEnabled,
    localVideoTrack,
    isTogglingCamera,
    handleToggleCamera,
    renderCameraTrack,
    clearCameraTrack,
    handleCameraStreamStart,
  };
}
