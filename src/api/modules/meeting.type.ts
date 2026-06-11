import type { SysUser } from '@/types/user';

export interface MeetingApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface CmsMeetingSession {
  id: number;
  title: string;
  status: string;
  hostUserId: number;
  hostUserName: string;
  hostNickName: string;
  startedAt: string;
  endedAt: string | null;
  lastStageSummaryAt: string | null;
  finalSummary: string | null;
  lastError: string | null;
  createBy: string;
  createTime: string;
  updateBy: string;
  updateTime: string;
  remark: string | null;
}

export interface CmsMeetingParticipant {
  id: number;
  meetingId: number;
  userId: number;
  userName: string;
  nickName: string;
  isHost: number;
  inviteStatus: string;
  inviteSentAt: string;
  acceptedAt: string | null;
  leftAt: string | null;
  createBy: string;
  createTime: string;
  updateBy: string;
  updateTime: string;
}

export interface CmsMeetingTranscript {
  id: number;
  meetingId: number;
  participantId: number | null;
  userId: number | null;
  displayName: string;
  transcriptText: string;
  audioStartedAt: string | null;
  audioEndedAt: string | null;
  createBy: string;
  createTime: string;
}

export interface CmsMeetingSummary {
  id: number;
  meetingId: number;
  summaryType: string;
  summaryIndex: number;
  summaryText: string;
  sourceTranscriptCount: number;
  createBy: string;
  createTime: string;
}

export interface CmsMeetingDetail {
  session: CmsMeetingSession;
  participants: CmsMeetingParticipant[];
  transcripts: CmsMeetingTranscript[];
  summaries: CmsMeetingSummary[];
  currentUserId: number | null;
}

export interface CmsMeetingPendingInvite {
  meetingId: number;
  title: string;
  status: string;
  hostUserId: number;
  hostUserName: string;
  hostNickName: string;
  startedAt: string;
  inviteSentAt: string;
  inviteStatus: string;
}

export interface CreateMeetingRequest {
  title: string;
  remark: string;
  inviteUserIds: number[];
}

export interface UploadMeetingAudioRequest {
  file: Blob;
  speakerUserId: number | null;
  speakerDisplayName: string;
  audioStartedAtMs: number;
  audioEndedAtMs: number;
}

export type MeetingSelectableUser = SysUser;
