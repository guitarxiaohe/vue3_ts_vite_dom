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
import { ElMessage } from 'element-plus';
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
import MeetingParticipantGrid from '@/components/meeting-participant-grid/index.vue';
import { useMeetingStore } from '@/stores';
import { useLivekitRoom } from '@/composables/use-livekit-room';
import { buildSpeakerTranscriptLines } from '@/utils/meeting-transcript';
import { AsyncSelect } from '@/components/async-select';
import { useMeetingParticipants } from './use-meeting-participants';
import { useMeetingScreenShare } from './use-meeting-screen-share';
import { useMeetingRtcSession } from './use-meeting-rtc-session';
/***************************** Store / Composable 初始化 *****************************/
const { t } = useI18n();
const meetingStore = useMeetingStore();

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
  room,
  localScreenTrack,
  remoteScreenShare,
  startScreenShare,
  stopScreenShare,
  prepareForPageUnload,
} = useLivekitRoom();

/***************************** 响应式状态 *****************************/
// 当前正在发言的用户 ID，用于触发发言人头像高亮脉冲效果
const activeSpeakerUserId = ref<string | null>(null);
// 新加入会议的用户 ID，用于触发参与者加入时的高亮动画
const joinedHighlightUserId = ref<string | null>(null);
// 上一次水合（初始化）时记录的最新转写 ID，用于判断转写内容是否为增量更新、避免重复触发高亮
const hydratedLastTranscriptId = ref<string | null>(null);
// 实时转写面板的 DOM 元素引用，用于在新转写内容出现时自动滚动到底部
const transcriptPanelRef = ref<HTMLElement | null>(null);
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
// 互动表情面板中可选的表情列表
const interactionEmojiOptions = ['👍', '👏', '🎉', '🔥', '✅', '❓'];

/***************************** 定时器 / 权限状态 *****************************/
let activeSpeakerTimer: ReturnType<typeof setTimeout> | null = null;
let joinedHighlightTimer: ReturnType<typeof setTimeout> | null = null;
let meetingClockTimer: ReturnType<typeof setInterval> | null = null;

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
// 会议 / RTC 状态
const isMeetingEnded = computed(() =>
  meetingStore.isTerminalStatus(meetingDetail.value?.session.status)
);
const {
  isHost,
  visibleMeetingParticipants,
  participantRtcCount,
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
  isConnected,
  isReconnecting,
  isRtcRunning,
  isRtcOwnedByOtherTab,
  showJoinRtcButton,
  speakerVolumePercent,
  waitingMicPermission,
  openPendingMeeting,
  handleTakeOverRtc,
  handleStopMeeting,
  declinePendingMeeting,
  handleDrawerAttemptClose,
} = useMeetingRtcSession({
  connectionState,
  rtcParticipants,
  activeSpeakers,
  isMicEnabled,
  playbackVolume,
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
void screenShareVideoRef;

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

function handleUnavailableFeature(label: string) {
  ElMessage.info(`${label}能力正在接入中`);
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

// 发送举手
function handleRaiseHand() {
  void handleSendInteraction('HAND', t('meeting.interactionHandBubble'));
}

// 发送表情
function handleSendEmoji(emoji: string) {
  void handleSendInteraction('EMOJI', emoji);
}

// 发送文字
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
    pulseSpeaker(String(latestTranscript.value?.userId ?? ''));
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
      <section v-if="shouldShowShareStage" class="meeting-share-stage">
        <div class="meeting-share-stage__header">
          <span>
            {{
              t('meeting.shareScreenStageTitle', {
                name: currentSharerName,
              })
            }}
          </span>
        </div>
        <div class="meeting-share-stage__content">
          <div ref="screenShareVideoRef" class="meeting-share-stage__video" />
          <p v-if="!remoteScreenShare">
            {{ t('meeting.shareScreenPlaceholder') }}
          </p>
        </div>
      </section>

      <!-------------------------- 主体内容区域 -------------------------->
      <div v-if="!shouldShowShareStage" class="meeting-grid">
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
  flex: 1;
  min-height: calc(100vh - 220px);
  border: 1px solid var(--color-primary-light);
  border-radius: 24px;
  background: var(--color-bg-page);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 14px 20px;
    background: var(--color-primary-light);
    font-size: 15px;
    font-weight: 600;
  }

  &__content {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - 288px);
    padding: 28px;
    color: var(--color-text-secondary);
    background: #1a1a2e;

    p {
      margin: 0;
      font-size: 14px;
    }
  }

  &__video {
    width: 100%;
    min-height: calc(100vh - 344px);
    height: calc(100vh - 344px);
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    overflow: hidden;
    border-radius: 18px;
    background: rgba(15, 23, 42, 0.32);

    :deep(video) {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #050816;
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

  .meeting-share-stage {
    min-height: calc(100vh - 200px);

    &__content {
      min-height: calc(100vh - 252px);
      padding: 18px;
    }

    &__video {
      min-height: calc(100vh - 288px);
      height: calc(100vh - 288px);
    }
  }

  .meeting-control-dock {
    bottom: 0;
    border-radius: 20px;
  }
}

.meeting-share-stage__video {
  position: absolute;
  width: 100%;
  height: 100%;
  /* 适配 Safari 浏览器的 WebRTC 视频渲染问题 */
  @supports (-webkit-appearance: none) and (object-fit: contain) {
    :deep(video) {
      object-fit: cover;
    }
  }
}

:deep(.el-drawer__header) {
  margin-bottom: 0px !important;
}
</style>
