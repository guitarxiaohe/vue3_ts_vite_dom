import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { WsMessage } from '@/types/ws';
import type {
  CmsMeetingDetail,
  CmsMeetingInteraction,
  CmsMeetingPendingInvite,
  CmsMeetingSummary,
  CmsMeetingTranscript,
  CreateMeetingRequest,
  MeetingScreenCameraState,
  MeetingScreenShareState,
  MeetingSelectableUser,
  PendingTranscript,
  SendMeetingInteractionRequest,
  UploadMeetingAudioRequest,
} from '@/api/modules/meeting.type';
import {
  acceptMeetingApi,
  createMeetingApi,
  declineMeetingApi,
  getCurrentMeetingApi,
  getMeetingDetailApi,
  getPendingMeetingsApi,
  inviteMeetingParticipantsApi,
  leaveMeetingApi,
  listMeetingSelectableUsersApi,
  resendFinalSummaryApi,
  sendMeetingInteractionApi,
  stopMeetingApi,
  uploadMeetingAudioApi,
} from '@/api/modules/meeting';
import {
  claimMeetingRtcOwner,
  ensureMeetingClientId,
  readMeetingRtcOwner,
  releaseMeetingRtcOwner,
} from '@/utils/meeting-cross-window';

/******************************** 类型定义 ********************************/

type MeetingTranscriptBlockKind = 'speaker' | 'pending';

/** 转写块（用于 UI 渲染，合并 final + pending） */
export interface MeetingTranscriptBlock {
  /** 唯一标识，final 转写为 `transcript-{id}`，pending 为 `pending-{participantIdentity}` */
  id: string;
  /** 类型：'speaker' 已确认转写 | 'pending' 流式进行中 */
  kind: MeetingTranscriptBlockKind;
  /** 说话人标签，如 "张三提到" / "张三补充" */
  label: string;
  /** 转写文本内容 */
  text: string;
  /** 音频开始时间戳（毫秒），用于排序 */
  timestamp: number;
  /** 是否为流式进行中的转写（partial result） */
  pending?: boolean;
}

/** 流式 AI 摘要草稿 */
interface MeetingLiveSummaryDraft {
  meetingId: string;
  summaryText: string;
  sourceTranscriptCount?: number;
  updatedAt?: string | null;
}

type MeetingLiveSummaryStatus = 'empty' | 'streaming' | 'ready';

/******************************** 工具函数 ********************************/

/** 安全转换为会议 ID 字符串，null/undefined 返回空字符串 */
function toMeetingId(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

/** 安全转换为用户 ID 字符串，null/undefined 返回空字符串 */
function toNumericId(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

/** 解析时间字符串为毫秒时间戳，无效返回 0 */
function toTimestamp(value: string | null | undefined) {
  if (!value) {
    return 0;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

/** 去除首尾空白，null/undefined 返回空字符串 */
function normalizeNarrativeText(value: string | null | undefined) {
  return (value || '').trim();
}

/** 生成转写块的说话人标签，如 "张三提到" / "张三补充" */
function createSpeakerNarrativeLabel(
  displayName: string | null | undefined,
  isPending = false
) {
  const safeDisplayName = normalizeNarrativeText(displayName) || '参会人';
  return `${safeDisplayName}${isPending ? '补充' : '提到'}`;
}

function isActiveStatus(status: string | null | undefined) {
  return status === 'ACTIVE';
}

function isTerminalStatus(status: string | null | undefined) {
  return (
    status === 'CLOSED_SUCCESS' ||
    status === 'CLOSE_FAILED' ||
    status === 'ENDED'
  );
}

/******************************** 数据转换 ********************************/

/** 合并 final transcript 和 pending transcript，按时间排序生成渲染用的 blocks */
function createTranscriptBlocks(
  detail: CmsMeetingDetail | null,
  pendingTranscripts: Record<string, PendingTranscript>
) {
  if (!detail) {
    return [] as MeetingTranscriptBlock[];
  }

  const blocks: MeetingTranscriptBlock[] = [];
  const transcripts = detail.transcripts ?? [];

  // 已确认的转写
  transcripts.forEach((item) => {
    const text = normalizeNarrativeText(item.transcriptText);
    if (!text) {
      return;
    }
    blocks.push({
      id: `transcript-${item.id}`,
      kind: 'speaker',
      label: createSpeakerNarrativeLabel(item.displayName),
      text,
      timestamp: toTimestamp(item.audioStartedAt || item.createTime),
    });
  });

  // 流式进行中的转写（partial result）
  Object.entries(pendingTranscripts).forEach(([participantIdentity, item]) => {
    const text = normalizeNarrativeText(item.transcriptText);
    if (!text) {
      return;
    }
    blocks.push({
      id: `pending-${participantIdentity}`,
      kind: 'pending',
      label: createSpeakerNarrativeLabel(item.displayName, true),
      text,
      timestamp: toTimestamp(item.audioStartedAt || item.audioEndedAt),
      pending: true,
    });
  });

  // 同时间戳时 speaker 优先于 pending
  const orderWeight: Record<MeetingTranscriptBlockKind, number> = {
    speaker: 1,
    pending: 2,
  };

  return blocks.sort((left, right) => {
    if (left.timestamp !== right.timestamp) {
      return left.timestamp - right.timestamp;
    }
    return orderWeight[left.kind] - orderWeight[right.kind];
  });
}

/** 获取最新的已持久化摘要（优先 FINAL，其次 STAGE） */
function getLatestPersistedSummary(detail: CmsMeetingDetail | null) {
  if (!detail) {
    return null as {
      text: string;
      updatedAt: string | null;
      source: 'stage' | 'final';
    } | null;
  }

  const summaries = detail.summaries ?? [];

  // 优先取最新的 FINAL 摘要
  const latestFinalSummary = [...summaries]
    .filter((item) => item.summaryType === 'FINAL')
    .sort((left, right) => {
      if ((left.summaryIndex ?? 0) !== (right.summaryIndex ?? 0)) {
        return (right.summaryIndex ?? 0) - (left.summaryIndex ?? 0);
      }
      return toTimestamp(right.createTime) - toTimestamp(left.createTime);
    })[0];
  const finalSummaryText =
    normalizeNarrativeText(latestFinalSummary?.summaryText) ||
    normalizeNarrativeText(detail.session.finalSummary);
  if (finalSummaryText) {
    return {
      text: finalSummaryText,
      updatedAt:
        latestFinalSummary?.createTime ||
        detail.session.endedAt ||
        detail.session.updateTime ||
        detail.session.createTime,
      source: 'final' as const,
    };
  }

  // 回退到最新的 STAGE 摘要
  const latestStageSummary = [...summaries]
    .filter((item) => item.summaryType === 'STAGE')
    .sort((left, right) => {
      if ((left.summaryIndex ?? 0) !== (right.summaryIndex ?? 0)) {
        return (right.summaryIndex ?? 0) - (left.summaryIndex ?? 0);
      }
      return toTimestamp(right.createTime) - toTimestamp(left.createTime);
    })[0];
  const stageSummaryText = normalizeNarrativeText(
    latestStageSummary?.summaryText
  );
  if (!stageSummaryText) {
    return null;
  }
  return {
    text: stageSummaryText,
    updatedAt: latestStageSummary?.createTime || null,
    source: 'stage' as const,
  };
}

/** 标准化会议详情：同一会议时保留旧的 participants/transcripts/summaries 避免闪烁 */
function normalizeMeetingDetail(
  detail: CmsMeetingDetail | null,
  previousDetail: CmsMeetingDetail | null
) {
  if (!detail) {
    return null;
  }

  const isSameMeeting =
    toMeetingId(previousDetail?.session.id) === toMeetingId(detail.session.id);
  const previousTranscripts = isSameMeeting
    ? (previousDetail?.transcripts ?? [])
    : [];
  const previousSummaries = isSameMeeting
    ? (previousDetail?.summaries ?? [])
    : [];
  const previousParticipants = isSameMeeting
    ? (previousDetail?.participants ?? [])
    : [];
  const fallbackCurrentUserId =
    detail.currentUserId ??
    (isSameMeeting ? (previousDetail?.currentUserId ?? null) : null);

  return {
    ...detail,
    participants: detail.participants ?? previousParticipants,
    transcripts: detail.transcripts ?? previousTranscripts,
    summaries: detail.summaries ?? previousSummaries,
    currentUserId: fallbackCurrentUserId,
  };
}

/******************************** Store 定义 ********************************/

export const useMeetingStore = defineStore(
  'meeting',
  () => {
    /******************************** 持久化状态 ********************************/

    const currentMeetingId = ref<string | null>(null);
    const shouldResumeCapture = ref(false);
    const speakerUserId = ref<string | null>(null);
    const seenPendingInviteIds = ref<string[]>([]);
    const shouldAutoOpenDrawer = ref(false);
    const meetingClientId = ref(ensureMeetingClientId(sessionStorage));
    const rtcOwnerClientId = ref<string | null>(null);
    const rtcOwnerMeetingId = ref<string | null>(null);

    /******************************** 运行时状态 ********************************/

    const meetingDetail = ref<CmsMeetingDetail | null>(null);
    const drawerVisible = ref(false);
    const lastJoinedUserId = ref<string | null>(null);
    const pendingMeetings = ref<CmsMeetingPendingInvite[]>([]);
    const selectableUsers = ref<MeetingSelectableUser[]>([]);
    const loading = ref(false);

    /** 流式 ASR 进行中的转写，按 participantIdentity 索引 */
    const pendingTranscripts = ref<Record<string, PendingTranscript>>({});
    const liveSummaryDraft = ref<MeetingLiveSummaryDraft | null>(null);
    /** 互动聊天历史，按当前会议生命周期保留 */
    const interactionMessages = ref<CmsMeetingInteraction[]>([]);
    const interactionBubbles = ref<Record<string, CmsMeetingInteraction>>({});
    const screenShareState = ref<MeetingScreenShareState | null>(null);
    const screenCameraState = ref<MeetingScreenCameraState | null>(null);
    const interactionBubbleTimers = new Map<
      string,
      ReturnType<typeof setTimeout>
    >();

    /******************************** 计算属性 ********************************/

    /** 是否有进行中的会议（ACTIVE期间仍允许查看） */
    const hasActiveMeeting = computed(() =>
      isActiveStatus(meetingDetail.value?.session.status)
    );

    /** 所有阶段摘要列表 */
    const stageSummaries = computed(() =>
      (meetingDetail.value?.summaries || []).filter(
        (item) => item.summaryType === 'STAGE'
      )
    );

    /** 合并后的转写块列表（final + pending，按时间排序） */
    const liveTranscriptBlocks = computed(() =>
      createTranscriptBlocks(meetingDetail.value, pendingTranscripts.value)
    );

    /** 最终摘要文本 */
    const finalSummary = computed(
      () =>
        (meetingDetail.value?.summaries || []).find(
          (item) => item.summaryType === 'FINAL'
        )?.summaryText ||
        meetingDetail.value?.session.finalSummary ||
        ''
    );

    /** 实时摘要文本（流式草稿 > 已持久化摘要） */
    const liveSummaryText = computed(() => {
      const persisted = getLatestPersistedSummary(meetingDetail.value);
      const draftText = normalizeNarrativeText(
        liveSummaryDraft.value?.summaryText
      );
      if (
        isTerminalStatus(meetingDetail.value?.session.status) &&
        persisted?.source === 'final'
      ) {
        return persisted.text;
      }
      return draftText || persisted?.text || '';
    });

    /** 实时摘要更新时间 */
    const liveSummaryUpdatedAt = computed(() => {
      const persisted = getLatestPersistedSummary(meetingDetail.value);
      if (
        isTerminalStatus(meetingDetail.value?.session.status) &&
        persisted?.source === 'final'
      ) {
        return persisted.updatedAt || null;
      }
      return liveSummaryDraft.value?.updatedAt || persisted?.updatedAt || null;
    });

    /** 实时摘要状态：empty / streaming / ready */
    const liveSummaryStatus = computed<MeetingLiveSummaryStatus>(() => {
      if (!liveSummaryText.value) {
        return 'empty';
      }
      return isTerminalStatus(meetingDetail.value?.session.status)
        ? 'ready'
        : 'streaming';
    });

    /******************************** 会议详情管理 ********************************/

    /** 设置会议详情，处理新参会者高亮、状态同步等 */
    function setMeetingDetail(detail: CmsMeetingDetail | null) {
      const previousMeetingId = toMeetingId(meetingDetail.value?.session.id);
      detail = normalizeMeetingDetail(detail, meetingDetail.value);

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
        liveSummaryDraft.value = null;
        clearInteractionBubbles();
        return;
      }
      // 切换会议或会议结束时清除摘要草稿
      if (toMeetingId(detail.session.id) !== previousMeetingId) {
        liveSummaryDraft.value = null;
        clearInteractionBubbles();
      }
      if (isTerminalStatus(detail.session.status)) {
        liveSummaryDraft.value = null;
        screenShareState.value = null;
      }
      if (previousParticipants.length > 0) {
        const previousInviteStatusMap = new Map<string, string>();
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
      if (!isActiveStatus(detail.session.status)) {
        shouldResumeCapture.value = false;
        shouldAutoOpenDrawer.value = false;
      }
      // 默认选中当前用户作为发言人
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

    /** 清除所有会议运行时状态 */
    function clearMeetingRuntime() {
      shouldResumeCapture.value = false;
      meetingDetail.value = null;
      currentMeetingId.value = null;
      speakerUserId.value = null;
      lastJoinedUserId.value = null;
      clearInteractionBubbles();
      shouldAutoOpenDrawer.value = false;
      drawerVisible.value = false;
      pendingTranscripts.value = {};
      liveSummaryDraft.value = null;
      screenShareState.value = null;
      releaseRtcOwnership();
    }

    /******************************** 抽屉控制 ********************************/

    function openDrawer() {
      drawerVisible.value = true;
      shouldAutoOpenDrawer.value = true;
    }

    function closeDrawer() {
      drawerVisible.value = false;
    }

    function hideDrawerToBackground() {
      drawerVisible.value = false;
      shouldAutoOpenDrawer.value = false;
    }

    function clearLastJoinedUserId() {
      lastJoinedUserId.value = null;
    }

    function setShouldAutoOpenDrawer(value: boolean) {
      shouldAutoOpenDrawer.value = value;
    }

    /******************************** 参会者查询 ********************************/

    /** 获取当前用户在会议中的参会者记录 */
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

    /******************************** 数据加载 ********************************/

    /** 加载可邀请的用户列表 */
    async function loadSelectableUsers() {
      const response = await listMeetingSelectableUsersApi();
      selectableUsers.value = response.data;
      return response.data;
    }

    /** 加载待处理的会议邀请列表 */
    async function loadPendingMeetings() {
      const response = await getPendingMeetingsApi();
      pendingMeetings.value = response.data;
      const pendingIds = new Set(response.data.map((item) => item.meetingId));
      seenPendingInviteIds.value = seenPendingInviteIds.value.filter((id) =>
        pendingIds.has(id)
      );
      return response.data;
    }

    /** 将未见过的待处理邀请转为 WsMessage 格式（用于弹出通知） */
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
          path: '/external-meeting',
          params: { meetingId: String(item.meetingId) },
          data: item,
        })
      );
    }

    /** 更新或插入待处理邀请（WebSocket 实时推送时调用） */
    function upsertPendingMeeting(invite: CmsMeetingPendingInvite) {
      const index = pendingMeetings.value.findIndex(
        (item) => item.meetingId === invite.meetingId
      );
      if (index >= 0) {
        pendingMeetings.value.splice(index, 1, invite);
        return;
      }
      pendingMeetings.value.unshift(invite);
    }

    /******************************** 会议生命周期 ********************************/

    /** 创建会议 */
    async function createMeeting(payload: CreateMeetingRequest) {
      loading.value = true;
      try {
        const response = await createMeetingApi(payload);
        setMeetingDetail(response.data);
        shouldResumeCapture.value = true;
        shouldAutoOpenDrawer.value = isActiveStatus(
          response.data.session.status
        );
        if (isActiveStatus(response.data.session.status)) {
          claimRtcOwnership(response.data.session.id);
        }
        await loadPendingMeetings();
        return response.data;
      } finally {
        loading.value = false;
      }
    }

    /** 加载当前进行中的会议 */
    async function loadCurrentMeeting() {
      const response = await getCurrentMeetingApi();
      setMeetingDetail(response.data);
      const detail = response.data;
      if (detail && isActiveStatus(detail.session.status)) {
        const currentParticipant =
          detail.participants.find(
            (item) =>
              toNumericId(item.userId) === toNumericId(detail.currentUserId)
          ) || null;
        if (currentParticipant?.inviteStatus === 'ACCEPTED') {
          shouldResumeCapture.value = true;
        }
      }
      syncRtcOwnershipFromStorage();
      return response.data;
    }

    /** 按 ID 加载会议详情 */
    async function loadMeetingDetail(meetingId: string) {
      const response = await getMeetingDetailApi(meetingId);
      setMeetingDetail(response.data);
      return response.data;
    }

    /** 进入会议：加载详情，未接受时自动接受 */
    async function enterMeeting(meetingId: string) {
      const detail = await loadMeetingDetail(meetingId);
      const currentParticipant =
        detail.participants.find(
          (item) =>
            toNumericId(item.userId) === toNumericId(detail.currentUserId)
        ) || null;

      if (
        currentParticipant &&
        currentParticipant.inviteStatus !== 'ACCEPTED' &&
        isActiveStatus(detail.session.status)
      ) {
        console.log('currentParticipant ==>');

        const accepted = await acceptMeeting(meetingId);
        shouldResumeCapture.value = true;
        shouldAutoOpenDrawer.value = isActiveStatus(accepted.session.status);
        if (isActiveStatus(accepted.session.status)) {
          claimRtcOwnership(accepted.session.id);
        }
        await loadPendingMeetings();
        return accepted;
      }
      shouldResumeCapture.value = isActiveStatus(detail.session.status);
      shouldAutoOpenDrawer.value = isActiveStatus(detail.session.status);
      if (isActiveStatus(detail.session.status)) {
        claimRtcOwnership(detail.session.id);
      }
      return detail;
    }

    /** 接受会议邀请 */
    async function acceptMeeting(meetingId: string) {
      const response = await acceptMeetingApi(meetingId);
      setMeetingDetail(response.data);
      shouldResumeCapture.value = isActiveStatus(response.data.session.status);
      shouldAutoOpenDrawer.value = isActiveStatus(response.data.session.status);
      if (isActiveStatus(response.data.session.status)) {
        claimRtcOwnership(response.data.session.id);
      }
      // 从待处理列表中移除
      pendingMeetings.value = pendingMeetings.value.filter(
        (item) => item.meetingId !== meetingId
      );
      seenPendingInviteIds.value = seenPendingInviteIds.value.filter(
        (item) => item !== meetingId
      );
      return response.data;
    }

    /** 拒绝会议邀请，从待处理列表中移除 */
    async function declineMeeting(meetingId: string) {
      const response = await declineMeetingApi(meetingId);
      pendingMeetings.value = pendingMeetings.value.filter(
        (item) => item.meetingId !== meetingId
      );
      seenPendingInviteIds.value = seenPendingInviteIds.value.filter(
        (item) => item !== meetingId
      );
      if (
        toMeetingId(meetingDetail.value?.session.id) === toMeetingId(meetingId)
      ) {
        setMeetingDetail(response.data);
      }
      return response.data;
    }

    /** 会议中继续邀请成员 */
    async function inviteParticipants(inviteUserIds: string[]) {
      if (!currentMeetingId.value) {
        return null;
      }
      const response = await inviteMeetingParticipantsApi(
        currentMeetingId.value,
        {
          inviteUserIds,
        }
      );
      setMeetingDetail(response.data);
      return response.data;
    }

    /** 离开会议：主持人调用停止，普通成员调用离开 */
    async function leaveMeeting() {
      if (!currentMeetingId.value || !meetingDetail.value) {
        return null;
      }
      const participant = getCurrentParticipant();
      const isHost =
        toNumericId(meetingDetail.value.session.hostUserId) ===
          toNumericId(meetingDetail.value.currentUserId) ||
        participant?.isHost === 1;
      const response = isHost
        ? await stopMeetingApi(currentMeetingId.value)
        : await leaveMeetingApi(currentMeetingId.value);
      setMeetingDetail(response.data);
      shouldResumeCapture.value = false;
      shouldAutoOpenDrawer.value = false;
      releaseRtcOwnership(currentMeetingId.value);
      return response.data;
    }

    /** 停止会议（主持人操作） */
    async function stopMeeting() {
      if (!currentMeetingId.value) {
        return null;
      }
      const response = await stopMeetingApi(currentMeetingId.value);
      setMeetingDetail(response.data);
      shouldResumeCapture.value = false;
      releaseRtcOwnership(currentMeetingId.value);
      return response.data;
    }

    /** 重新发送最终摘要 */
    async function resendFinalSummary() {
      if (!currentMeetingId.value) {
        return null;
      }
      const response = await resendFinalSummaryApi(currentMeetingId.value);
      setMeetingDetail(response.data);
      return response.data;
    }

    /******************************** 音频上传与转写 ********************************/

    /** 上传音频片段，返回新增的 transcript */
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

    /** 更新或插入已确认的转写记录，同时清除对应 pending */
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
      // final transcript 到达，清除对应参与者的 pending 状态
      clearPendingTranscriptByUserId(toNumericId(transcript.userId));
    }

    /******************************** 摘要管理 ********************************/

    /** 更新或插入阶段/最终摘要 */
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

    /** 更新实时摘要草稿（流式 AI 输出） */
    function upsertLiveSummaryDraft(summary: MeetingLiveSummaryDraft) {
      if (
        !meetingDetail.value ||
        toMeetingId(meetingDetail.value.session.id) !==
          toMeetingId(summary.meetingId)
      ) {
        return;
      }
      liveSummaryDraft.value = summary;
    }

    /******************************** 流式转写管理 ********************************/

    /** 更新进行中的流式转写（partial result） */
    function upsertPendingTranscript(pending: PendingTranscript) {
      if (!meetingDetail.value || !pending.participantIdentity) {
        console.warn('[upsertPendingTranscript] 跳过:', {
          hasMeetingDetail: !!meetingDetail.value,
          participantIdentity: pending.participantIdentity,
          pending,
        });
        return;
      }
      pendingTranscripts.value = {
        ...pendingTranscripts.value,
        [pending.participantIdentity]: pending,
      };
    }

    /** 根据 userId 清除对应的 pending 转写（final 到达时调用） */
    function clearPendingTranscriptByUserId(userId: string) {
      if (!userId) return;
      const current = pendingTranscripts.value;
      const next: Record<string, PendingTranscript> = {};
      for (const [key, value] of Object.entries(current)) {
        if (toNumericId(value.userId) !== userId) {
          next[key] = value;
        }
      }
      pendingTranscripts.value = next;
    }

    function clearInteractionBubbles() {
      interactionBubbleTimers.forEach((timer) => clearTimeout(timer));
      interactionBubbleTimers.clear();
      interactionBubbles.value = {};
      interactionMessages.value = [];
    }

    function upsertInteraction(interaction: CmsMeetingInteraction) {
      if (
        !meetingDetail.value ||
        toMeetingId(meetingDetail.value.session.id) !==
          toMeetingId(interaction.meetingId)
      ) {
        return;
      }
      const userId = toNumericId(interaction.userId);
      if (!userId) {
        return;
      }
      interactionMessages.value = [...interactionMessages.value, interaction];
      interactionBubbles.value = {
        ...interactionBubbles.value,
        [userId]: interaction,
      };
      const currentTimer = interactionBubbleTimers.get(userId);
      if (currentTimer) {
        clearTimeout(currentTimer);
      }
      interactionBubbleTimers.set(
        userId,
        setTimeout(() => {
          const next = { ...interactionBubbles.value };
          delete next[userId];
          interactionBubbles.value = next;
          interactionBubbleTimers.delete(userId);
        }, 4200)
      );
    }

    async function sendInteraction(payload: SendMeetingInteractionRequest) {
      if (!currentMeetingId.value) {
        return null;
      }
      const response = await sendMeetingInteractionApi(
        currentMeetingId.value,
        payload
      );
      return response.data;
    }

    /******************************** WebSocket 消息处理 ********************************/

    /** 消费 WebSocket 会议事件，按 type 分发到对应处理方法 */
    function consumeWsMessage(message: WsMessage) {
      console.log('[consumeWsMessage]', message);
      if (!message.type) {
        return;
      }

      // 会议状态变更（新事件名）
      if (message.type === 'meeting_state_changed' && message.data) {
        const detail = normalizeMeetingDetail(
          message.data as CmsMeetingDetail,
          meetingDetail.value
        );

        // 主持人调用 stop 接口直接所有人退出 根据CLOSING以及匹配当前房间号
        if (
          detail &&
          currentMeetingId.value !== null &&
          toMeetingId(currentMeetingId.value) ===
            toMeetingId(detail.session.id) &&
          detail?.session.status === 'CLOSING'
        ) {
          shouldResumeCapture.value = false;
          shouldAutoOpenDrawer.value = false;
          liveSummaryDraft.value = null;
        }
        if (
          detail &&
          (currentMeetingId.value === null ||
            toMeetingId(currentMeetingId.value) ===
              toMeetingId(detail.session.id))
        ) {
          setMeetingDetail(detail);
        }
        return;
      }
      // 会议状态变更
      if (message.type === 'meeting_state' && message.data) {
        const detail = normalizeMeetingDetail(
          message.data as CmsMeetingDetail,
          meetingDetail.value
        );
        if (
          detail &&
          (currentMeetingId.value === null ||
            toMeetingId(currentMeetingId.value) ===
              toMeetingId(detail.session.id))
        ) {
          setMeetingDetail(detail);
        }
        return;
      }
      // 已确认的转写
      if (message.type === 'meeting_transcript' && message.data) {
        upsertTranscript(message.data as CmsMeetingTranscript);
        return;
      }
      // 流式转写的 partial result
      if (message.type === 'meeting_transcript_partial' && message.data) {
        upsertPendingTranscript(message.data as PendingTranscript);
        return;
      }
      // 阶段摘要生成
      if (message.type === 'meeting_stage_summary' && message.data) {
        const summary = message.data as CmsMeetingSummary;
        upsertSummary(summary);
        upsertLiveSummaryDraft({
          meetingId: toMeetingId(summary.meetingId),
          summaryText: summary.summaryText,
          sourceTranscriptCount: summary.sourceTranscriptCount,
          updatedAt: summary.createTime,
        });
        return;
      }
      // 流式摘要更新
      if (message.type === 'meeting_live_summary' && message.data) {
        upsertLiveSummaryDraft(message.data as MeetingLiveSummaryDraft);
        return;
      }
      if (message.type === 'meeting_interaction' && message.data) {
        upsertInteraction(message.data as CmsMeetingInteraction);
        return;
      }
      // 屏幕共享状态变更
      if (message.type === 'meeting_screen_share_state' && message.data) {
        screenShareState.value = message.data as MeetingScreenShareState;
        return;
      }
      // 屏幕摄像头状态变更
      if (message.type === 'meeting_screen_camera_state' && message.data) {
        screenCameraState.value = message.data as MeetingScreenCameraState;
        return;
      }
      // 最终摘要生成
      if (message.type === 'meeting_final_summary' && message.data) {
        const detail = normalizeMeetingDetail(
          message.data as CmsMeetingDetail,
          meetingDetail.value
        );
        if (
          detail &&
          currentMeetingId.value !== null &&
          toMeetingId(currentMeetingId.value) === toMeetingId(detail.session.id)
        ) {
          setMeetingDetail(detail);
          shouldResumeCapture.value = false;
          shouldAutoOpenDrawer.value = false;
          liveSummaryDraft.value = null;
        }
        return;
      }
      // 会议关闭
      if (message.type === 'meeting_closed' && message.data) {
        const detail = normalizeMeetingDetail(
          message.data as CmsMeetingDetail,
          meetingDetail.value
        );
        if (
          detail &&
          currentMeetingId.value !== null &&
          toMeetingId(currentMeetingId.value) === toMeetingId(detail.session.id)
        ) {
          shouldResumeCapture.value = false;
          shouldAutoOpenDrawer.value = false;
          liveSummaryDraft.value = null;
        }
      }
    }

    /******************************** Setters ********************************/

    function setSpeakerUserId(value: string | null) {
      speakerUserId.value = value;
    }

    function setShouldResumeCapture(value: boolean) {
      shouldResumeCapture.value = value;
    }

    function syncRtcOwnershipFromStorage() {
      const owner = readMeetingRtcOwner(localStorage);
      rtcOwnerClientId.value = owner?.clientId || null;
      rtcOwnerMeetingId.value = owner?.meetingId || null;
      return owner;
    }

    function claimRtcOwnership(meetingId: string) {
      const owner = claimMeetingRtcOwner(
        meetingId,
        meetingClientId.value,
        localStorage
      );
      rtcOwnerClientId.value = owner.clientId;
      rtcOwnerMeetingId.value = owner.meetingId;
      return owner;
    }

    function releaseRtcOwnership(meetingId?: string | null) {
      releaseMeetingRtcOwner(
        meetingClientId.value,
        localStorage,
        meetingId || undefined
      );
      syncRtcOwnershipFromStorage();
    }

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
    function isCurrentTabRtcOwner(meetingId: string | null | undefined) {
      const owner = syncRtcOwnershipFromStorage();
      return (
        !!owner &&
        toMeetingId(meetingId) === owner.meetingId &&
        owner.clientId === meetingClientId.value
      );
    }

    /**
     * 判断指定会议的 RTC 所有权是否被另一个标签页持有
     *
     * @returns
     *  true  — 其他标签页持有该会议的 RTC 所有权
     *  false — 要么没有人持有，要么就是当前标签页持有
     */
    function isRtcOwnedByOtherTab(meetingId: string | null | undefined) {
      const owner = syncRtcOwnershipFromStorage();
      if (owner) {
        console.log('owner.meetingId ==>', owner.meetingId);
        console.log('meetingId ==>', meetingId);
        console.log('meetingClientId.value ==>', meetingClientId.value);
        console.log('owner.clientId ==>', owner.clientId);
      }

      return (
        !!owner &&
        toMeetingId(meetingId) === owner.meetingId &&
        owner.clientId !== meetingClientId.value
      );
    }

    /** 获取当前发言人显示名称 */
    function currentSpeakerName() {
      if (!meetingDetail.value || speakerUserId.value === null) {
        return '';
      }
      const participant = meetingDetail.value.participants.find(
        (item) => item.userId === speakerUserId.value
      );
      return participant?.nickName || participant?.userName || '';
    }

    /******************************** 返回 ********************************/

    return {
      // 状态
      currentMeetingId,
      shouldResumeCapture,
      speakerUserId,
      shouldAutoOpenDrawer,
      meetingDetail,
      drawerVisible,
      lastJoinedUserId,
      pendingMeetings,
      pendingTranscripts,
      interactionMessages,
      interactionBubbles,
      screenShareState,
      screenCameraState,
      selectableUsers,
      loading,
      // 计算属性
      hasActiveMeeting,
      stageSummaries,
      liveTranscriptBlocks,
      liveSummaryText,
      liveSummaryUpdatedAt,
      liveSummaryStatus,
      finalSummary,
      // 方法
      getCurrentParticipant,
      setMeetingDetail,
      clearMeetingRuntime,
      openDrawer,
      closeDrawer,
      hideDrawerToBackground,
      clearLastJoinedUserId,
      setShouldAutoOpenDrawer,
      loadSelectableUsers,
      loadPendingMeetings,
      buildPendingInviteMessages,
      upsertPendingMeeting,
      createMeeting,
      loadCurrentMeeting,
      loadMeetingDetail,
      enterMeeting,
      acceptMeeting,
      declineMeeting,
      inviteParticipants,
      sendInteraction,
      stopMeeting,
      resendFinalSummary,
      leaveMeeting,
      uploadAudio,
      upsertTranscript,
      upsertSummary,
      consumeWsMessage,
      setSpeakerUserId,
      setShouldResumeCapture,
      syncRtcOwnershipFromStorage,
      claimRtcOwnership,
      releaseRtcOwnership,
      isCurrentTabRtcOwner,
      isRtcOwnedByOtherTab,
      currentSpeakerName,
      isActiveStatus,
      isTerminalStatus,
      toMeetingId,
      toNumericId,
    };
  },
  {
    persist: {
      storage: sessionStorage,
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
