import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import type { CmsMeetingDetail } from '@/api/modules/meeting.type';
import { useMeetingStore } from './meeting';

const meetingApiMocks = vi.hoisted(() => ({
  acceptMeetingApi: vi.fn(),
  createMeetingApi: vi.fn(),
  declineMeetingApi: vi.fn(),
  getCurrentMeetingApi: vi.fn(),
  getMeetingDetailApi: vi.fn(),
  getPendingMeetingsApi: vi.fn(),
  inviteMeetingParticipantsApi: vi.fn(),
  leaveMeetingApi: vi.fn(),
  listMeetingSelectableUsersApi: vi.fn(),
  resendFinalSummaryApi: vi.fn(),
  sendMeetingInteractionApi: vi.fn(),
  stopMeetingApi: vi.fn(),
  uploadMeetingAudioApi: vi.fn(),
}));

vi.mock('@/api/modules/meeting', () => meetingApiMocks);

/******************************** 会议状态测试 ********************************/

function createMeetingDetail(options: {
  meetingId?: number;
  currentUserId?: number;
  hostUserId?: number;
  currentInviteStatus?: string;
  sessionStatus?: string;
}): CmsMeetingDetail {
  const meetingId = options.meetingId ?? 10;
  const currentUserId = options.currentUserId ?? 2;
  const hostUserId = options.hostUserId ?? 1;
  const currentInviteStatus = options.currentInviteStatus ?? 'ACCEPTED';
  const sessionStatus = options.sessionStatus ?? 'ACTIVE';

  return {
    session: {
      id: meetingId,
      rtcStatus: 'RUNNING',
      status: sessionStatus,
      hostUserId,
      hostUserName: 'host',
      hostNickName: '主持人',
      title: '周会',
      startedAt: '2026-06-11 15:00:00',
      endedAt: null,
      lastStageSummaryAt: null,
      finalSummary: null,
      lastError: null,
      createBy: 'system',
      createTime: '2026-06-11 15:00:00',
      updateBy: 'system',
      updateTime: '2026-06-11 15:00:00',
      remark: null,
    },
    participants: [
      {
        id: 1,
        meetingId,
        userId: hostUserId,
        userName: 'host',
        nickName: '主持人',
        isHost: 1,
        inviteStatus: 'ACCEPTED',
        inviteSentAt: '2026-06-11 15:00:00',
        acceptedAt: '2026-06-11 15:00:00',
        leftAt: null,
        createBy: 'system',
        createTime: '2026-06-11 15:00:00',
        updateBy: 'system',
        updateTime: '2026-06-11 15:00:00',
      },
      {
        id: 2,
        meetingId,
        userId: currentUserId,
        userName: 'member',
        nickName: '成员',
        isHost: hostUserId === currentUserId ? 1 : 0,
        inviteStatus: currentInviteStatus,
        inviteSentAt: '2026-06-11 15:00:00',
        acceptedAt:
          currentInviteStatus === 'PENDING' ? null : '2026-06-11 15:00:00',
        leftAt: currentInviteStatus === 'LEFT' ? '2026-06-11 15:10:00' : null,
        createBy: 'system',
        createTime: '2026-06-11 15:00:00',
        updateBy: 'system',
        updateTime: '2026-06-11 15:00:00',
      },
    ],
    transcripts: [],
    summaries: [],
    currentUserId,
  };
}

describe('meeting store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  test('enterMeeting should re-accept a participant who previously left', async () => {
    const store = useMeetingStore();
    const detail = createMeetingDetail({ currentInviteStatus: 'LEFT' });
    const accepted = createMeetingDetail({ currentInviteStatus: 'ACCEPTED' });

    meetingApiMocks.getMeetingDetailApi.mockResolvedValue({ data: detail });
    meetingApiMocks.acceptMeetingApi.mockResolvedValue({ data: accepted });
    meetingApiMocks.getPendingMeetingsApi.mockResolvedValue({ data: [] });

    const result = await store.enterMeeting(10);

    expect(meetingApiMocks.acceptMeetingApi).toHaveBeenCalledWith(10);
    expect(result).toEqual(accepted);
    expect(store.meetingDetail?.participants[1]?.inviteStatus).toBe('ACCEPTED');
  });

  test('leaveMeeting should end the meeting for host and only leave for member', async () => {
    const hostStore = useMeetingStore();
    hostStore.setMeetingDetail(
      createMeetingDetail({ currentUserId: 1, hostUserId: 1 })
    );
    meetingApiMocks.stopMeetingApi.mockResolvedValue({
      data: createMeetingDetail({
        currentUserId: 1,
        hostUserId: 1,
        sessionStatus: 'ENDED',
      }),
    });

    await hostStore.leaveMeeting();

    setActivePinia(createPinia());
    const memberStore = useMeetingStore();
    memberStore.setMeetingDetail(
      createMeetingDetail({ currentUserId: 2, hostUserId: 1 })
    );
    meetingApiMocks.leaveMeetingApi.mockResolvedValue({
      data: createMeetingDetail({
        currentUserId: 2,
        hostUserId: 1,
        currentInviteStatus: 'LEFT',
      }),
    });

    await memberStore.leaveMeeting();

    expect(meetingApiMocks.stopMeetingApi).toHaveBeenCalledWith(10);
    expect(meetingApiMocks.leaveMeetingApi).toHaveBeenCalledWith(10);
  });

  test('declineMeeting should remove a pending invite from the waiting list', async () => {
    const store = useMeetingStore();
    store.pendingMeetings = [
      {
        meetingId: 10,
        title: '周会',
        status: 'ACTIVE',
        hostUserId: 1,
        hostUserName: 'host',
        hostNickName: '主持人',
        startedAt: '2026-06-11 15:00:00',
        inviteSentAt: '2026-06-11 15:00:00',
        inviteStatus: 'PENDING',
      },
      {
        meetingId: 11,
        title: '复盘会',
        status: 'ACTIVE',
        hostUserId: 1,
        hostUserName: 'host',
        hostNickName: '主持人',
        startedAt: '2026-06-11 16:00:00',
        inviteSentAt: '2026-06-11 16:00:00',
        inviteStatus: 'PENDING',
      },
    ];

    meetingApiMocks.declineMeetingApi.mockResolvedValue({
      data: createMeetingDetail({
        meetingId: 10,
        currentUserId: 2,
        hostUserId: 1,
        currentInviteStatus: 'DECLINED',
      }),
    });

    await store.declineMeeting(10);

    expect(meetingApiMocks.declineMeetingApi).toHaveBeenCalledWith(10);
    expect(store.pendingMeetings.map((item) => item.meetingId)).toEqual([11]);
  });

  test('inviteParticipants should refresh current meeting detail with newly invited members', async () => {
    const store = useMeetingStore();
    store.setMeetingDetail(
      createMeetingDetail({ currentUserId: 1, hostUserId: 1 })
    );
    const invitedDetail = createMeetingDetail({
      currentUserId: 1,
      hostUserId: 1,
    });
    invitedDetail.participants = [
      ...invitedDetail.participants,
      {
        id: 3,
        meetingId: 10,
        userId: 3,
        userName: 'new-user',
        nickName: '新成员',
        isHost: 0,
        inviteStatus: 'PENDING',
        inviteSentAt: '2026-06-11 15:05:00',
        acceptedAt: null,
        leftAt: null,
        createBy: 'host',
        createTime: '2026-06-11 15:05:00',
        updateBy: 'host',
        updateTime: '2026-06-11 15:05:00',
      },
    ];

    meetingApiMocks.inviteMeetingParticipantsApi.mockResolvedValue({
      data: invitedDetail,
    });

    const result = await store.inviteParticipants([3]);

    expect(meetingApiMocks.inviteMeetingParticipantsApi).toHaveBeenCalledWith(
      10,
      { inviteUserIds: [3] }
    );
    expect(result?.participants).toHaveLength(3);
    expect(store.meetingDetail?.participants[2]?.inviteStatus).toBe('PENDING');
  });

  test('hideDrawerToBackground should keep the meeting but stop auto-opening it', () => {
    const store = useMeetingStore();
    store.setMeetingDetail(
      createMeetingDetail({ currentUserId: 2, hostUserId: 1 })
    );
    store.openDrawer();

    store.hideDrawerToBackground();

    expect(store.drawerVisible).toBe(false);
    expect(store.shouldAutoOpenDrawer).toBe(false);
    expect(store.currentMeetingId).toBe(10);
    expect(store.meetingDetail?.session.status).toBe('ACTIVE');
  });

  test('consumeWsMessage should keep transcript and summary arrays when meeting_state is partial', () => {
    const store = useMeetingStore();
    const detail = createMeetingDetail({ currentUserId: 2, hostUserId: 1 });
    detail.transcripts = [
      {
        id: 100,
        meetingId: 10,
        participantId: 2,
        userId: 2,
        displayName: '成员',
        transcriptText: '最新转写',
        audioStartedAt: '2026-06-11 15:01:00',
        audioEndedAt: '2026-06-11 15:01:10',
        sourceType: 'RTC_PARTICIPANT',
        createBy: 'worker',
        createTime: '2026-06-11 15:01:10',
      },
    ];
    detail.summaries = [
      {
        id: 200,
        meetingId: 10,
        summaryType: 'STAGE',
        summaryIndex: 1,
        summaryText: '阶段总结',
        sourceTranscriptCount: 1,
        createBy: 'system',
        createTime: '2026-06-11 15:02:00',
      },
    ];
    store.setMeetingDetail(detail);

    store.consumeWsMessage({
      type: 'meeting_state',
      data: {
        session: {
          ...detail.session,
          rtcStatus: 'RUNNING',
        },
        participants: detail.participants,
      },
    });

    expect(store.meetingDetail?.transcripts).toHaveLength(1);
    expect(store.meetingDetail?.summaries).toHaveLength(1);
    expect(store.meetingDetail?.transcripts[0]?.transcriptText).toBe(
      '最新转写'
    );
  });

  test('liveTranscriptBlocks and liveSummary should split raw transcript feed from AI summary feed', () => {
    const store = useMeetingStore();
    const detail = createMeetingDetail({ currentUserId: 2, hostUserId: 1 });
    detail.transcripts = [
      {
        id: 100,
        meetingId: 10,
        participantId: 1,
        userId: 1,
        displayName: '主持人',
        transcriptText: '我们先确认上线时间。',
        audioStartedAt: '2026-06-11 15:01:00',
        audioEndedAt: '2026-06-11 15:01:10',
        sourceType: 'RTC_PARTICIPANT',
        createBy: 'worker',
        createTime: '2026-06-11 15:01:10',
      },
    ];
    detail.summaries = [
      {
        id: 200,
        meetingId: 10,
        summaryType: 'STAGE',
        summaryIndex: 1,
        summaryText: 'AI 归纳：当前先聚焦上线时间与负责人。',
        sourceTranscriptCount: 1,
        createBy: 'system',
        createTime: '2026-06-11 15:02:00',
      },
      {
        id: 201,
        meetingId: 10,
        summaryType: 'STAGE',
        summaryIndex: 1,
        summaryText: 'AI 归纳：当前先聚焦上线时间与负责人。',
        sourceTranscriptCount: 1,
        createBy: 'system',
        createTime: '2026-06-11 15:03:00',
      },
    ];
    store.setMeetingDetail(detail);

    store.consumeWsMessage({
      type: 'meeting_transcript_partial',
      data: {
        participantIdentity: 'user-127',
        userId: 127,
        displayName: '贺琦',
        transcriptText: '我这边今天可以补完测试。',
        audioStartedAt: '2026-06-11 15:02:30',
        audioEndedAt: '2026-06-11 15:02:35',
      },
    });

    expect(store.liveTranscriptBlocks).toEqual([
      expect.objectContaining({
        kind: 'speaker',
        label: '主持人提到',
        text: '我们先确认上线时间。',
      }),
      expect.objectContaining({
        kind: 'pending',
        label: '贺琦补充',
        text: '我这边今天可以补完测试。',
        pending: true,
      }),
    ]);
    expect(store.liveSummaryText).toBe('AI 归纳：当前先聚焦上线时间与负责人。');
    expect(store.liveSummaryStatus).toBe('streaming');
  });

  test('meeting_live_summary should refresh the lower AI summary without changing the raw transcript feed', () => {
    const store = useMeetingStore();
    const detail = createMeetingDetail({ currentUserId: 2, hostUserId: 1 });
    detail.transcripts = [
      {
        id: 100,
        meetingId: 10,
        participantId: 1,
        userId: 1,
        displayName: '主持人',
        transcriptText: '我们先确认上线时间。',
        audioStartedAt: '2026-06-11 15:01:00',
        audioEndedAt: '2026-06-11 15:01:10',
        sourceType: 'RTC_PARTICIPANT',
        createBy: 'worker',
        createTime: '2026-06-11 15:01:10',
      },
    ];
    store.setMeetingDetail(detail);

    store.consumeWsMessage({
      type: 'meeting_live_summary',
      data: {
        meetingId: 10,
        summaryText:
          'AI 实时总结：会议先确认本周上线时间，并继续补充测试安排。',
        sourceTranscriptCount: 1,
        updatedAt: '2026-06-11 15:02:00',
      },
    });

    expect(store.liveTranscriptBlocks).toHaveLength(1);
    expect(store.liveTranscriptBlocks[0]).toEqual(
      expect.objectContaining({
        kind: 'speaker',
        text: '我们先确认上线时间。',
      })
    );
    expect(store.liveSummaryText).toBe(
      'AI 实时总结：会议先确认本周上线时间，并继续补充测试安排。'
    );
    expect(store.liveSummaryStatus).toBe('streaming');
  });
});
