<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  LoaderCircle,
  Mic,
  MicOff,
  PhoneOff,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import { ConnectionState } from 'livekit-client';
import UserAvatarInfo from '@/components/user-avatar-info/index.vue';
import { useMeetingStore, usePresenceStore, useUserStore } from '@/stores';
import { useMeetingRtcStore } from '@/stores/modules/meeting-rtc';
import { useLivekitRoom } from '@/composables/use-livekit-room';
import {
  getRtcTokenApi,
  startRtcApi,
} from '@/api/modules/meeting-rtc';

const route = useRoute();
const { t } = useI18n();
const meetingStore = useMeetingStore();
const userStore = useUserStore();
const presenceStore = usePresenceStore();
const rtcStore = useMeetingRtcStore();

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
} = useLivekitRoom();

const activeSpeakerUserId = ref<number | null>(null);
const joinedHighlightUserId = ref<number | null>(null);
const hydratedLastTranscriptId = ref<number | null>(null);
const isJoining = ref(false);
const isStartingRtc = ref(false);
const waitingMicPermission = ref(false);
const lastJoinAttemptMeetingId = ref<number | null>(null);

let activeSpeakerTimer: ReturnType<typeof setTimeout> | null = null;
let joinedHighlightTimer: ReturnType<typeof setTimeout> | null = null;
let permissionStatus: PermissionStatus | null = null;
let permissionRetryRegistered = false;

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

const meetingDetail = computed(() => meetingStore.meetingDetail);
const pendingMeetings = computed(() => meetingStore.pendingMeetings);
const stageSummaries = computed(() => meetingStore.stageSummaries);
const finalSummary = computed(() => meetingStore.finalSummary);
const currentUser = computed(() => userStore.userInfo);
const isMeetingEnded = computed(
  () => meetingDetail.value?.session.status === 'ENDED'
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
const speakerVolumePercent = computed({
  get: () => Math.round(playbackVolume.value * 100),
  set: (value: number) => {
    setPlaybackVolume(value / 100);
  },
});

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

const isHost = computed(() => {
  if (!meetingDetail.value || !currentUser.value) return false;
  return (
    meetingStore.toNumericId(meetingDetail.value.session.hostUserId) ===
    meetingStore.toNumericId(currentUser.value.userId)
  );
});

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

function participantInviteStatusType(status: string) {
  if (status === 'ACCEPTED') {
    return 'success';
  }
  if (isMeetingEnded.value) {
    return 'danger';
  }
  if (status === 'PENDING') {
    return 'warning';
  }
  return 'info';
}

function participantInviteStatusText(status: string) {
  if (status === 'ACCEPTED') {
    return t('meeting.participantAccepted');
  }
  if (isMeetingEnded.value) {
    return t('meeting.participantAbsent');
  }
  if (status === 'PENDING') {
    return t('meeting.participantPending');
  }
  return t('meeting.participantLeft');
}

function isParticipantConnected(participant: {
  inviteStatus: string;
  userId: number;
}) {
  return (
    participant.inviteStatus === 'ACCEPTED' &&
    presenceStore.isUserOnline(participant.userId)
  );
}

function participantMeetingStatusType(participant: {
  inviteStatus: string;
  userId: number;
}) {
  if (participant.inviteStatus !== 'ACCEPTED') {
    return 'warning';
  }
  return isParticipantConnected(participant) ? 'success' : 'info';
}

function participantMeetingStatusText(participant: {
  inviteStatus: string;
  userId: number;
}) {
  if (participant.inviteStatus !== 'ACCEPTED') {
    return t('meeting.participantPending');
  }
  return isParticipantConnected(participant)
    ? t('meeting.participantConnected')
    : t('meeting.participantConnecting');
}

function isParticipantWaiting(participant: {
  inviteStatus: string;
  userId: number;
}) {
  if (isMeetingEnded.value) {
    return false;
  }
  return !isParticipantConnected(participant);
}

function isParticipantAbsent(participant: { inviteStatus: string }) {
  return isMeetingEnded.value && participant.inviteStatus !== 'ACCEPTED';
}

/**
 * 获取参与者 RTC 状态
 */
function getParticipantRtcInfo(userId: number) {
  const identity = `user-${userId}`;
  return rtcParticipants.value.find((p) => p.identity === identity);
}

function isParticipantInRtc(userId: number) {
  return !!getParticipantRtcInfo(userId);
}

function isParticipantSpeaking(userId: number) {
  const info = getParticipantRtcInfo(userId);
  return info?.isSpeaking || false;
}

function isParticipantMicMuted(userId: number) {
  const info = getParticipantRtcInfo(userId);
  return info?.isMuted ?? true;
}

async function bootstrapMeetingDrawer() {
  await meetingStore.loadPendingMeetings();

  const queryMeetingId = meetingStore.toMeetingId(route.query.meetingId);
  if (queryMeetingId > 0) {
    await openPendingMeeting(queryMeetingId);
    return;
  }

  if (meetingStore.currentMeetingId && meetingStore.shouldAutoOpenDrawer) {
    const detail = await meetingStore.loadMeetingDetail(
      meetingStore.currentMeetingId
    );
    if (detail?.session.status === 'ACTIVE') {
      meetingStore.openDrawer();
    } else {
      meetingStore.setShouldAutoOpenDrawer(false);
    }
    return;
  }

  if (meetingStore.shouldAutoOpenDrawer) {
    const currentMeeting = await meetingStore.loadCurrentMeeting();
    if (currentMeeting?.session.status === 'ACTIVE') {
      meetingStore.openDrawer();
      return;
    }
    meetingStore.setShouldAutoOpenDrawer(false);
    return;
  }

  meetingStore.setMeetingDetail(null);
}

async function openPendingMeeting(meetingId: number) {
  await meetingStore.enterMeeting(meetingId);
  meetingStore.openDrawer();
}

/**
 * 加入语音会议
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

/**
 * 主持人自动拉起 RTC
 */
async function ensureHostRtcStarted() {
  if (!meetingDetail.value || !isHost.value || isStartingRtc.value) {
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
 * 结束会议
 */
async function handleStopMeeting() {
  const currentMeeting = meetingDetail.value;
  if (!currentMeeting) {
    return;
  }
  const exitingAsHost =
    meetingStore.toNumericId(currentMeeting.session.hostUserId) ===
    meetingStore.toNumericId(currentMeeting.currentUserId);

  await meetingStore.leaveMeeting();
  if (!exitingAsHost) {
    await leaveRoom();
    rtcStore.reset();
    meetingStore.clearMeetingRuntime();
    ElMessage.success(t('meeting.leaveSuccess'));
    return;
  }
  ElMessage.success(t('meeting.endSuccess'));
}

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
        done?.();
        ElMessage.info(t('meeting.backgroundRunning'));
      }
    });
}

function shouldAutoJoinCurrentMeeting() {
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
}

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

function isMicrophoneUnsupportedError(error: unknown) {
  const nextError = error as { name?: string; message?: string };
  return (
    nextError?.name === 'NotFoundError' ||
    nextError?.name === 'NotSupportedError' ||
    /not supported|no audio input|device/i.test(nextError?.message || '')
  );
}

async function retryJoinAfterPermission() {
  if (!waitingMicPermission.value || document.visibilityState !== 'visible') {
    return;
  }
  await handleJoinVoice(true);
}

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

function registerPermissionRetry() {
  void bindPermissionStatusListener();
  if (permissionRetryRegistered) {
    return;
  }
  permissionRetryRegistered = true;
  window.addEventListener('focus', handleWindowFocusRetry);
  document.addEventListener('visibilitychange', handleVisibilityRetry);
}

function clearPermissionRetry() {
  waitingMicPermission.value = false;
  lastJoinAttemptMeetingId.value = null;
}

function handleWindowFocusRetry() {
  void retryJoinAfterPermission();
}

function handleVisibilityRetry() {
  if (document.visibilityState === 'visible') {
    void retryJoinAfterPermission();
  }
}

// 监听转写更新，高亮发言人
watch(
  () =>
    meetingDetail.value?.transcripts[meetingDetail.value.transcripts.length - 1]
      ?.id,
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
    const transcript =
      meetingDetail.value.transcripts[
        meetingDetail.value.transcripts.length - 1
      ];
    pulseSpeaker(meetingStore.toNumericId(transcript?.userId));
  }
);

watch(
  () => meetingDetail.value?.session.id,
  () => {
    hydratedLastTranscriptId.value =
      meetingDetail.value?.transcripts[
        meetingDetail.value.transcripts.length - 1
      ]?.id ?? null;
  },
  { immediate: true }
);

watch(
  () => meetingDetail.value?.session.status,
  async (status, previousStatus) => {
    if (status !== 'ACTIVE') {
      clearPermissionRetry();
    }
    if (previousStatus !== 'ACTIVE' || status !== 'ENDED') {
      return;
    }
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
    if (!meetingDetail.value || !isHost.value) {
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

// 同步 RTC 状态到 Store
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
  await bootstrapMeetingDrawer();
});

onBeforeUnmount(() => {
  if (activeSpeakerTimer) {
    clearTimeout(activeSpeakerTimer);
  }
  if (joinedHighlightTimer) {
    clearTimeout(joinedHighlightTimer);
  }
  if (permissionRetryRegistered) {
    window.removeEventListener('focus', handleWindowFocusRetry);
    document.removeEventListener('visibilitychange', handleVisibilityRetry);
  }
  if (permissionStatus) {
    permissionStatus.onchange = null;
  }
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
    :size="'min(1200px, 96vw)'"
    :title="t('meeting.drawerTitle')"
    custom-class="meeting-drawer"
  >
    <div class="meeting-drawer__body">
      <section class="meeting-hero">
        <div>
          <p class="meeting-hero__eyebrow">{{ t('meeting.heroEyebrow') }}</p>
          <h1>{{ t('meeting.heroTitle') }}</h1>
          <p>
            {{ t('meeting.currentUser') }}：{{ userStore.displayName }}
            <span v-if="meetingDetail">
              · {{ t('meeting.currentMeetingLabel') }}：{{
                meetingDetail.session.title
              }}
            </span>
          </p>
        </div>

        <div class="meeting-hero__actions" v-if="meetingDetail">
          <el-tag
            :type="
              meetingDetail.session.status === 'ACTIVE' ? 'success' : 'info'
            "
          >
            {{
              meetingDetail.session.status === 'ACTIVE'
                ? t('meeting.statusActive')
                : t('meeting.statusEnded')
            }}
          </el-tag>

          <!-- RTC 状态 -->
          <el-tag v-if="isRtcRunning" type="success">
            <el-icon class="is-loading" v-if="isReconnecting">
              <LoaderCircle />
            </el-icon>
            <el-icon v-else-if="isConnected"><Wifi /></el-icon>
            <el-icon v-else><WifiOff /></el-icon>
            {{ isReconnecting ? '重连中' : isConnected ? 'RTC 已连接' : 'RTC 运行中' }}
          </el-tag>

          <el-tag v-if="waitingMicPermission" type="warning">
            {{ t('meeting.waitingMicPermission') }}
          </el-tag>

          <el-tag
            v-if="
              meetingDetail.session.status === 'ACTIVE' &&
              isHost &&
              !isRtcRunning
            "
            type="warning"
          >
            <el-icon class="is-loading">
              <LoaderCircle />
            </el-icon>
            {{ t('meeting.rtcConnecting') }}
          </el-tag>

          <template v-if="meetingDetail.session.status === 'ACTIVE'">
            <el-button
              v-if="!isHost"
              type="danger"
              plain
              @click="handleStopMeeting"
            >
              <el-icon><PhoneOff /></el-icon>
              {{ t('meeting.leaveMeeting') }}
            </el-button>

            <!-- 麦克风控制 -->
            <el-button
              v-if="isConnected"
              :type="isMicEnabled ? 'primary' : 'info'"
              @click="toggleMic"
            >
              <el-icon>
                <Mic v-if="isMicEnabled" />
                <MicOff v-else />
              </el-icon>
              {{ isMicEnabled ? t('meeting.micOn') : t('meeting.micOff') }}
            </el-button>

            <!-- 扬声器控制 -->
            <el-button
              v-if="isConnected"
              :type="isSpeakerMuted ? 'info' : 'primary'"
              plain
              @click="toggleSpeakerMute"
            >
              <el-icon>
                <WifiOff v-if="isSpeakerMuted" />
                <Wifi v-else />
              </el-icon>
              {{ isSpeakerMuted ? t('meeting.unmuteSpeaker') : t('meeting.muteSpeaker') }}
            </el-button>

            <div v-if="isConnected" class="meeting-hero__volume">
              <span>{{ t('meeting.playbackVolume') }}</span>
              <el-slider
                v-model="speakerVolumePercent"
                :max="100"
                :min="0"
                :show-tooltip="false"
              />
            </div>

            <!-- 结束会议 -->
            <el-button
              v-if="canStopMeeting"
              type="danger"
              @click="handleStopMeeting"
            >
              {{ t('meeting.stopMeeting') }}
            </el-button>
          </template>
        </div>
      </section>

      <section v-if="isMeetingEnded" class="meeting-ended-banner">
        <strong>{{ t('meeting.endedBannerTitle') }}</strong>
        <p>{{ t('meeting.endedBannerDescription') }}</p>
      </section>

      <div class="meeting-grid">
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
              <button
                v-for="item in pendingMeetings"
                :key="item.meetingId"
                class="meeting-pending-item"
                @click="openPendingMeeting(item.meetingId)"
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
              </button>
            </div>
          </article>

          <article class="meeting-card" v-if="meetingDetail">
            <div class="meeting-card__header">
              <h2>
                <el-icon><Users /></el-icon>
                {{ t('meeting.participantsTitle') }}
              </h2>
              <span>
                {{
                  t('meeting.participantCount', {
                    count: meetingDetail.participants.length,
                  })
                }}
                <template v-if="rtcParticipants.length">
                  · RTC: {{ rtcParticipants.length }}
                </template>
              </span>
            </div>

            <div class="meeting-participant-list">
              <div
                v-for="participant in meetingDetail.participants"
                :key="participant.id"
                class="meeting-participant-item"
                :class="{
                  'meeting-participant-item--active':
                    activeSpeakerUserId !== null &&
                    meetingStore.toNumericId(participant.userId) ===
                      activeSpeakerUserId,
                  'meeting-participant-item--speaking':
                    isParticipantSpeaking(participant.userId),
                  'meeting-participant-item--joined':
                    joinedHighlightUserId !== null &&
                    meetingStore.toNumericId(participant.userId) ===
                      joinedHighlightUserId,
                  'meeting-participant-item--absent':
                    isParticipantAbsent(participant),
                  'meeting-participant-item--waiting':
                    isParticipantWaiting(participant),
                }"
              >
                <div class="meeting-participant-item__main">
                  <div class="meeting-participant-avatar">
                    <UserAvatarInfo
                      :user-id="participant.userId"
                      :nick-name="participant.nickName || participant.userName"
                      :name="participant.nickName || participant.userName"
                      :subtitle="participant.userName"
                      :size="42"
                    />
                    <div
                      v-if="isParticipantWaiting(participant)"
                      class="meeting-participant-avatar__loading"
                    >
                      <el-icon class="is-loading">
                        <LoaderCircle />
                      </el-icon>
                    </div>
                    <!-- RTC 状态指示器 -->
                    <div
                      v-if="isParticipantInRtc(participant.userId)"
                      class="meeting-participant-avatar__rtc"
                      :class="{
                        'is-speaking': isParticipantSpeaking(participant.userId),
                        'is-muted': isParticipantMicMuted(participant.userId),
                      }"
                    >
                      <el-icon :size="12">
                        <Mic v-if="!isParticipantMicMuted(participant.userId)" />
                        <MicOff v-else />
                      </el-icon>
                    </div>
                  </div>
                </div>

                <div class="meeting-participant-item__meta">
                  <el-tag
                    size="small"
                    :type="participant.isHost === 1 ? 'danger' : 'info'"
                  >
                    {{
                      participant.isHost === 1
                        ? t('meeting.roleHost')
                        : t('meeting.roleMember')
                    }}
                  </el-tag>
                  <el-tag
                    size="small"
                    :type="
                      participantInviteStatusType(participant.inviteStatus)
                    "
                  >
                    {{ participantInviteStatusText(participant.inviteStatus) }}
                  </el-tag>
                  <el-tag
                    size="small"
                    :type="participantMeetingStatusType(participant)"
                  >
                    {{ participantMeetingStatusText(participant) }}
                  </el-tag>
                  <!-- RTC 状态 -->
                  <el-tag
                    v-if="isParticipantInRtc(participant.userId)"
                    size="small"
                    type="success"
                  >
                    {{ isParticipantSpeaking(participant.userId) ? '发言中' : 'RTC' }}
                  </el-tag>
                  <span
                    :class="[
                      'meeting-presence',
                      presenceStore.isUserOnline(participant.userId)
                        ? 'is-online'
                        : 'is-offline',
                    ]"
                  />
                </div>
              </div>
            </div>
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

        <main class="meeting-main">
          <article class="meeting-card" v-if="meetingDetail">
            <div class="meeting-card__header">
              <h2>{{ t('meeting.transcriptTitle') }}</h2>
              <span>
                {{
                  t('meeting.transcriptCount', {
                    count: meetingDetail.transcripts.length,
                  })
                }}
              </span>
            </div>

            <div class="meeting-transcript-list">
              <div
                v-for="item in meetingDetail.transcripts"
                :key="item.id"
                class="meeting-transcript-item"
              >
                <div class="meeting-transcript-item__meta">
                  <strong>{{ item.displayName }}</strong>
                  <small>{{ item.audioStartedAt || item.createTime }}</small>
                </div>
                <p>{{ item.transcriptText }}</p>
              </div>

              <el-empty
                v-if="!meetingDetail.transcripts.length"
                :description="t('meeting.transcriptEmpty')"
              />
            </div>
          </article>

          <article class="meeting-card" v-if="meetingDetail">
            <div class="meeting-card__header">
              <h2>{{ t('meeting.stageSummaryTitle') }}</h2>
              <span>
                {{
                  t('meeting.stageSummaryCount', {
                    count: stageSummaries.length,
                  })
                }}
              </span>
            </div>

            <div class="meeting-summary-list">
              <div
                v-for="item in stageSummaries"
                :key="item.id"
                class="meeting-summary-item"
              >
                <div class="meeting-summary-item__meta">
                  <strong>
                    {{
                      t('meeting.stageSummaryItem', {
                        index: item.summaryIndex,
                      })
                    }}
                  </strong>
                  <small>{{ item.createTime }}</small>
                </div>
                <pre>{{ item.summaryText }}</pre>
              </div>

              <el-empty
                v-if="!stageSummaries.length"
                :description="t('meeting.stageSummaryEmpty')"
              />
            </div>
          </article>

          <article class="meeting-card" v-if="meetingDetail">
            <div class="meeting-card__header">
              <h2>{{ t('meeting.finalSummaryTitle') }}</h2>
              <span>
                {{
                  meetingDetail.session.status === 'ENDED'
                    ? t('meeting.finalSummaryReady')
                    : t('meeting.finalSummaryWaiting')
                }}
              </span>
            </div>

            <pre class="meeting-final-summary"
              >{{ finalSummary || t('meeting.finalSummaryEmpty') }}
            </pre>
          </article>
        </main>
      </div>
    </div>
  </el-drawer>
</template>

<style lang="scss" scoped>
.meeting-drawer__body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-right: 4px;
}

.meeting-hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border-radius: 28px;
  background:
    radial-gradient(
      circle at top left,
      rgba(245, 158, 11, 0.18),
      transparent 28%
    ),
    linear-gradient(135deg, #0f172a, #172554 46%, #164e63);
  color: #f8fafc;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.24);
}

.meeting-hero__eyebrow {
  margin: 0 0 10px;
  color: rgba(255, 255, 255, 0.72);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 12px;
}

.meeting-hero h1 {
  margin: 0 0 10px;
  font-size: 30px;
}

.meeting-hero p {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
}

.meeting-hero__actions {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
}

.meeting-hero__volume {
  min-width: 180px;
  padding: 10px 14px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.28);

  span {
    display: block;
    margin-bottom: 8px;
    color: rgba(255, 255, 255, 0.82);
    font-size: 12px;
  }
}

.meeting-grid {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 20px;
}

.meeting-ended-banner {
  padding: 16px 18px;
  border: 1px solid rgba(249, 115, 22, 0.24);
  border-radius: 20px;
  background: linear-gradient(
    180deg,
    rgba(255, 247, 237, 0.95),
    rgba(255, 255, 255, 0.98)
  );
  color: #9a3412;

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

.meeting-side,
.meeting-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.meeting-card {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 24px;
  padding: 22px;
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.98),
      rgba(248, 250, 252, 0.96)
    ),
    linear-gradient(135deg, rgba(14, 165, 233, 0.06), transparent 30%);
  box-shadow: 0 18px 50px rgba(148, 163, 184, 0.14);
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

.meeting-card__header h2 {
  margin: 0;
  font-size: 18px;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.meeting-pending-list,
.meeting-participant-list,
.meeting-transcript-list,
.meeting-summary-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.meeting-pending-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 18px;
  background: rgba(255, 251, 235, 0.88);
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.meeting-pending-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 30px rgba(245, 158, 11, 0.16);
}

.meeting-participant-item,
.meeting-transcript-item,
.meeting-summary-item {
  padding: 14px 16px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.16);
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
  border-color: rgba(14, 165, 233, 0.45);
  background:
    linear-gradient(135deg, rgba(224, 242, 254, 0.92), rgba(248, 250, 252, 1)),
    #f8fafc;
  box-shadow: 0 14px 28px rgba(14, 165, 233, 0.18);
  transform: translateY(-1px);
}

.meeting-participant-item--speaking {
  border-color: rgba(34, 197, 94, 0.45);
  background:
    linear-gradient(135deg, rgba(220, 252, 231, 0.92), rgba(248, 250, 252, 1)),
    #f8fafc;
  box-shadow: 0 14px 28px rgba(34, 197, 94, 0.18);
}

.meeting-participant-item--joined {
  border-color: rgba(34, 197, 94, 0.4);
  box-shadow: 0 14px 28px rgba(34, 197, 94, 0.16);
}

.meeting-participant-item--waiting {
  background:
    linear-gradient(135deg, rgba(255, 247, 237, 0.98), rgba(248, 250, 252, 1)),
    #f8fafc;
}

.meeting-participant-item--absent {
  border-color: rgba(239, 68, 68, 0.28);
  background:
    linear-gradient(135deg, rgba(254, 226, 226, 0.96), rgba(255, 245, 245, 1)),
    #fff5f5;
  box-shadow: 0 12px 24px rgba(239, 68, 68, 0.08);
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
  color: #f59e0b;
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
  background: #94a3b8;
  color: white;
  border: 2px solid white;

  &.is-speaking {
    background: #22c55e;
    animation: pulse 1.5s infinite;
  }

  &.is-muted {
    background: #ef4444;
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
}

.meeting-participant-item strong,
.meeting-transcript-item strong,
.meeting-summary-item strong {
  display: block;
  color: #0f172a;
}

.meeting-participant-item small,
.meeting-transcript-item small,
.meeting-summary-item small {
  color: #64748b;
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
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.14);
}

.meeting-presence.is-offline {
  background: #94a3b8;
}

.meeting-transcript-item p,
.meeting-summary-item pre,
.meeting-final-summary {
  margin: 10px 0 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  line-height: 1.7;
  color: #1e293b;
}

.meeting-final-summary {
  min-height: 180px;
  padding: 18px;
  border-radius: 20px;
  background: linear-gradient(180deg, #fff7ed, #fff);
  border: 1px solid rgba(249, 115, 22, 0.18);
}

.meeting-error {
  margin: 0;
  color: #b45309;
}

.meeting-empty {
  strong {
    display: block;
    margin-bottom: 8px;
    color: #0f172a;
  }

  p {
    margin: 0;
    color: #64748b;
  }
}

@media (max-width: 1024px) {
  .meeting-grid {
    grid-template-columns: 1fr;
  }

  .meeting-hero {
    flex-direction: column;
  }

  .meeting-hero__volume {
    width: 100%;
  }
}
</style>
