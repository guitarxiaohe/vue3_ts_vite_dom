import type { SysUser } from '@/types/user';

export interface MeetingApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface CmsMeetingSession {
  id: string;
  title: string;
  status: string;
  rtcStatus: string;
  hostUserId: string;
  hostUserName: string;
  hostNickName: string;
  startedAt: string;
  endedAt: string | null;
  lastStageSummaryAt: string | null;
  finalSummary: string | null;
  lastError: string | null;
  closingStartedAt: string | null;
  closedAt: string | null;
  closeRequestedBy: string | null;
  closeResult: string | null;
  closeTraceId: string | null;
  currentShareUserId: string | null;
  currentShareIdentity: string | null;
  currentShareStartedAt: string | null;
  createBy: string;
  createTime: string;
  updateBy: string;
  updateTime: string;
  remark: string | null;
}

export interface CmsMeetingParticipant {
  id: string;
  meetingId: string;
  userId: string;
  userName: string;
  nickName: string;
  /** 头像 */
  avatar: string;
  /** 性别 */
  sex: string;
  /** 部门名称 */
  deptName: string;
  /** 部门ID */
  deptId: string;
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
  id: string;
  meetingId: string;
  participantId: string | null;
  userId: string | null;
  displayName: string;
  transcriptText: string;
  audioStartedAt: string | null;
  audioEndedAt: string | null;
  sourceType: string | null;
  createBy: string;
  createTime: string;
}

export type MeetingInteractionType = 'HAND' | 'EMOJI' | 'TEXT';

export interface CmsMeetingInteraction {
  meetingId: string;
  userId: string;
  displayName: string;
  interactionType: MeetingInteractionType;
  content: string;
  transcriptText: string;
  createdAt: string;
}

export interface CmsMeetingSummary {
  id: string;
  meetingId: string;
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
  currentUserId: string | null;
}

export interface CmsMeetingPendingInvite {
  meetingId: string;
  title: string;
  status: string;
  hostUserId: string;
  hostUserName: string;
  hostNickName: string;
  startedAt: string;
  inviteSentAt: string;
  inviteStatus: string;
}

export interface CreateMeetingRequest {
  title: string;
  remark: string;
  inviteUserIds: string[];
}

export interface InviteMeetingParticipantsRequest {
  inviteUserIds: string[];
}

export interface SendMeetingInteractionRequest {
  interactionType: MeetingInteractionType;
  content: string;
}

export interface UploadMeetingAudioRequest {
  file: Blob;
  speakerUserId: string | null;
  speakerDisplayName: string;
  audioStartedAtMs: number;
  audioEndedAtMs: number;
}

export type MeetingSelectableUser = SysUser;

/** 流式 ASR 进行中的转写（partial result） */
export interface PendingTranscript {
  /** 参与者身份标识（如 user-123） */
  participantIdentity: string;
  /** 用户 ID */
  userId: string | null;
  /** 发言人显示名 */
  displayName: string;
  /** 累积转写文本（每次 partial 更新为最新全文） */
  transcriptText: string;
  /** 音频起始时间 */
  audioStartedAt: string | null;
  /** 音频结束时间 */
  audioEndedAt: string | null;
}

/** 屏幕共享状态 */
export interface MeetingScreenShareState {
  meetingId: string;
  shareActive: boolean;
  sharerUserId: string | null;
  sharerIdentity: string | null;
  shareStartedAt: string | null;
}
