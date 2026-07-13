<script lang="ts" setup>
/******************************** 依赖导入 ********************************/
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Camera,
  CameraOff,
  Captions,
  Mic,
  MicOff,
  MonitorUp,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import MeetingParticipantGrid from '@/components/meeting-participant-grid/index.vue';
import { useMeetingStore } from '@/stores';
import {
  useLivekitRoom,
  type ScreenShareQuality,
} from '@/composables/use-livekit-room';
import { buildSpeakerTranscriptLines } from '@/utils/meeting-transcript';
import { AsyncSelect } from '@/components/async-select';
import { useMeetingCamera } from './use-meeting-camera';
import { useMeetingParticipants } from './use-meeting-participants';
import { useMeetingScreenShare } from './use-meeting-screen-share';
import { useMeetingRtcSession } from './use-meeting-rtc-session';
import MeetingLiveTranscript from './components/meeting-live-transcript.vue';
import MeetingScreenShareStage from './components/meeting-screen-share-stage.vue';
import MeetingAiSummary from './components/meeting-ai-summary.vue';
import MeetingInteractionChat from './components/meeting-interaction-chat.vue';
import { useRoute, useRouter } from 'vue-router';
import {
  enterTheRoomByCodeApi,
  getMeetingByRoomNameApi,
} from '@/api/modules/meeting-public';
import { useUserStore } from '@/stores';
import { useWebSocket } from '@/composables/use-websocket';
import meetingTag from './components/meeting-tag.vue';
import { copyText } from '@/utils/copy.ts';
// import { getRtcTokenApi } from '@/api/modules/meeting-rtc.ts';

const userStore = useUserStore();
const { connect: connectNotifySocket, disconnect: disconnectNotifySocket } =
  useWebSocket();
const notifySocketStarted = ref(false);

/***************************** Store / Composable 初始化 *****************************/
const { t } = useI18n();
const meetingStore = useMeetingStore();
/***************************** 获取路由 *****************************/
const route = useRoute();
const router = useRouter();

function getQueryString(key: string) {
  const value = route.query[key];
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function redirectToLoginWithCurrentMeeting() {
  void router.push({
    path: '/login',
    query: {
      redirect: route.fullPath,
    },
  });
}

/***************************** LiveKit RTC 解构 *****************************/
const {
  connectionState,
  participants: rtcParticipants,
  activeSpeakers,
  isMicEnabled,
  playbackVolume,
  joinRoom,
  leaveRoom,
  toggleMic,
  setPlaybackVolume,
  requestPlaybackPermission,
  room,
  localScreenTrack,
  remoteScreenShare,
  startScreenShare,
  stopScreenShare,
  prepareForPageUnload,
  isCameraEnabled,
  toggleCamera: toggleLiveKitCamera,
  localVideoTrack,
  remoteCameraTracks,
} = useLivekitRoom();

/***************************** 响应式状态 *****************************/
// 当前正在发言的用户 ID，用于触发发言人头像高亮脉冲效果
const activeSpeakerUserId = ref<string | null>(null);
// 新加入会议的用户 ID，用于触发参与者加入时的高亮动画
const joinedHighlightUserId = ref<string | null>(null);
// 上一次水合（初始化）时记录的最新转写 ID，用于判断转写内容是否为增量更新、避免重复触发高亮
const hydratedLastTranscriptId = ref<string | null>(null);
// 当前时间戳（每秒刷新），驱动会议已进行时长的计算显示
const meetingClockNow = ref(Date.now());
// 是否正在提交邀请参与者请求，控制邀请按钮的 loading 状态
const isInvitingParticipants = ref(false);
// 是否正在发送互动消息（举手/表情/文字），控制发送按钮的 loading 状态
const isSendingInteraction = ref(false);
// 邀请参与者弹窗是否可见
const inviteDialogVisible = ref(false);
// 邀请弹窗中已选中的待邀请用户 ID 列表
const inviteUserIds = ref<string[]>([]);
// 互动文字输入框的当前内容
const interactionText = ref('');
// 移动端信息区当前选中的面板
const mobileActivePanel = ref<'transcript' | 'summary' | 'chat'>('transcript');
// 当前屏幕共享清晰度档位
const screenShareQuality = ref<ScreenShareQuality>('smooth');
// 摄像头
const { handleToggleCamera, isTogglingCamera, cameraVideoRef } =
  useMeetingCamera({
    room,
    connectionState,
    isCameraEnabled,
    toggleCamera: toggleLiveKitCamera,
    localVideoTrack,
    remoteCameraTracks,
  });
// handleToggleCamera('stop');
/***************************** 定时器 / 权限状态 *****************************/
let activeSpeakerTimer: ReturnType<typeof setTimeout> | null = null;
let joinedHighlightTimer: ReturnType<typeof setTimeout> | null = null;
let meetingClockTimer: ReturnType<typeof setInterval> | null = null;

function ensureNotifySocketConnected() {
  if (!userStore.isLoggedIn || notifySocketStarted.value) {
    return;
  }
  connectNotifySocket();
  notifySocketStarted.value = true;
}

function stopNotifySocket() {
  if (!notifySocketStarted.value) {
    return;
  }
  disconnectNotifySocket();
  notifySocketStarted.value = false;
}

/***************************** 计算属性(DOTO这里可以优化,以后再说) *****************************/

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
// 最新一条转写记录
const latestTranscript = computed(() => {
  const transcripts = meetingDetail.value?.transcripts ?? [];
  return transcripts[transcripts.length - 1] ?? null;
});
// 会议 / RTC 状态
const isMeetingEnded = computed(() =>
  meetingStore.isTerminalStatus(meetingDetail.value?.session.status)
);
const {
  isHost,
  participantDisplayItems,
  canInviteParticipants,
  inviteSelectableUsers,
  canStopMeeting,
} = useMeetingParticipants({
  activeSpeakerUserId,
  joinedHighlightUserId,
  rtcParticipants,
});

const {
  isRtcOwnedByOtherTab,
  waitingMicPermission,
  openPendingMeeting,
  handleStopMeeting,
  declinePendingMeeting,
} = useMeetingRtcSession({
  connectionState,
  rtcParticipants,
  activeSpeakers,
  isMicEnabled,
  playbackVolume,
  bootstrapOnMount: false,
  joinRoom,
  leaveRoom,
  setPlaybackVolume,
  requestPlaybackPermission,
  prepareForPageUnload,
});

const {
  screenShareVideoRef,
  isCurrentUserSharing,
  shouldShowShareStage,
  currentSharerName,
  shareScreenDisabled,
  shareScreenLabel,
  handleSharedScreen,
  clearScreenShareTrack,
} = useMeetingScreenShare({
  room,
  connectionState,
  localScreenTrack,
  remoteScreenShare,
  startScreenShare,
  stopScreenShare,
});

/***************************** 高亮脉冲效果 *****************************/

/**
 * 触发发言人高亮脉冲效果
 * @param userId - 需要高亮的用户 ID，传 null 可提前清除高亮
 * @param duration - 高亮持续时间（毫秒），默认 3200ms
 */
function pulseSpeaker(userId: string | null, duration = 3200) {
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
function pulseJoinedParticipant(userId: string | null, duration = 3600) {
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

// 复制链接
const copyLink = async () => {
  if (meetingStore.meetingDetail?.session.link) {
    try {
      await copyText(meetingStore.meetingDetail?.session.link);
      ElMessage.success('复制链接成功');
    } catch (err) {
      ElMessage.error(`复制链接失败，可能出现的问题 --> ${err}`);
    }
  }
};

/**
 * 控制转写拉开收起
 */
const isShowTranscript = ref<boolean>(false);
const transcriptSwitch = (): void => {
  isShowTranscript.value = !isShowTranscript.value;
};

// 发送文字
function handleSendTextInteraction(text?: string) {
  const content = (text ?? interactionText.value).trim();
  if (!content) {
    return;
  }
  interactionText.value = '';
  void handleSendInteraction('TEXT', content);
}

function goBackAfterMeetingAction() {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  void router.push('/');
}

async function handleStopMeetingAndBack() {
  await handleStopMeeting();
  goBackAfterMeetingAction();
}

/**
 * 初始化数据
 * - 通过 code 拿到房间信息
 * - 判断是否登录做会议还是引导登录
 */
const initData = async () => {
  const queryMeetingId = getQueryString('meetingId');
  const meetingCode = getQueryString('code');

  if (queryMeetingId) {
    if (!userStore.isLoggedIn) {
      // 没登录走 携带参数登录
      redirectToLoginWithCurrentMeeting();
      return;
    }
    await meetingStore.enterMeeting(queryMeetingId);
    return;
  }

  if (!meetingCode) {
    return;
  }

  const { data: result } = await getMeetingByRoomNameApi(meetingCode);

  if (!result) {
    return;
  }

  // result 为 CmsMeetingDetail，会议信息在 session 下
  const meetingId = result.session?.id;
  const publicCode = result.session?.publicCode;
  if (!meetingId) {
    return;
  }

  // 未登录走登录路线  - 已登录直接走会议
  if (userStore.isLoggedIn) {
    ensureNotifySocketConnected();
    if (publicCode) {
      await enterTheRoomByCodeApi(publicCode);
    }
    // 加载会议详情、自动接受邀请、claim RTC 所有权
    await meetingStore.enterMeeting(meetingId);
    return;
  }
  meetingStore.setMeetingDetail(result);
};
initData();
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
    pulseSpeaker(String(latestTranscript.value?.userId ?? ''));
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

// 新参与者加入时显示提示并高亮
watch(
  () => meetingStore.lastJoinedUserId,
  (userId) => {
    if (!userId || !meetingDetail.value) {
      return;
    }
    const participant = meetingDetail.value.participants.find(
      (item) => String(item.userId) === userId
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

/***************************** 生命周期钩子 *****************************/

onMounted(() => {
  ensureNotifySocketConnected();
  meetingClockTimer = setInterval(() => {
    meetingClockNow.value = Date.now();
  }, 1000);
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
  clearScreenShareTrack();
  stopNotifySocket();
});

function handleScreenShareVideoReady(element: HTMLDivElement | null) {
  screenShareVideoRef.value = element;
}

function handleCameraVideoReady(
  elements: Record<string, HTMLDivElement | null>
) {
  cameraVideoRef.value = elements;
}

watch(
  () => userStore.isLoggedIn,
  (isLoggedIn) => {
    if (isLoggedIn) {
      ensureNotifySocketConnected();
      void initData();
      return;
    }
    stopNotifySocket();
  }
);
</script>

<template>
  <div class="meeting-drawer__body">
    <!-------------------------- 顶部状态栏 -------------------------->
    <section class="meeting-shell-bar">
      <div class="meeting-shell-bar__status">
        <strong class="meeting-shell-bar__title">
          {{ meetingDetail?.session.title || t('meeting.drawerTitle') }}
        </strong>
        <span class="meeting-shell-bar__timer">{{ meetingElapsedLabel }}</span>
      </div>

      <div class="meeting-shell-bar__meta" v-if="meetingDetail">
        <meetingTag
          :meeting-detail="meetingDetail"
          :waiting-mic-permission="waitingMicPermission"
          :is-rtc-owned-by-other-tab="isRtcOwnedByOtherTab"
        />
      </div>
    </section>

    <!-------------------------- 会议已结束提示 -------------------------->
    <section v-if="isMeetingEnded" class="meeting-ended-banner">
      <strong>{{ t('meeting.endedBannerTitle') }}</strong>
      <p>{{ t('meeting.endedBannerDescription') }}</p>
    </section>

    <!-------------------------- 主体内容区域 -------------------------->
    <div
      class="meeting-grid"
      :class="{
        'meeting-grid--empty': !meetingDetail,
        'meeting-grid--sharing': shouldShowShareStage,
      }"
    >
      <!-------------------------- 主舞台：共享屏幕 / 待处理会议 / 参与者列表 -------------------------->
      <main class="meeting-stage">
        <div
          v-if="shouldShowShareStage"
          class="meeting-stage__canvas meeting-stage__canvas--share"
        >
          <MeetingScreenShareStage
            :current-sharer-name="currentSharerName"
            :has-remote-screen-share="!!remoteScreenShare"
            @video-ready="handleScreenShareVideoReady"
          />
        </div>

        <article
          v-else-if="pendingMeetings.length && !meetingDetail"
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

        <article v-else-if="meetingDetail" class="meeting-stage__canvas">
          <p class="meeting-stage__hint">
            {{ t('meeting.noScreenSharing') }}
          </p>
          <MeetingParticipantGrid
            :items="participantDisplayItems"
            :host-label="t('meeting.roleHost')"
            @video-ready="handleCameraVideoReady"
          />
        </article>

        <article v-else class="meeting-card meeting-card--empty">
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
      </main>

      <!-------------------------- 信息区：实时转写 / AI 摘要 / 互动聊天 -------------------------->
      <aside
        v-if="meetingDetail"
        class="meeting-main"
        :class="!isShowTranscript ? 'meeting-main-show' : ''"
      >
        <nav
          class="meeting-mobile-tabs"
          :aria-label="t('meeting.mobilePanelTabs')"
        >
          <button
            type="button"
            :class="{ 'is-active': mobileActivePanel === 'transcript' }"
            @click="mobileActivePanel = 'transcript'"
          >
            {{ t('meeting.mobileTranscriptTab') }}
          </button>
          <button
            type="button"
            :class="{ 'is-active': mobileActivePanel === 'summary' }"
            @click="mobileActivePanel = 'summary'"
          >
            {{ t('meeting.mobileSummaryTab') }}
          </button>
          <button
            type="button"
            :class="{ 'is-active': mobileActivePanel === 'chat' }"
            @click="mobileActivePanel = 'chat'"
          >
            {{ t('meeting.mobileChatTab') }}
          </button>
        </nav>
        <div
          class="meeting-side-section-transcript-switch"
          @click="transcriptSwitch"
        >
          <ChevronLeft v-show="!isShowTranscript" />
          <ChevronRight v-show="isShowTranscript" />
        </div>
        <article
          class="meeting-side-section meeting-side-section--transcript"
          :class="{ 'is-mobile-active': mobileActivePanel === 'transcript' }"
        >
          <MeetingLiveTranscript
            :lines="renderedTranscriptLines"
            :block-count="liveTranscriptBlocks.length"
          />
        </article>

        <article
          class="meeting-side-section meeting-side-section--summary"
          :class="{ 'is-mobile-active': mobileActivePanel === 'summary' }"
        >
          <MeetingAiSummary
            :text="liveSummaryText"
            :status="liveSummaryStatus"
            :render-key="liveSummaryRenderKey"
          />
        </article>

        <article
          class="meeting-side-section meeting-side-section--chat"
          :class="{ 'is-mobile-active': mobileActivePanel === 'chat' }"
        >
          <MeetingInteractionChat
            :messages="meetingStore.interactionMessages"
            :is-sending="isSendingInteraction"
            :placeholder="t('meeting.interactionTextPlaceholder')"
            @send-text="handleSendTextInteraction"
          />
        </article>
      </aside>
    </div>
    <!-------------------------- 底部 操作按钮-------------------------->
    <section
      v-if="
        meetingDetail &&
        meetingStore.isActiveStatus(meetingDetail.session.status)
      "
      class="meeting-control-dock"
    >
      <el-tooltip
        :content="isMicEnabled ? t('meeting.micOn') : t('meeting.micOff')"
        placement="top"
      >
        <button
          type="button"
          class="meeting-control-button"
          :aria-label="isMicEnabled ? t('meeting.micOn') : t('meeting.micOff')"
          @click="toggleMic"
        >
          <Mic v-if="isMicEnabled" :size="22" />
          <MicOff v-else :size="22" />
          <span>{{
            isMicEnabled ? t('meeting.micShort') : t('meeting.micMutedShort')
          }}</span>
        </button>
      </el-tooltip>
      <!-- 摄像头 -->
      <el-tooltip
        :content="
          isCameraEnabled ? t('meeting.cameraOff') : t('meeting.cameraOn')
        "
        placement="top"
      >
        <button
          type="button"
          class="meeting-control-button"
          :disabled="isTogglingCamera"
          :aria-label="
            isCameraEnabled ? t('meeting.cameraOff') : t('meeting.cameraOn')
          "
          @click="handleToggleCamera"
        >
          <Camera v-if="isCameraEnabled" :size="22" />
          <CameraOff v-else :size="22" />
          <span>{{
            isCameraEnabled
              ? t('meeting.cameraShort')
              : t('meeting.cameraOffShort')
          }}</span>
        </button>
      </el-tooltip>

      <div class="meeting-control-dock__screen-share">
        <el-tooltip :content="shareScreenLabel" placement="top">
          <button
            type="button"
            class="meeting-control-button"
            :class="{ 'is-active': isCurrentUserSharing }"
            :disabled="shareScreenDisabled"
            :aria-label="shareScreenLabel"
            @click="handleSharedScreen(screenShareQuality)"
          >
            <MonitorUp :size="22" />
            <span>{{ t('meeting.shareScreenShort') }}</span>
          </button>
        </el-tooltip>
      </div>

      <el-tooltip :content="t('meeting.captionAction')" placement="top">
        <button
          type="button"
          class="meeting-control-button"
          :aria-label="t('meeting.captionAction')"
          @click="mobileActivePanel = 'transcript'"
        >
          <Captions :size="22" />
          <span>{{ t('meeting.captionShort') }}</span>
        </button>
      </el-tooltip>

      <el-dropdown placement="top-start">
        <button
          type="button"
          class="meeting-control-button"
          :aria-label="t('meeting.moreAction')"
        >
          <MoreVertical :size="22" />
          <span>{{ t('meeting.moreShort') }}</span>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="openInviteParticipantsDialog"
              >拉人</el-dropdown-item
            >
            <el-dropdown-item @click="copyLink">分享</el-dropdown-item>
            <el-dropdown-item>后台运行</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-button
        v-if="!isHost"
        class="meeting-control-dock__end"
        type="danger"
        @click="handleStopMeetingAndBack"
      >
        <span class="meeting-control-dock__end-icon" />
        <span>{{ t('meeting.leaveMeeting') }}</span>
      </el-button>

      <el-button
        v-if="canStopMeeting"
        class="meeting-control-dock__end"
        type="danger"
        @click="handleStopMeetingAndBack"
      >
        <span class="meeting-control-dock__end-icon" />
        <span>{{ t('meeting.stopMeeting') }}</span>
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
</template>

<style lang="scss" scoped>
.meeting-drawer__body {
  width: 100vw;
  height: 100vh;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  overflow: hidden;
  background: #f2f3f5;
}

.meeting-shell-bar {
  flex: 0 0 50px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 14px;
  border: 0;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 0;
  background: #ffffff;
  box-shadow: none;
}

.meeting-shell-bar__status,
.meeting-shell-bar__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
  min-width: 0;
}

.meeting-shell-bar__title {
  max-width: min(42vw, 520px);
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meeting-shell-bar__timer {
  color: #667085;
  font-size: 13px;
}

.meeting-grid {
  flex: 2;
  min-height: 0;
  display: flex;
}

.meeting-grid--empty {
  grid-template-columns: minmax(0, 1fr);
}

.meeting-ended-banner {
  flex: 0 0 auto;
  padding: 10px 16px;
  border-bottom: 1px solid #fecdd3;
  background: #fff1f2;
  color: #e11d48;

  strong {
    display: block;
    font-size: 14px;
  }

  p {
    margin: 4px 0 0;
    font-size: 12px;
    line-height: 1.5;
  }
}

.meeting-stage {
  flex: 4;
  min-width: 0;
  min-height: 0;
  display: flex;
  align-self: stretch;
  gap: 0;
  background: #111318;
}

.meeting-card {
  width: min(560px, calc(100% - 32px));
  max-height: calc(100% - 32px);
  margin: auto;
  padding: 18px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: none;
}

.meeting-card--empty {
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.meeting-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.meeting-card__header h2 {
  margin: 0;
  color: #111827;
  font-size: 18px;
  font-weight: 700;
}

.meeting-pending-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.meeting-pending-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8f9fb;
  color: #111827;
}

.meeting-pending-item span,
.meeting-pending-item small {
  color: #667085;
  font-size: 12px;
}

.meeting-pending-item__actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.meeting-stage__canvas {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(24px, 5vw, 64px) clamp(32px, 5vw, 72px);
  overflow: hidden;
  background: #111318;
}

.meeting-stage__canvas :deep(.meeting-participant-grid) {
  align-content: center;
}

.meeting-stage__canvas--share {
  padding: 0;
}

.meeting-stage__hint {
  position: absolute;
  top: 22px;
  left: 50%;
  margin: 0;
  color: #6b7280;
  font-size: 13px;
  transform: translateX(-50%);
}

.meeting-main {
  width: 400px;
  min-width: 0;
  min-height: 0;
  max-height: none;
  display: grid;
  grid-template-rows: 240px 132px minmax(178px, 1fr);
  gap: 0;
  border-left: 1px solid #e5e7eb;
  background: #ffffff;
  transition: all 0.5s;
  position: relative;
  .meeting-side-section-transcript-switch {
    position: absolute;
    top: 40%;
    left: -20px;
    cursor: pointer;
    color: #ffffff;
  }
}
.meeting-main-show {
  width: 0px;
}
.meeting-mobile-tabs {
  display: none;
}

.meeting-side-section {
  min-height: 0;
  border-bottom: 1px solid #e5e7eb;
  overflow: hidden;
}

.meeting-side-section--chat {
  border-bottom: 0;
}

.meeting-control-dock {
  position: relative;
  bottom: auto;
  z-index: 4;
  flex: 0 0 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: nowrap;
  gap: 22px;
  padding: 4px 96px;
  border: 0;
  border-top: 1px solid #e5e7eb;
  border-radius: 0;
  background: #ffffff;
  box-shadow: none;
  backdrop-filter: none;
}

.meeting-control-button {
  width: 48px;
  min-width: 48px;
  height: 50px;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  color: #111827;
  font-size: 10px;
  line-height: 1.2;
  background: transparent;
  cursor: pointer;
}

.meeting-control-button:focus-visible {
  outline: 2px solid #5046e5;
  outline-offset: 2px;
}

.meeting-control-button span {
  white-space: nowrap;
}

.meeting-control-button:hover,
.meeting-control-button.is-active {
  color: #4f46e5;
  background: #f5f4ff;
}

.meeting-control-button:disabled {
  color: #98a2b3;
  cursor: not-allowed;
}

.meeting-control-dock__screen-share {
  display: inline-flex;
  align-items: center;
}

.meeting-control-dock__end {
  position: absolute;
  right: 18px;
  bottom: 8px;
  height: 44px;
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 8px;
  border: 0;
  color: #ff1f3d;
  font-size: 11px;
  background: transparent;
}

.meeting-control-dock__end:hover,
.meeting-control-dock__end:focus {
  color: #ff1f3d;
  background: transparent;
}

.meeting-control-dock__end-icon {
  width: 16px;
  height: 12px;
  display: inline-block;
  border-left: 3px solid currentColor;
  border-radius: 2px;
  transform: skewY(-20deg);
}

.meeting-empty {
  strong {
    display: block;
    margin-bottom: 8px;
    color: #111827;
  }

  p {
    margin: 0;
    color: #667085;
  }
}

.meeting-invite-empty-tip {
  margin-top: 12px;
  color: #667085;
  font-size: 13px;
}

@media (max-width: 900px) {
  .meeting-shell-bar {
    flex: 0 0 53px;
  }

  .meeting-grid {
    display: flex;
    flex-direction: column;
  }

  .meeting-stage {
    flex: 1 1 auto;
  }

  .meeting-stage__canvas {
    padding: 40px 18px 18px;
  }

  .meeting-stage__canvas--share {
    padding: 0;
  }

  .meeting-main {
    width: 100%;
    flex: 0 0 254px;
    display: flex;
    flex-direction: column;
    border-left: 0;
    border-top: 1px solid #e5e7eb;
  }

  .meeting-mobile-tabs {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    padding: 4px 8px 0;
    background: #ffffff;
  }

  .meeting-mobile-tabs button {
    height: 36px;
    border: 0;
    border-radius: 8px;
    color: #475467;
    font-size: 14px;
    font-weight: 500;
    background: transparent;
  }

  .meeting-mobile-tabs button.is-active {
    color: #111827;
    font-weight: 700;
    background: #f4f5f7;
  }

  .meeting-side-section {
    flex: 1;
    display: none;
    border-bottom: 0;
  }

  .meeting-side-section.is-mobile-active {
    display: block;
  }

  .meeting-control-dock {
    flex: 0 0 66px;
    justify-content: space-between;
    gap: 0;
    padding: 6px 10px;
  }

  .meeting-control-button {
    width: 52px;
    min-width: 48px;
    height: 58px;
  }

  .meeting-control-dock__end {
    position: static;
    width: 42px;
    height: 52px;
    padding: 0 6px;
  }
}

@media (min-width: 901px) and (max-width: 1180px) {
  .meeting-grid {
    grid-template-columns: minmax(0, 1fr) 272px;
  }

  .meeting-stage__canvas {
    padding: 22px 24px;
  }

  .meeting-control-dock {
    gap: 16px;
    padding: 4px 74px;
  }
}

@media (max-width: 640px) {
  .meeting-shell-bar {
    padding: 0 12px;
  }

  .meeting-shell-bar__title {
    max-width: 52vw;
    font-size: 15px;
  }

  .meeting-shell-bar__timer {
    font-size: 14px;
  }

  .meeting-main {
    flex-basis: 252px;
  }

  .meeting-control-dock {
    flex: 0 0 72px;
    padding: 6px 8px;
  }

  .meeting-control-button {
    width: 48px;
    min-width: 44px;
    height: 58px;
    font-size: 11px;
  }
}

@media (max-height: 520px) {
  .meeting-shell-bar {
    flex-basis: 42px;
  }

  .meeting-grid {
    min-height: 0;
  }

  .meeting-main {
    flex-basis: 150px;
  }

  .meeting-stage__canvas {
    align-items: flex-start;
    padding: 10px 12px;
    overflow-y: auto;
  }

  .meeting-stage__canvas--share {
    padding: 0;
    overflow: hidden;
  }

  .meeting-mobile-tabs button {
    height: 30px;
    font-size: 12px;
  }

  .meeting-control-dock {
    flex-basis: 52px;
    padding: 2px 8px;
  }

  .meeting-control-button {
    height: 48px;
    font-size: 10px;
  }
}
</style>
