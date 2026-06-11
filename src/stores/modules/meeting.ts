import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { WsMessage } from '@/types/ws';
import type {
  CmsMeetingDetail,
  CmsMeetingPendingInvite,
  CmsMeetingSummary,
  CmsMeetingTranscript,
  CreateMeetingRequest,
  MeetingSelectableUser,
  UploadMeetingAudioRequest,
} from '@/api/modules/meeting.type';
import {
  acceptMeetingApi,
  createMeetingApi,
  getCurrentMeetingApi,
  getMeetingDetailApi,
  getPendingMeetingsApi,
  listMeetingSelectableUsersApi,
  resendFinalSummaryApi,
  stopMeetingApi,
  uploadMeetingAudioApi,
} from '@/api/modules/meeting';

function toMeetingId(value: unknown) {
  const meetingId = Number(value);
  return Number.isNaN(meetingId) ? 0 : meetingId;
}

function toNumericId(value: unknown) {
  const numericId = Number(value);
  return Number.isNaN(numericId) ? 0 : numericId;
}

export const useMeetingStore = defineStore(
  'meeting',
  () => {
    const currentMeetingId = ref<number | null>(null);
    const shouldResumeCapture = ref(false);
    const speakerUserId = ref<number | null>(null);
    const seenPendingInviteIds = ref<number[]>([]);
    const shouldAutoOpenDrawer = ref(false);

    const meetingDetail = ref<CmsMeetingDetail | null>(null);
    const drawerVisible = ref(false);
    const lastJoinedUserId = ref<number | null>(null);
    const pendingMeetings = ref<CmsMeetingPendingInvite[]>([]);
    const selectableUsers = ref<MeetingSelectableUser[]>([]);
    const loading = ref(false);

    const hasActiveMeeting = computed(
      () => meetingDetail.value?.session.status === 'ACTIVE'
    );
    const stageSummaries = computed(() =>
      (meetingDetail.value?.summaries || []).filter(
        (item) => item.summaryType === 'STAGE'
      )
    );
    const finalSummary = computed(
      () =>
        (meetingDetail.value?.summaries || []).find(
          (item) => item.summaryType === 'FINAL'
        )?.summaryText ||
        meetingDetail.value?.session.finalSummary ||
        ''
    );

    function setMeetingDetail(detail: CmsMeetingDetail | null) {
      const previousParticipants =
        detail &&
        toMeetingId(meetingDetail.value?.session.id) ===
          toMeetingId(detail.session.id)
          ? (meetingDetail.value?.participants ?? [])
          : [];

      meetingDetail.value = detail;
      if (!detail) {
        currentMeetingId.value = null;
        lastJoinedUserId.value = null;
        return;
      }

      if (previousParticipants.length > 0) {
        const previousInviteStatusMap = new Map<number, string>();
        previousParticipants.forEach((item) => {
          previousInviteStatusMap.set(
            toNumericId(item.userId),
            item.inviteStatus
          );
        });

        const joinedParticipant = detail.participants.find((item) => {
          const previousInviteStatus = previousInviteStatusMap.get(
            toNumericId(item.userId)
          );
          return (
            previousInviteStatus &&
            previousInviteStatus !== 'ACCEPTED' &&
            item.inviteStatus === 'ACCEPTED'
          );
        });

        if (joinedParticipant) {
          lastJoinedUserId.value = toNumericId(joinedParticipant.userId);
        }
      }

      currentMeetingId.value = toMeetingId(detail.session.id);
      if (detail.session.status !== 'ACTIVE') {
        shouldResumeCapture.value = false;
      }
      if (speakerUserId.value === null) {
        const participant =
          detail.participants.find(
            (item) =>
              toNumericId(item.userId) === toNumericId(detail.currentUserId) &&
              item.inviteStatus === 'ACCEPTED'
          ) || detail.participants[0];
        speakerUserId.value = participant
          ? toNumericId(participant.userId)
          : null;
      }
    }

    function clearMeetingRuntime() {
      shouldResumeCapture.value = false;
      meetingDetail.value = null;
      currentMeetingId.value = null;
      speakerUserId.value = null;
      lastJoinedUserId.value = null;
      shouldAutoOpenDrawer.value = false;
      drawerVisible.value = false;
    }

    function openDrawer() {
      drawerVisible.value = true;
    }

    function closeDrawer() {
      drawerVisible.value = false;
    }

    function clearLastJoinedUserId() {
      lastJoinedUserId.value = null;
    }

    function setShouldAutoOpenDrawer(value: boolean) {
      shouldAutoOpenDrawer.value = value;
    }

    function getCurrentParticipant() {
      if (!meetingDetail.value || meetingDetail.value.currentUserId === null) {
        return null;
      }
      return (
        meetingDetail.value.participants.find(
          (item) =>
            toNumericId(item.userId) ===
            toNumericId(meetingDetail.value?.currentUserId)
        ) || null
      );
    }

    async function loadSelectableUsers() {
      const response = await listMeetingSelectableUsersApi();
      selectableUsers.value = response.data;
      return response.data;
    }

    async function loadPendingMeetings() {
      const response = await getPendingMeetingsApi();
      pendingMeetings.value = response.data;
      const pendingIds = new Set(response.data.map((item) => item.meetingId));
      seenPendingInviteIds.value = seenPendingInviteIds.value.filter((id) =>
        pendingIds.has(id)
      );
      return response.data;
    }

    function buildPendingInviteMessages() {
      const freshMeetings = pendingMeetings.value.filter(
        (item) => !seenPendingInviteIds.value.includes(item.meetingId)
      );
      seenPendingInviteIds.value = [
        ...seenPendingInviteIds.value,
        ...freshMeetings.map((item) => item.meetingId),
      ];
      return freshMeetings.map(
        (item): WsMessage => ({
          type: 'notice',
          title: '会议邀请',
          text: `${item.hostNickName || item.hostUserName} 邀请你加入会议《${item.title}》`,
          path: '/meeting-assistant',
          params: { meetingId: String(item.meetingId) },
          data: item,
        })
      );
    }

    async function createMeeting(payload: CreateMeetingRequest) {
      loading.value = true;
      try {
        const response = await createMeetingApi(payload);
        setMeetingDetail(response.data);
        shouldResumeCapture.value = true;
        shouldAutoOpenDrawer.value = response.data.session.status === 'ACTIVE';
        await loadPendingMeetings();
        return response.data;
      } finally {
        loading.value = false;
      }
    }

    async function loadCurrentMeeting() {
      const response = await getCurrentMeetingApi();
      setMeetingDetail(response.data);
      return response.data;
    }

    async function loadMeetingDetail(meetingId: number) {
      const response = await getMeetingDetailApi(meetingId);
      setMeetingDetail(response.data);
      return response.data;
    }

    async function enterMeeting(meetingId: number) {
      const detail = await loadMeetingDetail(meetingId);
      const currentParticipant =
        detail.participants.find(
          (item) =>
            toNumericId(item.userId) === toNumericId(detail.currentUserId)
        ) || null;
      if (currentParticipant?.inviteStatus === 'PENDING') {
        const accepted = await acceptMeeting(meetingId);
        shouldResumeCapture.value = true;
        shouldAutoOpenDrawer.value = accepted.session.status === 'ACTIVE';
        await loadPendingMeetings();
        return accepted;
      }
      shouldResumeCapture.value = detail.session.status === 'ACTIVE';
      shouldAutoOpenDrawer.value = detail.session.status === 'ACTIVE';
      return detail;
    }

    async function acceptMeeting(meetingId: number) {
      const response = await acceptMeetingApi(meetingId);
      setMeetingDetail(response.data);
      shouldResumeCapture.value = response.data.session.status === 'ACTIVE';
      shouldAutoOpenDrawer.value = response.data.session.status === 'ACTIVE';
      pendingMeetings.value = pendingMeetings.value.filter(
        (item) => item.meetingId !== meetingId
      );
      seenPendingInviteIds.value = seenPendingInviteIds.value.filter(
        (item) => item !== meetingId
      );
      return response.data;
    }

    async function stopMeeting() {
      if (!currentMeetingId.value) {
        return null;
      }
      const response = await stopMeetingApi(currentMeetingId.value);
      setMeetingDetail(response.data);
      shouldResumeCapture.value = false;
      return response.data;
    }

    async function resendFinalSummary() {
      if (!currentMeetingId.value) {
        return null;
      }
      const response = await resendFinalSummaryApi(currentMeetingId.value);
      setMeetingDetail(response.data);
      return response.data;
    }

    async function uploadAudio(payload: UploadMeetingAudioRequest) {
      if (!currentMeetingId.value) {
        return null;
      }
      const response = await uploadMeetingAudioApi(
        currentMeetingId.value,
        payload
      );
      if (response.data) {
        upsertTranscript(response.data);
      }
      return response.data;
    }

    function upsertTranscript(transcript: CmsMeetingTranscript) {
      if (
        !meetingDetail.value ||
        toMeetingId(meetingDetail.value.session.id) !==
          toMeetingId(transcript.meetingId)
      ) {
        return;
      }
      const transcripts = meetingDetail.value.transcripts;
      const index = transcripts.findIndex(
        (item) => toNumericId(item.id) === toNumericId(transcript.id)
      );
      if (index >= 0) {
        transcripts.splice(index, 1, transcript);
        return;
      }
      transcripts.push(transcript);
    }

    function upsertSummary(summary: CmsMeetingSummary) {
      if (
        !meetingDetail.value ||
        toMeetingId(meetingDetail.value.session.id) !==
          toMeetingId(summary.meetingId)
      ) {
        return;
      }
      const summaries = meetingDetail.value.summaries;
      const index = summaries.findIndex(
        (item) => toNumericId(item.id) === toNumericId(summary.id)
      );
      if (index >= 0) {
        summaries.splice(index, 1, summary);
        return;
      }
      summaries.push(summary);
    }

    function consumeWsMessage(message: WsMessage) {
      if (!message.type) {
        return;
      }
      if (message.type === 'meeting_state' && message.data) {
        const detail = message.data as CmsMeetingDetail;
        if (
          currentMeetingId.value === null ||
          toMeetingId(currentMeetingId.value) === toMeetingId(detail.session.id)
        ) {
          setMeetingDetail(detail);
        }
        return;
      }
      if (message.type === 'meeting_transcript' && message.data) {
        upsertTranscript(message.data as CmsMeetingTranscript);
        return;
      }
      if (message.type === 'meeting_stage_summary' && message.data) {
        upsertSummary(message.data as CmsMeetingSummary);
        return;
      }
      if (message.type === 'meeting_final_summary' && message.data) {
        setMeetingDetail(message.data as CmsMeetingDetail);
        shouldResumeCapture.value = false;
        shouldAutoOpenDrawer.value = false;
        return;
      }
      if (message.type === 'meeting_closed' && message.data) {
        setMeetingDetail(message.data as CmsMeetingDetail);
        shouldResumeCapture.value = false;
        shouldAutoOpenDrawer.value = false;
      }
    }

    function setSpeakerUserId(value: number | null) {
      speakerUserId.value = value;
    }

    function setShouldResumeCapture(value: boolean) {
      shouldResumeCapture.value = value;
    }

    function currentSpeakerName() {
      if (!meetingDetail.value || speakerUserId.value === null) {
        return '';
      }
      const participant = meetingDetail.value.participants.find(
        (item) => item.userId === speakerUserId.value
      );
      return participant?.nickName || participant?.userName || '';
    }

    return {
      currentMeetingId,
      shouldResumeCapture,
      speakerUserId,
      shouldAutoOpenDrawer,
      meetingDetail,
      drawerVisible,
      lastJoinedUserId,
      pendingMeetings,
      selectableUsers,
      loading,
      hasActiveMeeting,
      stageSummaries,
      finalSummary,
      getCurrentParticipant,
      setMeetingDetail,
      clearMeetingRuntime,
      openDrawer,
      closeDrawer,
      clearLastJoinedUserId,
      setShouldAutoOpenDrawer,
      loadSelectableUsers,
      loadPendingMeetings,
      buildPendingInviteMessages,
      createMeeting,
      loadCurrentMeeting,
      loadMeetingDetail,
      enterMeeting,
      acceptMeeting,
      stopMeeting,
      resendFinalSummary,
      uploadAudio,
      upsertTranscript,
      upsertSummary,
      consumeWsMessage,
      setSpeakerUserId,
      setShouldResumeCapture,
      currentSpeakerName,
      toMeetingId,
      toNumericId,
    };
  },
  {
    persist: {
      pick: [
        'currentMeetingId',
        'shouldResumeCapture',
        'speakerUserId',
        'seenPendingInviteIds',
        'shouldAutoOpenDrawer',
      ],
    },
  }
);
