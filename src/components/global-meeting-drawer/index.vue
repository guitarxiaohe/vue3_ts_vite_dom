<script lang="ts" setup>
/******************************** 依赖导入 ********************************/
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Camera,
  CircleDot,
  Hand,
  LoaderCircle,
  Mic,
  MicOff,
  MonitorUp,
  SendHorizontal,
  Settings2,
  Sparkles,
  Users,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import { ConnectionState } from 'livekit-client';
import MeetingParticipantGrid from '@/components/meeting-participant-grid/index.vue';
import { useMeetingStore, usePresenceStore, useUserStore } from '@/stores';
import { useMeetingRtcStore } from '@/stores/modules/meeting-rtc';
import {
  MEDIADEVICES_OPTIONS,
  useLivekitRoom,
} from '@/composables/use-livekit-room';
import { getRtcTokenApi, startRtcApi } from '@/api/modules/meeting-rtc';
import { startScreenShareApi, stopScreenShareApi } from '@/api/modules/meeting';
import { MEETING_RTC_OWNER_KEY } from '@/utils/meeting-cross-window';
import { buildSpeakerTranscriptLines } from '@/utils/meeting-transcript';
import { AsyncSelect } from '@/components/async-select';
/***************************** Store / Composable 初始化 *****************************/
const route = useRoute();
const { t } = useI18n();
const meetingStore = useMeetingStore();
const userStore = useUserStore();
const presenceStore = usePresenceStore();
const rtcStore = useMeetingRtcStore();

/***************************** LiveKit RTC 解构 *****************************/
const {
  connectionState,
  participants: rtcParticipants,
  activeSpeakers,
  isMicEnabled,
  isSpeakerMuted,
  playbackVolume,
  joinRoom,
  leaveRoom,
  toggleMic,
  setPlaybackVolume,
  toggleSpeakerMute,
  requestPlaybackPermission,
} = useLivekitRoom();

/***************************** 响应式状态 *****************************/
// 当前正在发言的用户 ID，用于触发发言人头像高亮脉冲效果
const activeSpeakerUserId = ref<number | null>(null);
// 新加入会议的用户 ID，用于触发参与者加入时的高亮动画
const joinedHighlightUserId = ref<number | null>(null);
// 上一次水合（初始化）时记录的最新转写 ID，用于判断转写内容是否为增量更新、避免重复触发高亮
const hydratedLastTranscriptId = ref<number | null>(null);
// 实时转写面板的 DOM 元素引用，用于在新转写内容出现时自动滚动到底部
const transcriptPanelRef = ref<HTMLElement | null>(null);
// 当前时间戳（每秒刷新），驱动会议已进行时长的计算显示
const meetingClockNow = ref(Date.now());
// 是否正在加入语音会议（RTC 连接进行中），防止重复点击加入按钮
const isJoining = ref(false);
// 主持人是否正在启动 RTC 服务，防止重复调用 startRtcApi
const isStartingRtc = ref(false);
// 是否正在结束/离开会议，防止重复提交停止会议请求
const isStoppingMeeting = ref(false);
// 是否正在提交邀请参与者请求，控制邀请按钮的 loading 状态
const isInvitingParticipants = ref(false);
// 是否正在发送互动消息（举手/表情/文字），控制发送按钮的 loading 状态
const isSendingInteraction = ref(false);
// 是否正在等待用户授予麦克风权限，显示"等待麦克风权限"提示标签
const waitingMicPermission = ref(false);
// 上一次尝试加入语音的会议 ID，用于避免同一会议重复弹出"等待麦克风权限"提示
const lastJoinAttemptMeetingId = ref<number | null>(null);
// 邀请参与者弹窗是否可见
const inviteDialogVisible = ref(false);
// 邀请弹窗中已选中的待邀请用户 ID 列表
const inviteUserIds = ref<number[]>([]);
// 共享屏幕舞台模式：large（主区域展开）/ minimized（浮动小窗）
const shareStageMode = ref<'large' | 'minimized'>('large');
// 互动文字输入框的当前内容
const interactionText = ref('');
// 互动表情面板中可选的表情列表
const interactionEmojiOptions = ['👍', '👏', '🎉', '🔥', '✅', '❓'];

function toggleShareStageMode() {
  shareStageMode.value =
    shareStageMode.value === 'large' ? 'minimized' : 'large';
}

/***************************** 定时器 / 权限状态 *****************************/
let activeSpeakerTimer: ReturnType<typeof setTimeout> | null = null;
let joinedHighlightTimer: ReturnType<typeof setTimeout> | null = null;
let rtcOwnershipHeartbeatTimer: ReturnType<typeof setInterval> | null = null;
let meetingClockTimer: ReturnType<typeof setInterval> | null = null;
let permissionStatus: PermissionStatus | null = null;
let permissionRetryRegistered = false;
let disconnectOnUnloadSent = false;

/***************************** 计算属性 *****************************/
// 抽屉显隐双向绑定
const drawerVisible = computed({
  get: () => meetingStore.drawerVisible,
  set: (value: boolean) => {
    if (value) {
      meetingStore.openDrawer();
      return;
    }
    meetingStore.closeDrawer();
  },
});

// 会议详情 / 待处理会议 / 转写 / 摘要
const meetingDetail = computed(() => meetingStore.meetingDetail);
const pendingMeetings = computed(() => meetingStore.pendingMeetings);
const liveTranscriptBlocks = computed(() => meetingStore.liveTranscriptBlocks);
const liveSummaryText = computed(() => meetingStore.liveSummaryText);
const liveSummaryStatus = computed(() => meetingStore.liveSummaryStatus);
const liveSummaryUpdatedAt = computed(() => meetingStore.liveSummaryUpdatedAt);
// 摘要内容变化时强制重新渲染（避免 transition 不触发）
const liveSummaryRenderKey = computed(
  () => `${liveSummaryUpdatedAt.value || 'empty'}:${liveSummaryText.value}`
);
const renderedTranscriptLines = computed(() =>
  buildSpeakerTranscriptLines(liveTranscriptBlocks.value)
);
const transcriptScrollEnabled = computed(
  () => liveTranscriptBlocks.value.length > 20
);
const visibleMeetingParticipants = computed(() =>
  (meetingDetail.value?.participants ?? []).filter(
    (participant) => participant.inviteStatus !== 'DECLINED'
  )
);
const participantRtcCount = computed(
  () =>
    visibleMeetingParticipants.value.filter((participant) =>
      isParticipantInRtc(participant.userId)
    ).length
);
const participantDisplayItems = computed(() =>
  visibleMeetingParticipants.value.map((participant) => ({
    id: participant.id,
    userId: participant.userId,
    name: participant.nickName || participant.userName,
    subtitle: participant.userName,
    isHost: participant.isHost === 1,
    statusText: participantMeetingStatusText(participant),
    statusType: participantMeetingStatusType(participant),
    isActive:
      activeSpeakerUserId.value !== null &&
      meetingStore.toNumericId(participant.userId) ===
        activeSpeakerUserId.value,
    isSpeaking: isParticipantSpeaking(participant.userId),
    isJoined:
      joinedHighlightUserId.value !== null &&
      meetingStore.toNumericId(participant.userId) ===
        joinedHighlightUserId.value,
    isWaiting: isParticipantWaiting(participant),
    isAbsent: isParticipantAbsent(participant),
    isInRtc: isParticipantInRtc(participant.userId),
    isMicMuted:
      isParticipantInRtc(participant.userId) &&
      isParticipantMicMuted(participant.userId),
    interactionText:
      meetingStore.interactionBubbles[
        meetingStore.toNumericId(participant.userId)
      ]?.content || '',
    interactionType:
      meetingStore.interactionBubbles[
        meetingStore.toNumericId(participant.userId)
      ]?.interactionType || '',
  }))
);
const meetingElapsedLabel = computed(() => {
  const startedAt = meetingDetail.value?.session.startedAt;
  const startedAtMs = startedAt ? Date.parse(startedAt) : 0;
  if (!startedAtMs) {
    return '00:00';
  }
  const totalSeconds = Math.max(
    0,
    Math.floor((meetingClockNow.value - startedAtMs) / 1000)
  );
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, '0'))
      .join(':');
  }
  return [minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
});
const networkStatusText = computed(() => {
  if (isReconnecting.value) {
    return '重连中';
  }
  if (isConnected.value) {
    return '网络良好';
  }
  if (isRtcRunning.value) {
    return '待接入';
  }
  return '未连接';
});
const networkStatusTone = computed(() => {
  if (isReconnecting.value) {
    return 'warning';
  }
  if (isConnected.value) {
    return 'success';
  }
  if (isRtcRunning.value) {
    return 'info';
  }
  return 'danger';
});
// 最新一条转写记录
const latestTranscript = computed(() => {
  const transcripts = meetingDetail.value?.transcripts ?? [];
  return transcripts[transcripts.length - 1] ?? null;
});
const currentUser = computed(() => userStore.userInfo);
// 会议 / RTC 状态
const isMeetingEnded = computed(() =>
  meetingStore.isTerminalStatus(meetingDetail.value?.session.status)
);
const isRtcRunning = computed(
  () => meetingDetail.value?.session.rtcStatus === 'RUNNING'
);
const isConnected = computed(
  () => connectionState.value === ConnectionState.Connected
);
const isReconnecting = computed(
  () => connectionState.value === ConnectionState.Reconnecting
);
const screenShareState = computed(() => meetingStore.screenShareState);
const isSomeoneSharing = computed(
  () => screenShareState.value?.shareActive === true
);
const isCurrentUserSharing = computed(() => {
  if (!screenShareState.value?.shareActive) return false;
  const currentUserId = meetingDetail.value?.currentUserId;
  return (
    currentUserId != null &&
    screenShareState.value.sharerUserId === currentUserId
  );
});
const shareScreenDisabled = computed(() => {
  if (!meetingStore.isActiveStatus(meetingDetail.value?.session.status))
    return true;
  if (isSomeoneSharing.value && !isCurrentUserSharing.value) return true;
  return false;
});
const shareScreenLabel = computed(() => {
  if (isCurrentUserSharing.value) return '停止共享';
  return '共享屏幕';
});

watch(
  () => isSomeoneSharing.value,
  (sharing) => {
    if (!sharing) shareStageMode.value = 'large';
  }
);

const currentMeetingId = computed(
  () => meetingDetail.value?.session.id ?? null
);
// 扬声器音量百分比（双向绑定）
const speakerVolumePercent = computed({
  get: () => Math.round(playbackVolume.value * 100),
  set: (value: number) => {
    setPlaybackVolume(value / 100);
  },
});
// 当前用户是否可加入 RTC（已接受邀请 且 会议进行中）
const canCurrentUserJoinRtc = computed(() => {
  if (!meetingDetail.value || !currentUser.value) {
    return false;
  }
  if (meetingDetail.value.session.status !== 'ACTIVE') {
    return false;
  }
  if (meetingDetail.value.session.rtcStatus !== 'RUNNING') {
    return false;
  }
  const currentUserId = meetingStore.toNumericId(currentUser.value.userId);
  return meetingDetail.value.participants.some(
    (item) =>
      meetingStore.toNumericId(item.userId) === currentUserId &&
      item.inviteStatus === 'ACCEPTED'
  );
});
// 跨 Tab RTC 归属判断
const isCurrentTabRtcOwner = computed(() =>
  meetingStore.isCurrentTabRtcOwner(currentMeetingId.value)
);
const isRtcOwnedByOtherTab = computed(() =>
  meetingStore.isRtcOwnedByOtherTab(currentMeetingId.value)
);
// 是否显示"加入语音"按钮
const showJoinRtcButton = computed(
  () => canCurrentUserJoinRtc.value && !isConnected.value
);

// 主持人权限 / 邀请相关
const canStopMeeting = computed(
  () =>
    meetingDetail.value?.session.status === 'ACTIVE' &&
    (meetingStore.toNumericId(meetingDetail.value?.session.hostUserId) ===
      meetingStore.toNumericId(currentUser.value?.userId) ||
      meetingDetail.value?.participants.some(
        (item) =>
          meetingStore.toNumericId(item.userId) ===
            meetingStore.toNumericId(currentUser.value?.userId) &&
          item.isHost === 1
      ))
);
const canInviteParticipants = computed(
  () => isHost.value && meetingDetail.value?.session.status === 'ACTIVE'
);
const inviteSelectableUsers = computed(() => {
  if (!meetingDetail.value) {
    return [];
  }

  const blockedUserIds = new Set(
    meetingDetail.value.participants
      .filter(
        (item) =>
          item.inviteStatus === 'ACCEPTED' || item.inviteStatus === 'PENDING'
      )
      .map((item) => meetingStore.toNumericId(item.userId))
  );
  blockedUserIds.add(meetingStore.toNumericId(currentUser.value?.userId));

  return meetingStore.selectableUsers.filter(
    (item) => !blockedUserIds.has(meetingStore.toNumericId(item.userId))
  );
});

const isHost = computed(() => {
  if (!meetingDetail.value || !currentUser.value) return false;
  return (
    meetingStore.toNumericId(meetingDetail.value.session.hostUserId) ===
    meetingStore.toNumericId(currentUser.value.userId)
  );
});

/***************************** 高亮脉冲效果 *****************************/

/**
 * 触发发言人高亮脉冲效果
 * @param userId - 需要高亮的用户 ID，传 null 可提前清除高亮
 * @param duration - 高亮持续时间（毫秒），默认 3200ms
 */
function pulseSpeaker(userId: number | null, duration = 3200) {
  if (activeSpeakerTimer) {
    clearTimeout(activeSpeakerTimer);
    activeSpeakerTimer = null;
  }
  activeSpeakerUserId.value = userId;
  if (userId === null) {
    return;
  }
  activeSpeakerTimer = setTimeout(() => {
    activeSpeakerUserId.value = null;
  }, duration);
}

/**
 * 触发新参与者加入的高亮脉冲效果
 * @param userId - 需要高亮的用户 ID，传 null 可提前清除高亮
 * @param duration - 高亮持续时间（毫秒），默认 3600ms
 */
function pulseJoinedParticipant(userId: number | null, duration = 3600) {
  if (joinedHighlightTimer) {
    clearTimeout(joinedHighlightTimer);
    joinedHighlightTimer = null;
  }
  joinedHighlightUserId.value = userId;
  if (userId === null) {
    return;
  }
  joinedHighlightTimer = setTimeout(() => {
    joinedHighlightUserId.value = null;
  }, duration);
}

/***************************** 参与者状态判断 *****************************/

/**
 * 判断参与者是否已连接（邀请已接受 且 在线状态为在线）
 * @param participant - 参与者对象，包含 inviteStatus 和 userId
 * @returns 是否已连接
 */
function isParticipantConnected(participant: {
  inviteStatus: string;
  userId: number;
}) {
  return (
    participant.inviteStatus === 'ACCEPTED' &&
    presenceStore.isUserOnline(participant.userId)
  );
}

/**
 * 获取参与者会议状态的标签类型
 * 未接受邀请显示 warning，已连接显示 success，否则显示 info
 * @param participant - 参与者对象
 * @returns Element Plus 标签类型
 */
function participantMeetingStatusType(participant: {
  inviteStatus: string;
  userId: number;
}) {
  if (participant.inviteStatus === 'DECLINED') {
    return 'danger';
  }
  if (participant.inviteStatus !== 'ACCEPTED') {
    return 'warning';
  }
  return isParticipantConnected(participant) ? 'success' : 'info';
}

/**
 * 获取参与者会议状态的显示文本
 * @param participant - 参与者对象
 * @returns 状态描述文本
 */
function participantMeetingStatusText(participant: {
  inviteStatus: string;
  userId: number;
}) {
  if (participant.inviteStatus === 'DECLINED') {
    return t('meeting.participantDeclined');
  }
  if (participant.inviteStatus !== 'ACCEPTED') {
    return t('meeting.participantPending');
  }
  return isParticipantConnected(participant)
    ? t('meeting.participantConnected')
    : t('meeting.participantConnecting');
}

/**
 * 判断参与者是否处于等待状态
 * 会议已结束时无人等待；未连接的参与者视为等待中
 * @param participant - 参与者对象
 * @returns 是否处于等待状态
 */
function isParticipantWaiting(participant: {
  inviteStatus: string;
  userId: number;
}) {
  if (isMeetingEnded.value) {
    return false;
  }
  if (participant.inviteStatus === 'DECLINED') {
    return false;
  }
  return !isParticipantConnected(participant);
}

/**
 * 判断参与者是否缺席（会议已结束 且 邀请未接受）
 * @param participant - 参与者对象
 * @returns 是否缺席
 */
function isParticipantAbsent(participant: { inviteStatus: string }) {
  return (
    isMeetingEnded.value &&
    participant.inviteStatus !== 'ACCEPTED' &&
    participant.inviteStatus !== 'DECLINED'
  );
}

/***************************** RTC 参与者状态查询 *****************************/

/**
 * 获取参与者的 RTC 实时状态信息
 * 通过 user-{userId} 格式的 identity 在 LiveKit 参与者列表中查找
 * @param userId - 用户 ID
 * @returns 匹配的 LiveKit Participant 对象，未找到时返回 undefined
 */
function getParticipantRtcInfo(userId: number) {
  const identity = `user-${userId}`;
  return rtcParticipants.value.find((p) => p.identity === identity);
}

/**
 * 判断参与者是否在 RTC 房间中
 * @param userId - 用户 ID
 * @returns 是否在 RTC 房间中
 */
function isParticipantInRtc(userId: number) {
  return !!getParticipantRtcInfo(userId);
}

/**
 * 判断参与者是否正在发言
 * @param userId - 用户 ID
 * @returns 是否正在发言
 */
function isParticipantSpeaking(userId: number) {
  const info = getParticipantRtcInfo(userId);
  return info?.isSpeaking || false;
}

/**
 * 判断参与者的麦克风是否已静音
 * @param userId - 用户 ID
 * @returns 麦克风是否已静音，未找到参与者时默认返回 true
 */
function isParticipantMicMuted(userId: number) {
  const info = getParticipantRtcInfo(userId);
  return info?.isMuted ?? true;
}

/***************************** 会议生命周期 *****************************/

/**
 * 初始化会议抽屉
 * 按优先级依次尝试：URL 参数指定的会议 > 当前进行中的会议 > 自动打开的会议
 * 加载待处理会议列表，并根据条件自动打开抽屉
 */
async function bootstrapMeetingDrawer() {
  await meetingStore.loadPendingMeetings();

  const queryMeetingId = meetingStore.toMeetingId(route.query.meetingId);
  if (queryMeetingId > 0) {
    await openPendingMeeting(queryMeetingId);
    return;
  }

  const currentMeeting = await meetingStore.loadCurrentMeeting();
  const activeMeetingId = currentMeeting?.session?.id ?? null;

  if (
    activeMeetingId &&
    meetingStore.shouldResumeCapture &&
    !meetingStore.isRtcOwnedByOtherTab(activeMeetingId)
  ) {
    meetingStore.claimRtcOwnership(activeMeetingId);
  }

  if (currentMeeting?.session.status === 'ACTIVE') {
    if (meetingStore.shouldAutoOpenDrawer) {
      meetingStore.openDrawer();
    }
    return;
  }

  meetingStore.setShouldAutoOpenDrawer(false);
}

/**
 * 打开指定的待处理会议
 * @param meetingId - 要打开的会议 ID
 */
async function openPendingMeeting(meetingId: number) {
  await meetingStore.enterMeeting(meetingId);
  meetingStore.openDrawer();
}

/***************************** 语音 RTC 连接 *****************************/

/**
 * 加入语音会议
 * 获取 RTC Token 后加入 LiveKit 房间；遇到麦克风权限错误时注册重试机制
 * @param silent - 是否静默模式，为 true 时不弹出错误提示（用于自动重试场景）
 */
async function handleJoinVoice(silent = false) {
  if (!shouldAutoJoinCurrentMeeting() || isJoining.value) {
    return;
  }

  const currentMeetingId = meetingDetail.value?.session.id ?? null;
  isJoining.value = true;
  waitingMicPermission.value = false;
  try {
    const { data } = await getRtcTokenApi(currentMeetingId as number);
    if (!data) {
      if (!silent) {
        ElMessage.error(t('meeting.autoJoinFailed'));
      }
      return;
    }
    rtcStore.setTokenInfo(data);
    await joinRoom(data);
    lastJoinAttemptMeetingId.value = currentMeetingId;
    waitingMicPermission.value = false;
  } catch (error: any) {
    if (isMicrophonePermissionError(error)) {
      waitingMicPermission.value = true;
      registerPermissionRetry();
      if (lastJoinAttemptMeetingId.value !== currentMeetingId) {
        ElMessage.warning(t('meeting.waitingMicPermission'));
      }
      lastJoinAttemptMeetingId.value = currentMeetingId;
      return;
    }
    if (isMicrophoneUnsupportedError(error)) {
      ElMessage.error(t('meeting.browserUnsupported'));
      return;
    }
    if (!silent) {
      ElMessage.error(error?.message || t('meeting.autoJoinFailed'));
    }
  } finally {
    isJoining.value = false;
  }
}

// 接管其他 Tab 的 RTC 连接并加入语音
async function handleTakeOverRtc() {
  const meetingId = currentMeetingId.value;
  if (!meetingId || isJoining.value) {
    return;
  }
  meetingStore.claimRtcOwnership(meetingId);
  await handleJoinVoice();
}

/***************************** 邀请参与者 *****************************/

// 打开邀请参与者弹窗，加载可选用户列表
async function openInviteParticipantsDialog() {
  if (!canInviteParticipants.value) {
    return;
  }
  inviteUserIds.value = [];
  await meetingStore.loadSelectableUsers();
  inviteDialogVisible.value = true;
}

// 提交邀请选中的用户
async function handleInviteParticipants() {
  if (inviteUserIds.value.length === 0 || isInvitingParticipants.value) {
    return;
  }
  isInvitingParticipants.value = true;
  const invitedCount = inviteUserIds.value.length;
  try {
    await meetingStore.inviteParticipants(inviteUserIds.value);
    inviteDialogVisible.value = false;
    inviteUserIds.value = [];
    ElMessage.success(
      t('meeting.inviteMoreSuccess', {
        count: invitedCount,
      })
    );
  } catch (error: any) {
    ElMessage.error(error?.message || t('meeting.inviteMoreFailed'));
  } finally {
    isInvitingParticipants.value = false;
  }
}

/***************************** RTC 服务启停 *****************************/

/**
 * 主持人自动拉起 RTC 服务
 * 当当前用户是主持人、会议为 ACTIVE 状态、RTC 尚未运行时，自动调用 API 启动 RTC
 */
async function ensureHostRtcStarted() {
  if (
    !meetingDetail.value ||
    !isHost.value ||
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
    ElMessage.error(error?.message || t('meeting.rtcStartFailed'));
  } finally {
    isStartingRtc.value = false;
  }
}

/**
 * 结束或离开会议
 * 主持人调用时结束整个会议，普通成员调用时仅离开当前会议并断开 RTC 连接
 */
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

// 页面关闭/卸载时断开会议连接（keepalive fetch）
function disconnectMeetingOnPageUnload() {
  if (disconnectOnUnloadSent) {
    return;
  }
  const currentMeeting = meetingDetail.value;
  if (!currentMeeting || currentMeeting.session.status !== 'ACTIVE') {
    return;
  }
  const token = localStorage.getItem('token');
  if (!token) {
    return;
  }
  disconnectOnUnloadSent = true;
  const baseApi = String(import.meta.env.VITE_APP_BASE_API || '/dev-api');
  const url = `${baseApi}/cms/meeting/session/${currentMeeting.session.id}/disconnect`;
  const locale = localStorage.getItem('app_locale') || 'zh-CN';

  try {
    fetch(url, {
      method: 'POST',
      keepalive: true,
      headers: {
        Authorization: `Bearer ${token}`,
        'Accept-Language': locale,
      },
    });
  } catch (_error) {
    // 页面关闭阶段不做额外兜底
  }

  meetingStore.releaseRtcOwnership(currentMeeting.session.id);
  rtcStore.reset();
  meetingStore.clearMeetingRuntime();
  void leaveRoom();
}

// 拒绝待处理的会议邀请
async function declinePendingMeeting(meetingId: number) {
  try {
    await meetingStore.declineMeeting(meetingId);
    ElMessage.success(t('meeting.declineSuccess'));
  } catch (error: any) {
    ElMessage.error(error?.message || t('meeting.declineFailed'));
  }
}

/***************************** 抽屉关闭处理 *****************************/

/**
 * 处理抽屉关闭尝试
 * 会议进行中时弹出确认框，让用户选择结束会议或转为后台运行
 * @param done - 关闭完成回调，由 el-drawer 的 before-close 提供
 */
function handleDrawerAttemptClose(done?: () => void) {
  if (!meetingDetail.value || meetingDetail.value.session.status !== 'ACTIVE') {
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

/**
 * 判断当前用户是否应自动加入语音会议
 * 条件：会议存在、用户已登录、会议状态为 ACTIVE、RTC 已运行、当前用户是已接受邀请的参与者
 * @returns 是否应自动加入
 */
function shouldAutoJoinCurrentMeeting() {
  return canCurrentUserJoinRtc.value && isCurrentTabRtcOwner.value;
}

/***************************** 麦克风权限重试 *****************************/

/**
 * 判断错误是否为麦克风权限相关错误
 * 通过 error.name 或 error.message 匹配权限拒绝的特征
 * @param error - 捕获的异常对象
 * @returns 是否为麦克风权限错误
 */
function isMicrophonePermissionError(error: unknown) {
  const nextError = error as { name?: string; message?: string };
  return (
    nextError?.name === 'NotAllowedError' ||
    nextError?.name === 'PermissionDeniedError' ||
    /permission|denied|notallowed|麦克风|microphone/i.test(
      nextError?.message || ''
    )
  );
}

/**
 * 判断错误是否为浏览器不支持麦克风相关错误
 * 通过 error.name 或 error.message 匹配设备不可用的特征
 * @param error - 捕获的异常对象
 * @returns 是否为麦克风不支持错误
 */
function isMicrophoneUnsupportedError(error: unknown) {
  const nextError = error as { name?: string; message?: string };
  return (
    nextError?.name === 'NotFoundError' ||
    nextError?.name === 'NotSupportedError' ||
    /not supported|no audio input|device/i.test(nextError?.message || '')
  );
}

/**
 * 麦克风权限授予后重试加入语音会议
 * 仅在等待权限且页面可见时触发，避免后台静默重连
 */
async function retryJoinAfterPermission() {
  if (!waitingMicPermission.value || document.visibilityState !== 'visible') {
    return;
  }
  await handleJoinVoice(true);
}

/**
 * 绑定麦克风权限状态监听器
 * 使用 Permissions API 监听 microphone 权限变化，权限变为 granted 时自动重试加入
 * 不支持 Permissions API 时静默跳过
 */
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
  }
}

/**
 * 注册权限重试机制
 * 绑定 Permissions API 监听，并注册窗口 focus 和页面 visibilitychange 事件
 * 确保用户从系统权限弹窗切回后能自动重试加入
 */
function registerPermissionRetry() {
  void bindPermissionStatusListener();
  if (permissionRetryRegistered) {
    return;
  }
  permissionRetryRegistered = true;
  window.addEventListener('focus', handleWindowFocusRetry);
  document.addEventListener('visibilitychange', handleVisibilityRetry);
}

/**
 * 清除权限等待状态
 * 重置麦克风权限等待标记和上次加入尝试的会议 ID
 */
function clearPermissionRetry() {
  waitingMicPermission.value = false;
  lastJoinAttemptMeetingId.value = null;
}

/**
 * 窗口获得焦点时的权限重试回调
 * 用户可能在系统权限弹窗中操作后切回窗口
 */
function handleWindowFocusRetry() {
  void retryJoinAfterPermission();
}

/**
 * 页面可见性变化时的权限重试回调
 * 当页面从隐藏变为可见时尝试重新加入语音会议
 */
function handleVisibilityRetry() {
  if (document.visibilityState === 'visible') {
    void retryJoinAfterPermission();
  }
}

/***************************** 页面生命周期事件处理 *****************************/

// 页面隐藏时断开连接
function handlePageHide() {
  disconnectMeetingOnPageUnload();
}

// 页面卸载前断开连接
function handleBeforeUnload() {
  disconnectMeetingOnPageUnload();
}

// 从 localStorage 同步 RTC 归属状态
function syncRtcOwnership() {
  meetingStore.syncRtcOwnershipFromStorage();
}

/***************************** RTC 跨 Tab 归属心跳 *****************************/

// 监听 localStorage 变化，同步 RTC 归属
function handleRtcOwnershipStorageChange(event: StorageEvent) {
  if (event.storageArea !== localStorage) {
    return;
  }
  if (event.key && event.key !== MEETING_RTC_OWNER_KEY) {
    return;
  }
  syncRtcOwnership();
}

// 停止 RTC 归属心跳定时器
function stopRtcOwnershipHeartbeat() {
  if (!rtcOwnershipHeartbeatTimer) {
    return;
  }
  clearInterval(rtcOwnershipHeartbeatTimer);
  rtcOwnershipHeartbeatTimer = null;
}

// 启动 RTC 归属心跳（每 5s 续期）
function startRtcOwnershipHeartbeat() {
  stopRtcOwnershipHeartbeat();
  if (!isCurrentTabRtcOwner.value || !currentMeetingId.value) {
    return;
  }
  rtcOwnershipHeartbeatTimer = setInterval(() => {
    if (!currentMeetingId.value) {
      return;
    }
    meetingStore.claimRtcOwnership(currentMeetingId.value);
  }, 5000);
}

function handleUnavailableFeature(label: string) {
  ElMessage.info(`${label}能力正在接入中`);
}

async function handleSharedScreen() {
  const meetingId = currentMeetingId.value;
  if (!meetingId) return;
  if (shareScreenDisabled.value && !isCurrentUserSharing.value) {
    if (isSomeoneSharing.value) {
      ElMessage.info('当前已有其他参会者正在共享屏幕');
    }
    return;
  }
  try {
    if (isCurrentUserSharing.value) {
      await stopScreenShareApi(meetingId);
      ElMessage.success('已停止共享屏幕');
      return;
    }
    await startScreenShareApi(meetingId);
    const mediaStream =
      await navigator.mediaDevices.getDisplayMedia(MEDIADEVICES_OPTIONS);
    mediaStream.getVideoTracks()[0];
    ElMessage.success('已开始共享屏幕');
  } catch (error: any) {
    ElMessage.error(error?.message || '屏幕共享操作失败');
  }
}

async function handleSendInteraction(
  interactionType: 'HAND' | 'EMOJI' | 'TEXT',
  content: string
) {
  if (!meetingDetail.value || !content.trim()) {
    return;
  }
  isSendingInteraction.value = true;
  try {
    await meetingStore.sendInteraction({
      interactionType,
      content: content.trim(),
    });
    if (interactionType === 'HAND') {
      ElMessage.success(t('meeting.interactionHandSent'));
      return;
    }
    if (interactionType === 'EMOJI') {
      ElMessage.success(t('meeting.interactionEmojiSent'));
      return;
    }
    ElMessage.success(t('meeting.interactionTextSent'));
  } catch (error: any) {
    ElMessage.error(error?.message || t('meeting.interactionSendFailed'));
  } finally {
    isSendingInteraction.value = false;
  }
}

function handleRaiseHand() {
  void handleSendInteraction('HAND', t('meeting.interactionHandBubble'));
}

function handleSendEmoji(emoji: string) {
  void handleSendInteraction('EMOJI', emoji);
}

function handleSendTextInteraction() {
  const content = interactionText.value.trim();
  if (!content) {
    return;
  }
  interactionText.value = '';
  void handleSendInteraction('TEXT', content);
}

function scrollTranscriptPanelToBottom() {
  if (!transcriptScrollEnabled.value || !transcriptPanelRef.value) {
    return;
  }
  transcriptPanelRef.value.scrollTop = transcriptPanelRef.value.scrollHeight;
}

/***************************** Watch 监听器 *****************************/

// 监听转写更新，高亮发言人
watch(
  () => latestTranscript.value?.id,
  (latestId) => {
    if (!meetingDetail.value) {
      return;
    }
    if (hydratedLastTranscriptId.value === null) {
      hydratedLastTranscriptId.value = latestId ?? null;
      return;
    }
    if (!latestId || latestId === hydratedLastTranscriptId.value) {
      return;
    }
    hydratedLastTranscriptId.value = latestId;
    pulseSpeaker(meetingStore.toNumericId(latestTranscript.value?.userId));
  }
);

watch(
  () =>
    liveTranscriptBlocks.value
      .map((item) => `${item.id}:${item.text}`)
      .join('|'),
  async () => {
    await nextTick();
    scrollTranscriptPanelToBottom();
  }
);

// 切换会议时重置转写水位线
watch(
  () => meetingDetail.value?.session.id,
  () => {
    hydratedLastTranscriptId.value = latestTranscript.value?.id ?? null;
  },
  { immediate: true }
);

// 会议状态变化：结束时清理 RTC 连接
watch(
  () => meetingDetail.value?.session.status,
  async (status, previousStatus) => {
    if (status !== 'ACTIVE') {
      clearPermissionRetry();
    }
    if (previousStatus !== 'ACTIVE' || !meetingStore.isTerminalStatus(status)) {
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
    currentUser.value?.userId,
  ],
  async () => {
    if (!meetingDetail.value || !isHost.value || isStoppingMeeting.value) {
      return;
    }
    if (meetingDetail.value.session.status !== 'ACTIVE') {
      return;
    }
    if (meetingDetail.value.session.rtcStatus === 'RUNNING') {
      return;
    }
    await ensureHostRtcStarted();
  },
  { immediate: true }
);

// 参与者或 RTC 状态变化时自动加入语音
watch(
  () => [
    meetingDetail.value?.session.id,
    meetingDetail.value?.session.status,
    meetingDetail.value?.session.rtcStatus,
    meetingDetail.value?.participants
      ?.map((item) => `${item.userId}:${item.inviteStatus}`)
      .join('|'),
    currentUser.value?.userId,
  ],
  async () => {
    if (!shouldAutoJoinCurrentMeeting() || isConnected.value) {
      return;
    }
    await handleJoinVoice(true);
  },
  { immediate: true }
);

// RTC 归属变化时管理心跳和连接
watch(
  () => [currentMeetingId.value, isCurrentTabRtcOwner.value, isConnected.value],
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

// URL 参数变化时打开对应会议
watch(
  () => route.query.meetingId,
  async (value, oldValue) => {
    if (value === oldValue) {
      return;
    }
    const meetingId = meetingStore.toMeetingId(value);
    if (meetingId > 0) {
      await openPendingMeeting(meetingId);
    }
  }
);

// 新参与者加入时显示提示并高亮
watch(
  () => meetingStore.lastJoinedUserId,
  (userId) => {
    if (!userId || !meetingDetail.value) {
      return;
    }
    const participant = meetingDetail.value.participants.find(
      (item) => meetingStore.toNumericId(item.userId) === userId
    );
    pulseJoinedParticipant(userId);
    ElMessage.success(
      t('meeting.participantJoinedNow', {
        name: participant?.nickName || participant?.userName || '',
      })
    );
    meetingStore.clearLastJoinedUserId();
  }
);

/***************************** 同步 RTC 状态到 Store *****************************/
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

/***************************** 生命周期钩子 *****************************/

onMounted(async () => {
  requestPlaybackPermission();
  syncRtcOwnership();
  meetingClockTimer = setInterval(() => {
    meetingClockNow.value = Date.now();
  }, 1000);
  window.addEventListener('storage', handleRtcOwnershipStorageChange);
  window.addEventListener('pagehide', handlePageHide);
  window.addEventListener('beforeunload', handleBeforeUnload);
  await bootstrapMeetingDrawer();
});

onBeforeUnmount(() => {
  if (activeSpeakerTimer) {
    clearTimeout(activeSpeakerTimer);
  }
  if (joinedHighlightTimer) {
    clearTimeout(joinedHighlightTimer);
  }
  if (meetingClockTimer) {
    clearInterval(meetingClockTimer);
    meetingClockTimer = null;
  }
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
</script>

<template>
  <el-drawer
    v-model="drawerVisible"
    append-to-body
    :destroy-on-close="false"
    :before-close="handleDrawerAttemptClose"
    :close-on-click-modal="true"
    :modal-class="'meeting-drawer-modal'"
    :size="'100%'"
    :title="t('meeting.drawerTitle')"
    custom-class="meeting-drawer"
  >
    <div class="meeting-drawer__body">
      <!-------------------------- 顶部状态栏 -------------------------->
      <section class="meeting-shell-bar">
        <div class="meeting-shell-bar__status">
          <strong class="meeting-shell-bar__title">
            {{ meetingDetail?.session.title || t('meeting.drawerTitle') }}
          </strong>
          <span class="meeting-shell-bar__timer">{{
            meetingElapsedLabel
          }}</span>
          <el-tag
            size="small"
            :type="networkStatusTone"
            class="meeting-shell-bar__network"
          >
            <el-icon class="is-loading" v-if="isReconnecting">
              <LoaderCircle />
            </el-icon>
            <el-icon v-else-if="isConnected"><Wifi /></el-icon>
            <el-icon v-else><WifiOff /></el-icon>
            {{ networkStatusText }}
          </el-tag>
          <span v-if="meetingDetail" class="meeting-shell-bar__id">
            ID {{ meetingDetail.session.id }}
          </span>
        </div>

        <div class="meeting-shell-bar__meta" v-if="meetingDetail">
          <el-tag
            size="small"
            :type="
              meetingStore.isActiveStatus(meetingDetail.session.status)
                ? 'success'
                : meetingStore.isTerminalStatus(meetingDetail.session.status)
                  ? 'info'
                  : 'warning'
            "
          >
            {{
              meetingStore.isActiveStatus(meetingDetail.session.status)
                ? t('meeting.statusActive')
                : meetingDetail.session.status === 'CLOSING'
                  ? '关闭中'
                  : t('meeting.statusEnded')
            }}
          </el-tag>
          <el-tag v-if="waitingMicPermission" size="small" type="warning">
            {{ t('meeting.waitingMicPermission') }}
          </el-tag>
          <el-tag
            v-if="
              meetingDetail.session.status === 'ACTIVE' && isRtcOwnedByOtherTab
            "
            size="small"
            type="info"
          >
            {{ t('meeting.audioInOtherWindow') }}
          </el-tag>
        </div>
      </section>

      <!-------------------------- 会议已结束提示 -------------------------->
      <section v-if="isMeetingEnded" class="meeting-ended-banner">
        <strong>{{ t('meeting.endedBannerTitle') }}</strong>
        <p>{{ t('meeting.endedBannerDescription') }}</p>
      </section>

      <!-------------------------- 共享屏幕舞台 -------------------------->
      <section
        v-if="isSomeoneSharing"
        :class="[
          'meeting-share-stage',
          shareStageMode === 'minimized'
            ? 'meeting-share-stage--minimized'
            : '',
        ]"
      >
        <div class="meeting-share-stage__header">
          <span>
            {{ screenShareState?.sharerIdentity || '参会人' }} 正在共享屏幕
          </span>
          <el-button size="small" text @click="toggleShareStageMode">
            {{ shareStageMode === 'large' ? '最小化' : '展开' }}
          </el-button>
        </div>
        <div class="meeting-share-stage__content">
          <p v-if="shareStageMode === 'large'">共享屏幕内容将在此处展示</p>
        </div>
      </section>

      <!-------------------------- 主体内容区域 -------------------------->
      <div class="meeting-grid">
        <!-------------------------- 侧边栏：待处理会议 / 参与者列表 -------------------------->
        <aside class="meeting-side">
          <article
            v-if="pendingMeetings.length && !meetingDetail"
            class="meeting-card"
          >
            <div class="meeting-card__header">
              <h2>{{ t('meeting.pendingListTitle') }}</h2>
              <el-badge :value="pendingMeetings.length" />
            </div>

            <div class="meeting-pending-list">
              <div
                v-for="item in pendingMeetings"
                :key="item.meetingId"
                class="meeting-pending-item"
              >
                <strong>{{ item.title }}</strong>
                <span>
                  {{
                    t('meeting.pendingInvitedBy', {
                      name: item.hostNickName || item.hostUserName,
                    })
                  }}
                </span>
                <small>{{ item.inviteSentAt }}</small>
                <div class="meeting-pending-item__actions">
                  <el-button
                    size="small"
                    type="primary"
                    @click="openPendingMeeting(item.meetingId)"
                  >
                    {{ t('meeting.pendingAccept') }}
                  </el-button>
                  <el-button
                    size="small"
                    plain
                    @click="declinePendingMeeting(item.meetingId)"
                  >
                    {{ t('meeting.pendingDecline') }}
                  </el-button>
                </div>
              </div>
            </div>
          </article>

          <article class="meeting-card" v-if="meetingDetail">
            <div class="meeting-card__header">
              <h2>
                <el-icon><Users /></el-icon>
                {{ t('meeting.participantsTitle') }}
              </h2>
              <div class="meeting-card__header-actions">
                <span>
                  {{
                    t('meeting.participantCount', {
                      count: visibleMeetingParticipants.length,
                    })
                  }}
                  <template v-if="participantRtcCount">
                    · RTC: {{ participantRtcCount }}
                  </template>
                </span>
                <el-button
                  v-if="canInviteParticipants"
                  type="primary"
                  link
                  size="small"
                  @click="openInviteParticipantsDialog"
                >
                  {{ t('meeting.inviteMoreAction') }}
                </el-button>
              </div>
            </div>

            <MeetingParticipantGrid
              :items="participantDisplayItems"
              :host-label="t('meeting.roleHost')"
            />
          </article>

          <article
            v-if="!meetingDetail && !pendingMeetings.length"
            class="meeting-card meeting-card--empty"
          >
            <el-empty
              :description="t('meeting.noMeetingDescription')"
              :image-size="108"
            >
              <template #description>
                <div class="meeting-empty">
                  <strong>{{ t('meeting.noMeetingTitle') }}</strong>
                  <p>{{ t('meeting.noMeetingDescription') }}</p>
                </div>
              </template>
            </el-empty>
          </article>
        </aside>

        <!-------------------------- 主内容区：实时转写 / AI 摘要 -------------------------->
        <main class="meeting-main">
          <article class="meeting-card" v-if="meetingDetail">
            <div
              ref="transcriptPanelRef"
              :class="[
                'meeting-live-feed',
                transcriptScrollEnabled ? 'meeting-live-feed--scrollable' : '',
              ]"
            >
              <div class="meeting-live-feed__meta">
                <strong>AI 实时字幕及转写</strong>
              </div>

              <div
                v-for="item in renderedTranscriptLines"
                :key="item.id"
                :class="[
                  'meeting-live-line',
                  item.pending ? 'meeting-live-block--pending' : '',
                ]"
              >
                <p class="meeting-live-line__text">
                  <strong class="meeting-live-line__label">
                    {{ item.displayLabel }}说：
                  </strong>
                  {{ item.text }}
                  <small
                    v-if="item.pending"
                    class="meeting-transcript-pending-label meeting-live-line__pending"
                  >
                    <el-icon class="is-loading" :size="12">
                      <LoaderCircle />
                    </el-icon>
                    {{ t('meeting.liveDigestPolishing') }}
                  </small>
                  <span v-if="item.pending" class="typing-cursor" />
                </p>
              </div>

              <el-empty
                v-if="!liveTranscriptBlocks.length"
                :description="t('meeting.rawTranscriptEmpty')"
              />
            </div>
          </article>

          <article class="meeting-card" v-if="meetingDetail">
            <div
              :class="[
                'meeting-live-summary',
                liveSummaryStatus === 'streaming'
                  ? 'meeting-live-summary--streaming'
                  : '',
              ]"
            >
              <div class="meeting-live-summary__meta">
                <strong>{{ t('meeting.aiSummaryTitle') }}</strong>
                <small
                  v-if="liveSummaryStatus === 'streaming'"
                  class="meeting-transcript-pending-label"
                >
                  <el-icon class="is-loading" :size="12">
                    <LoaderCircle />
                  </el-icon>
                  {{ t('meeting.aiSummaryPolishing') }}
                </small>
              </div>

              <transition name="meeting-summary-fade" mode="out-in">
                <p
                  v-if="liveSummaryText"
                  :key="liveSummaryRenderKey"
                  class="meeting-live-summary__text"
                >
                  {{ liveSummaryText }}
                  <span
                    v-if="liveSummaryStatus === 'streaming'"
                    class="typing-cursor"
                  />
                </p>
                <el-empty
                  v-else
                  key="empty"
                  :description="t('meeting.aiSummaryEmpty')"
                />
              </transition>
            </div>
          </article>
        </main>
      </div>

      <section
        v-if="
          meetingDetail &&
          meetingStore.isActiveStatus(meetingDetail.session.status)
        "
        class="meeting-control-dock"
      >
        <el-button
          v-if="showJoinRtcButton"
          type="primary"
          @click="handleTakeOverRtc"
        >
          {{
            isRtcOwnedByOtherTab
              ? t('meeting.takeOverAudio')
              : t('meeting.joinMeeting')
          }}
        </el-button>

        <el-tooltip
          v-if="isConnected"
          :content="isMicEnabled ? t('meeting.micOn') : t('meeting.micOff')"
          placement="top"
        >
          <el-button
            :type="isMicEnabled ? 'primary' : 'info'"
            circle
            :aria-label="
              isMicEnabled ? t('meeting.micOn') : t('meeting.micOff')
            "
            @click="toggleMic"
          >
            <Mic v-if="isMicEnabled" :size="16" />
            <MicOff v-else :size="16" />
          </el-button>
        </el-tooltip>

        <el-tooltip
          v-if="isConnected"
          :content="
            isSpeakerMuted
              ? t('meeting.unmuteSpeaker')
              : t('meeting.muteSpeaker')
          "
          placement="top"
        >
          <el-button
            :type="isSpeakerMuted ? 'info' : 'primary'"
            plain
            circle
            :aria-label="
              isSpeakerMuted
                ? t('meeting.unmuteSpeaker')
                : t('meeting.muteSpeaker')
            "
            @click="toggleSpeakerMute"
          >
            <VolumeX v-if="isSpeakerMuted" :size="16" />
            <Volume2 v-else :size="16" />
          </el-button>
        </el-tooltip>

        <el-tooltip content="摄像头" placement="top">
          <el-button
            plain
            circle
            aria-label="摄像头"
            @click="handleUnavailableFeature('摄像头')"
          >
            <Camera :size="16" />
          </el-button>
        </el-tooltip>
        <el-tooltip :content="shareScreenLabel" placement="top">
          <el-button
            :type="isCurrentUserSharing ? 'primary' : 'default'"
            plain
            circle
            :disabled="shareScreenDisabled"
            :aria-label="shareScreenLabel"
            @click="handleSharedScreen"
          >
            <MonitorUp :size="16" />
          </el-button>
        </el-tooltip>
        <el-tooltip
          :content="t('meeting.interactionHandAction')"
          placement="top"
        >
          <el-button
            plain
            circle
            :loading="isSendingInteraction"
            :aria-label="t('meeting.interactionHandAction')"
            @click="handleRaiseHand"
          >
            <Hand :size="16" />
          </el-button>
        </el-tooltip>
        <el-tooltip content="录制" placement="top">
          <el-button
            plain
            circle
            aria-label="录制"
            @click="handleUnavailableFeature('录制')"
          >
            <CircleDot :size="16" />
          </el-button>
        </el-tooltip>
        <el-tooltip content="设置" placement="top">
          <el-button
            plain
            circle
            aria-label="设置"
            @click="handleUnavailableFeature('设置')"
          >
            <Settings2 :size="16" />
          </el-button>
        </el-tooltip>
        <el-popover
          placement="top"
          trigger="click"
          width="220"
          popper-class="meeting-interaction-popover"
        >
          <template #reference>
            <el-tooltip
              :content="t('meeting.interactionEmojiAction')"
              placement="top"
            >
              <el-button
                plain
                circle
                :aria-label="t('meeting.interactionEmojiAction')"
              >
                <Sparkles :size="16" />
              </el-button>
            </el-tooltip>
          </template>
          <div class="meeting-emoji-picker">
            <button
              v-for="emoji in interactionEmojiOptions"
              :key="emoji"
              type="button"
              class="meeting-emoji-picker__item"
              @click="handleSendEmoji(emoji)"
            >
              {{ emoji }}
            </button>
          </div>
        </el-popover>

        <div class="meeting-control-dock__interaction">
          <el-input
            v-model="interactionText"
            maxlength="40"
            clearable
            :placeholder="t('meeting.interactionTextPlaceholder')"
            @keyup.enter="handleSendTextInteraction"
          />
          <el-button
            type="primary"
            plain
            circle
            :loading="isSendingInteraction"
            :aria-label="t('meeting.interactionTextAction')"
            @click="handleSendTextInteraction"
          >
            <SendHorizontal :size="16" />
          </el-button>
        </div>

        <div v-if="isConnected" class="meeting-control-dock__volume">
          <el-tooltip :content="t('meeting.playbackVolume')" placement="top">
            <span class="meeting-control-dock__volume-icon">
              <Volume2 :size="16" />
            </span>
          </el-tooltip>
          <el-slider
            v-model="speakerVolumePercent"
            :max="100"
            :min="0"
            :show-tooltip="false"
          />
        </div>

        <el-button
          v-if="canInviteParticipants"
          type="primary"
          plain
          @click="openInviteParticipantsDialog"
        >
          {{ t('meeting.inviteMoreAction') }}
        </el-button>

        <el-button
          v-if="!isHost"
          type="danger"
          plain
          @click="handleStopMeeting"
        >
          {{ t('meeting.leaveMeeting') }}
        </el-button>

        <el-button
          v-if="canStopMeeting"
          type="danger"
          @click="handleStopMeeting"
        >
          {{ t('meeting.stopMeeting') }}
        </el-button>
      </section>
    </div>
    <!-------------------------- 邀请参与者弹窗 -------------------------->
    <el-dialog
      v-model="inviteDialogVisible"
      :title="t('meeting.inviteMoreDialogTitle')"
      width="520px"
    >
      <AsyncSelect
        v-model="inviteUserIds"
        :entityConfig="{ entityKey: 'user' }"
        label-key="nickName"
        value-key="userId"
        multiple
        filterable
        :placeholder="t('meeting.inviteMorePlaceholder')"
      />
      <div
        v-if="inviteSelectableUsers.length === 0"
        class="meeting-invite-empty-tip"
      >
        {{ t('meeting.inviteMoreEmpty') }}
      </div>
      <template #footer>
        <el-button @click="inviteDialogVisible = false">
          {{ t('common.cancel') }}
        </el-button>
        <el-button
          type="primary"
          :loading="isInvitingParticipants"
          :disabled="inviteUserIds.length === 0"
          @click="handleInviteParticipants"
        >
          {{ t('meeting.inviteMoreSubmit') }}
        </el-button>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<style lang="scss" scoped>
.meeting-drawer__body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-right: 4px;
}

.meeting-shell-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 10px 14px;
  border-radius: 18px;
  border: 1px solid var(--color-primary-light-7);
  background: linear-gradient(
    180deg,
    var(--color-border-light),
    var(--color-bg-page)
  );
  box-shadow: var(--shadow-md);
}

.meeting-shell-bar__status,
.meeting-shell-bar__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.meeting-shell-bar__title {
  color: var(--color-text-primary);
  font-size: 15px;
  font-weight: 700;
}

.meeting-shell-bar__timer,
.meeting-shell-bar__id {
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
}

.meeting-shell-bar__network {
  border-radius: 999px;
}

.meeting-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 26vw);
  gap: 20px;
  align-items: start;
}

.meeting-ended-banner {
  padding: 16px 18px;
  border: 1px solid var(--color-danger-light);
  border-radius: 20px;
  background: linear-gradient(
    180deg,
    var(--color-danger-bg),
    var(--color-bg-page)
  );
  color: var(--color-danger);

  strong {
    display: block;
    margin-bottom: 6px;
    font-size: 15px;
  }

  p {
    margin: 0;
    line-height: 1.6;
  }
}

.meeting-share-stage {
  margin-bottom: 16px;
  border: 1px solid var(--color-primary-light);
  border-radius: 16px;
  background: var(--color-bg-page);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background: var(--color-primary-light);
    font-size: 14px;
    font-weight: 600;
  }

  &__content {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 280px;
    padding: 24px;
    color: var(--color-text-secondary);
    background: #1a1a2e;

    p {
      margin: 0;
      font-size: 14px;
    }
  }

  &--minimized {
    position: fixed;
    right: 20px;
    bottom: 100px;
    width: 320px;
    z-index: 100;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);

    .meeting-share-stage__content {
      min-height: 180px;
    }
  }
}

.meeting-side,
.meeting-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.meeting-main {
  max-width: min(26vw, 420px);
  justify-self: end;
  width: 100%;
}

.meeting-control-dock {
  position: sticky;
  bottom: 12px;
  z-index: 4;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px 18px;
  border-radius: 24px;
  border: 1px solid var(--color-primary-light-7);
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(14px);
  box-shadow: var(--shadow-lg);
}

.meeting-control-dock__volume {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 220px;
  padding: 0 6px;
}

.meeting-control-dock__volume-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

.meeting-control-dock__interaction {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: min(320px, 100%);
  flex: 1 1 320px;
}

.meeting-control-dock__interaction :deep(.el-input) {
  min-width: 0;
}

.meeting-control-dock__volume span {
  color: var(--color-text-secondary);
  font-size: 13px;
  white-space: nowrap;
}

.meeting-card {
  border: 1px solid var(--color-border);
  border-radius: 24px;
  padding: 22px;
  background:
    linear-gradient(180deg, var(--color-bg-page), var(--color-border-light)),
    linear-gradient(135deg, var(--color-primary-bg), transparent 30%);
  box-shadow: var(--shadow-lg);
}

.meeting-card--empty {
  min-height: 220px;
}

.meeting-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.meeting-card__header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: right;
}

.meeting-card__header h2 {
  margin: 0;
  font-size: 18px;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.meeting-card__header--stacked {
  align-items: flex-start;
}

.meeting-card__caption {
  margin: 6px 0 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.meeting-pending-list,
.meeting-participant-list,
.meeting-transcript-list,
.meeting-summary-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.meeting-live-feed {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 280px;
  padding: 18px 20px;
  border-radius: 22px;
  overflow: hidden;
  background:
    linear-gradient(180deg, var(--color-bg-page), var(--color-border-light)),
    radial-gradient(circle at top, var(--color-primary-bg), transparent 34%);
  border: 1px solid var(--color-border);
}

.meeting-live-feed__meta {
  display: flex;
  align-items: center;
  margin-bottom: 2px;
}

.meeting-live-feed__meta strong,
.meeting-live-summary__meta strong {
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.meeting-live-feed--scrollable {
  max-height: 540px;
  overflow: hidden;
  scrollbar-width: none;
}

.meeting-live-summary {
  min-height: 220px;
  padding: 20px 22px;
  border-radius: 22px;
  border: 1px solid var(--color-border);
  background:
    linear-gradient(180deg, var(--color-bg-page), var(--color-border-light)),
    radial-gradient(
      circle at top right,
      var(--color-warning-bg),
      transparent 36%
    );
}

.meeting-live-summary--streaming {
  box-shadow: inset 0 0 0 1px var(--color-warning-bg);
}

.meeting-live-summary__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.meeting-live-summary__meta small {
  color: var(--color-text-placeholder);
  font-size: 12px;
}

.meeting-live-summary__text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.9;
  color: var(--color-text-primary);
  font-size: 12px;
}

.meeting-summary-fade-enter-active,
.meeting-summary-fade-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.meeting-summary-fade-enter-from,
.meeting-summary-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.meeting-live-line {
  width: 100%;
}

.meeting-live-line__label {
  color: var(--color-text-primary);
  font-size: 12px;
  line-height: 1.9;
  letter-spacing: 0.02em;
  font-weight: 700;
}

.meeting-live-line__text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.9;
  color: var(--color-text-primary);
  font-size: 12px;
}

.meeting-live-line__pending {
  margin-left: 8px;
  vertical-align: middle;
}

.meeting-live-block--pending .meeting-live-line__label {
  color: var(--color-primary-dark);
}

.meeting-pending-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border: 1px solid var(--color-warning-light);
  border-radius: 18px;
  background: var(--color-warning-bg);
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.meeting-pending-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 30px var(--color-warning-bg);
}

.meeting-pending-item__actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.meeting-participant-item,
.meeting-transcript-item,
.meeting-summary-item {
  padding: 14px 16px;
  border-radius: 18px;
  background: var(--color-bg-hover);
  border: 1px solid var(--color-border);
}

.meeting-participant-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.meeting-participant-item--active {
  border-color: var(--color-primary-light-5);
  background:
    linear-gradient(
      135deg,
      var(--color-primary-light-9),
      var(--color-bg-hover)
    ),
    var(--color-bg-hover);
  box-shadow: 0 14px 28px var(--color-primary-bg);
  transform: translateY(-1px);
}

.meeting-participant-item--speaking {
  border-color: var(--color-success-light);
  background:
    linear-gradient(135deg, var(--color-success-bg), var(--color-bg-hover)),
    var(--color-bg-hover);
  box-shadow: 0 14px 28px var(--color-success-bg);
}

.meeting-participant-item--joined {
  border-color: var(--color-success);
  box-shadow: 0 14px 28px var(--color-success-bg);
}

.meeting-participant-item--waiting {
  background:
    linear-gradient(135deg, var(--color-warning-bg), var(--color-bg-hover)),
    var(--color-bg-hover);
}

.meeting-participant-item--absent {
  border-color: var(--color-danger-light);
  background:
    linear-gradient(135deg, var(--color-danger-bg), var(--color-bg-page)),
    var(--color-bg-page);
  box-shadow: 0 12px 24px var(--color-danger-bg);
}

.meeting-participant-item--declined {
  border-color: var(--color-danger-light);
  background:
    linear-gradient(135deg, var(--color-danger-bg), var(--color-bg-hover)),
    var(--color-bg-hover);
  box-shadow: 0 12px 24px var(--color-danger-bg);
}

.meeting-participant-item__main {
  display: flex;
  align-items: center;
  min-width: 0;
}

.meeting-participant-avatar {
  position: relative;
}

.meeting-participant-avatar__loading {
  position: absolute;
  inset: -6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.68);
  color: var(--color-warning);
}

.meeting-participant-avatar__rtc {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-text-placeholder);
  color: white;
  border: 2px solid white;

  &.is-speaking {
    background: var(--color-success);
    animation: pulse 1.5s infinite;
  }

  &.is-muted {
    background: var(--color-danger);
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 var(--color-success-bg);
  }
  70% {
    box-shadow: 0 0 0 8px transparent;
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
}

.meeting-participant-item strong,
.meeting-transcript-item strong,
.meeting-summary-item strong {
  display: block;
  color: var(--color-text-primary);
}

.meeting-participant-item small,
.meeting-transcript-item small,
.meeting-summary-item small {
  color: var(--color-text-secondary);
}

.meeting-participant-item__meta,
.meeting-transcript-item__meta,
.meeting-summary-item__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.meeting-presence {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.meeting-presence.is-online {
  background: var(--color-success);
  box-shadow: 0 0 0 4px var(--color-success-bg);
}

.meeting-presence.is-offline {
  background: var(--color-text-placeholder);
}

.meeting-transcript-item p,
.meeting-summary-item pre,
.meeting-final-summary {
  margin: 10px 0 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  line-height: 1.7;
  color: var(--color-text-primary);
}

.meeting-final-summary {
  min-height: 180px;
  padding: 18px;
  border-radius: 20px;
  background: linear-gradient(
    180deg,
    var(--color-primary-light-9),
    var(--color-bg-page)
  );
  border: 1px solid var(--color-primary-light-7);
}

/* 流式 ASR 进行中的转写 */
.meeting-transcript-item--pending {
  opacity: 0.9;
  border-left: 3px solid var(--color-primary);
  background: linear-gradient(
    135deg,
    var(--color-primary-light-9),
    var(--color-bg-hover)
  );
}

.meeting-transcript-pending-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-primary);
  font-size: 12px;
}

.meeting-emoji-picker {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.meeting-emoji-picker__item {
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-bg-page);
  font-size: 24px;
  line-height: 1;
  padding: 12px 0;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.meeting-emoji-picker__item:hover {
  transform: translateY(-1px);
  border-color: var(--color-primary-light-7);
  box-shadow: var(--shadow-sm);
}

/* 打字机光标闪烁 */
.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  margin-left: 2px;
  background: var(--color-primary);
  vertical-align: text-bottom;
  animation: cursor-blink 0.8s step-end infinite;
}

@keyframes cursor-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.meeting-error {
  margin: 0;
  color: var(--color-warning);
}

.meeting-empty {
  strong {
    display: block;
    margin-bottom: 8px;
    color: var(--color-text-primary);
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
  }
}

.meeting-invite-option {
  display: flex;
  flex-direction: column;
  gap: 2px;

  strong {
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: 600;
  }

  small {
    color: var(--color-text-secondary);
    font-size: 12px;
  }
}

.meeting-invite-empty-tip {
  margin-top: 12px;
  color: var(--color-text-secondary);
  font-size: 13px;
}

@media (max-width: 1024px) {
  .meeting-shell-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .meeting-grid {
    grid-template-columns: 1fr;
  }

  .meeting-main {
    max-width: none;
    justify-self: stretch;
  }

  .meeting-control-dock {
    bottom: 0;
    border-radius: 20px;
  }
}
</style>
