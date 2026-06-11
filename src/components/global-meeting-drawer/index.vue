<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { LoaderCircle, Mic, PauseCircle } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import UserAvatarInfo from '@/components/user-avatar-info/index.vue';
import { useMeetingStore, usePresenceStore, useUserStore } from '@/stores';

type RecordingBuffers = Float32Array[];
const AUDIO_CHUNK_INTERVAL_MS = 8000;

const route = useRoute();
const { t } = useI18n();
const meetingStore = useMeetingStore();
const userStore = useUserStore();
const presenceStore = usePresenceStore();

const isRecording = ref(false);
const captureError = ref('');
const activeSpeakerUserId = ref<number | null>(null);
const joinedHighlightUserId = ref<number | null>(null);
const hydratedLastTranscriptId = ref<number | null>(null);
const isUploadingChunk = ref(false);

let mediaStream: MediaStream | null = null;
let audioContext: AudioContext | null = null;
let sourceNode: MediaStreamAudioSourceNode | null = null;
let processorNode: ScriptProcessorNode | null = null;
let silentGainNode: GainNode | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let pcmBuffers: RecordingBuffers = [];
let chunkStartedAtMs = 0;
let activeSpeakerTimer: ReturnType<typeof setTimeout> | null = null;
let joinedHighlightTimer: ReturnType<typeof setTimeout> | null = null;

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

const participantOptions = computed(() =>
  (meetingDetail.value?.participants || []).map((item) => ({
    label: item.nickName || item.userName,
    value: item.userId,
  }))
);

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

const currentSpeakerUserId = computed({
  get: () => meetingStore.speakerUserId,
  set: (value) => meetingStore.setSpeakerUserId(value),
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

async function startRecording(autoResume = false) {
  captureError.value = '';
  if (!navigator.mediaDevices?.getUserMedia) {
    captureError.value = t('meeting.browserUnsupported');
    if (!autoResume) {
      ElMessage.error(captureError.value);
    }
    return;
  }

  if (!meetingDetail.value || meetingDetail.value.session.status !== 'ACTIVE') {
    return;
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    audioContext = new AudioContext();
    sourceNode = audioContext.createMediaStreamSource(mediaStream);
    processorNode = audioContext.createScriptProcessor(4096, 1, 1);
    silentGainNode = audioContext.createGain();
    silentGainNode.gain.value = 0;
    pcmBuffers = [];
    chunkStartedAtMs = Date.now();

    processorNode.onaudioprocess = (event) => {
      const channelData = event.inputBuffer.getChannelData(0);
      pcmBuffers.push(new Float32Array(channelData));
    };

    sourceNode.connect(processorNode);
    processorNode.connect(silentGainNode);
    silentGainNode.connect(audioContext.destination);
    flushTimer = setInterval(() => {
      void flushAudioChunk();
    }, AUDIO_CHUNK_INTERVAL_MS);
    isRecording.value = true;
    meetingStore.setShouldResumeCapture(true);
  } catch (error: any) {
    captureError.value = error?.message || t('meeting.autoResumeBlocked');
    if (!autoResume) {
      ElMessage.warning(captureError.value);
    }
    meetingStore.setShouldResumeCapture(false);
  }
}

async function flushAudioChunk(force = false) {
  if (!audioContext || pcmBuffers.length === 0 || !meetingDetail.value) {
    return;
  }
  if (isUploadingChunk.value) {
    return;
  }

  const endedAtMs = Date.now();
  if (!force && endedAtMs - chunkStartedAtMs < AUDIO_CHUNK_INTERVAL_MS - 200) {
    return;
  }

  const merged = mergeBuffers(pcmBuffers);
  pcmBuffers = [];
  const wavBlob = encodeWav(merged, audioContext.sampleRate);
  const speakerId = currentSpeakerUserId.value;
  const speakerName =
    participantOptions.value.find((item) => item.value === speakerId)?.label ||
    userStore.displayName;

  try {
    isUploadingChunk.value = true;
    await meetingStore.uploadAudio({
      file: wavBlob,
      speakerUserId: speakerId,
      speakerDisplayName: speakerName,
      audioStartedAtMs: chunkStartedAtMs,
      audioEndedAtMs: endedAtMs,
    });
    pulseSpeaker(speakerId);
  } catch (error: any) {
    captureError.value = error?.message || t('meeting.audioUploadFailed');
  } finally {
    isUploadingChunk.value = false;
  }

  chunkStartedAtMs = Date.now();
}

async function stopRecording(options?: {
  clearResumeFlag?: boolean;
  flushPendingChunk?: boolean;
}) {
  const clearResumeFlag = options?.clearResumeFlag ?? true;
  const flushPendingChunk = options?.flushPendingChunk ?? true;

  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }

  if (flushPendingChunk) {
    await flushAudioChunk(true);
  }
  processorNode?.disconnect();
  sourceNode?.disconnect();
  silentGainNode?.disconnect();

  if (audioContext && audioContext.state !== 'closed') {
    await audioContext.close();
  }

  mediaStream?.getTracks().forEach((track) => track.stop());
  mediaStream = null;
  audioContext = null;
  sourceNode = null;
  processorNode = null;
  silentGainNode = null;
  pcmBuffers = [];
  isRecording.value = false;

  if (clearResumeFlag) {
    meetingStore.setShouldResumeCapture(false);
  }
}

async function handleStopMeeting() {
  await stopRecording({ clearResumeFlag: false, flushPendingChunk: true });
  await meetingStore.stopMeeting();
  ElMessage.success(t('meeting.endSuccess'));
}

function mergeBuffers(buffers: RecordingBuffers) {
  const totalLength = buffers.reduce((sum, item) => sum + item.length, 0);
  const merged = new Float32Array(totalLength);
  let offset = 0;

  for (const buffer of buffers) {
    merged.set(buffer, offset);
    offset += buffer.length;
  }

  return merged;
}

function encodeWav(samples: Float32Array, sampleRate: number) {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) {
    const normalized = Math.max(-1, Math.min(1, samples[i]));
    pcm[i] = normalized < 0 ? normalized * 0x8000 : normalized * 0x7fff;
  }

  const buffer = new ArrayBuffer(44 + pcm.length * 2);
  const view = new DataView(buffer);
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcm.length * 2, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, pcm.length * 2, true);

  let offset = 44;
  for (let i = 0; i < pcm.length; i += 1) {
    view.setInt16(offset, pcm[i], true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

async function handleDrawerAttemptClose(done?: () => void) {
  if (!meetingDetail.value || meetingDetail.value.session.status !== 'ACTIVE') {
    done?.();
    return;
  }

  try {
    await ElMessageBox.confirm(
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
    );
    await stopRecording({ clearResumeFlag: true, flushPendingChunk: true });
    meetingStore.clearMeetingRuntime();
    done?.();
  } catch (action: any) {
    if (action === 'cancel') {
      done?.();
      ElMessage.info(t('meeting.backgroundRunning'));
    }
  }
}

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
  () => meetingStore.shouldResumeCapture,
  async (value) => {
    if (
      value &&
      meetingDetail.value?.session.status === 'ACTIVE' &&
      !isRecording.value
    ) {
      await startRecording(true);
      return;
    }

    if (!value && isRecording.value) {
      await stopRecording({
        clearResumeFlag: false,
        flushPendingChunk: false,
      });
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

onMounted(async () => {
  await bootstrapMeetingDrawer();
  if (
    meetingStore.shouldResumeCapture &&
    meetingDetail.value?.session.status === 'ACTIVE'
  ) {
    await startRecording(true);
  }
});

onBeforeUnmount(() => {
  if (activeSpeakerTimer) {
    clearTimeout(activeSpeakerTimer);
  }
  if (joinedHighlightTimer) {
    clearTimeout(joinedHighlightTimer);
  }
  void stopRecording({ clearResumeFlag: false, flushPendingChunk: false });
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

          <template v-if="meetingDetail.session.status === 'ACTIVE'">
            <el-button
              v-if="!isRecording"
              type="primary"
              @click="startRecording()"
            >
              <el-icon><Mic /></el-icon>
              {{ t('meeting.startRecording') }}
            </el-button>

            <el-button v-if="isRecording" @click="stopRecording">
              <el-icon><PauseCircle /></el-icon>
              {{ t('meeting.pauseRecording') }}
            </el-button>

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
              <h2>{{ t('meeting.participantsTitle') }}</h2>
              <span>
                {{
                  t('meeting.participantCount', {
                    count: meetingDetail.participants.length,
                  })
                }}
              </span>
            </div>

            <el-form
              v-if="meetingDetail.session.status === 'ACTIVE'"
              label-position="top"
            >
              <el-form-item :label="t('meeting.currentSpeaker')">
                <el-select
                  v-model="currentSpeakerUserId"
                  :placeholder="t('meeting.selectCurrentSpeaker')"
                >
                  <el-option
                    v-for="item in participantOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-form>

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
          <article class="meeting-card" v-if="captureError">
            <div class="meeting-card__header">
              <h2>{{ t('meeting.recordingNotice') }}</h2>
            </div>
            <p class="meeting-error">{{ captureError }}</p>
          </article>

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
}
</style>
