import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import type { CmsMeetingDetail } from '@/api/modules/meeting.type';
import { useMeetingStore } from './meeting';

const meetingApiMocks = vi.hoisted(() => ({
  acceptMeetingApi: vi.fn(),
  createMeetingApi: vi.fn(),
  getCurrentMeetingApi: vi.fn(),
  getMeetingDetailApi: vi.fn(),
  getPendingMeetingsApi: vi.fn(),
  leaveMeetingApi: vi.fn(),
  listMeetingSelectableUsersApi: vi.fn(),
  resendFinalSummaryApi: vi.fn(),
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
});
