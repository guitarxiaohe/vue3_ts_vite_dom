import { httpClient } from '../client';
import type {
  CmsMeetingDetail,
  CmsMeetingInteraction,
  CmsMeetingPendingInvite,
  CmsMeetingTranscript,
  CreateMeetingRequest,
  InviteMeetingParticipantsRequest,
  MeetingApiResponse,
  MeetingSelectableUser,
  SendMeetingInteractionRequest,
  UploadMeetingAudioRequest,
} from './meeting.type';

/** 创建会议 */
export function createMeetingApi(data: CreateMeetingRequest) {
  return httpClient.post('/cms/meeting/session', data) as unknown as Promise<
    MeetingApiResponse<CmsMeetingDetail>
  >;
}

/** 获取当前进行中的会议（无会议时返回 null） */
export function getCurrentMeetingApi() {
  return httpClient.get('/cms/meeting/session/current') as unknown as Promise<
    MeetingApiResponse<CmsMeetingDetail | null>
  >;
}

/** 获取待处理的会议邀请列表 */
export function getPendingMeetingsApi() {
  return httpClient.get('/cms/meeting/session/pending') as unknown as Promise<
    MeetingApiResponse<CmsMeetingPendingInvite[]>
  >;
}

/** 接受会议邀请 */
export function acceptMeetingApi(meetingId: string) {
  return httpClient.post(
    `/cms/meeting/session/${meetingId}/accept`
  ) as unknown as Promise<MeetingApiResponse<CmsMeetingDetail>>;
}

/** 拒绝会议邀请 */
export function declineMeetingApi(meetingId: string) {
  return httpClient.post(
    `/cms/meeting/session/${meetingId}/decline`
  ) as unknown as Promise<MeetingApiResponse<CmsMeetingDetail>>;
}

/** 会议中邀请新成员 */
export function inviteMeetingParticipantsApi(
  meetingId: string,
  data: InviteMeetingParticipantsRequest
) {
  return httpClient.post(
    `/cms/meeting/session/${meetingId}/invite`,
    data
  ) as unknown as Promise<MeetingApiResponse<CmsMeetingDetail>>;
}

/** 发送会议互动（举手、表情等） */
export function sendMeetingInteractionApi(
  meetingId: string,
  data: SendMeetingInteractionRequest
) {
  return httpClient.post(
    `/cms/meeting/session/${meetingId}/interaction`,
    data
  ) as unknown as Promise<MeetingApiResponse<CmsMeetingInteraction>>;
}

/** 按 ID 获取会议详情 */
export function getMeetingDetailApi(meetingId: string) {
  return httpClient.get(
    `/cms/meeting/session/${meetingId}`
  ) as unknown as Promise<MeetingApiResponse<CmsMeetingDetail>>;
}

/** 离开会议（普通成员操作） */
export function leaveMeetingApi(meetingId: string) {
  return httpClient.post(
    `/cms/meeting/session/${meetingId}/leave`
  ) as unknown as Promise<MeetingApiResponse<CmsMeetingDetail>>;
}

/** 停止会议（主持人操作） */
export function stopMeetingApi(meetingId: string) {
  return httpClient.post(
    `/cms/meeting/session/${meetingId}/stop`
  ) as unknown as Promise<MeetingApiResponse<CmsMeetingDetail>>;
}

/** 解散会议 */
export function dismissMeetingApi(meetingId: string) {
  return httpClient.post(
    `/cms/meeting/session/${meetingId}/dismiss`
  ) as unknown as Promise<MeetingApiResponse<CmsMeetingDetail>>;
}

/** 重新发送最终摘要 */
export function resendFinalSummaryApi(meetingId: string) {
  return httpClient.post(
    `/cms/meeting/session/${meetingId}/resend-final-summary`
  ) as unknown as Promise<MeetingApiResponse<CmsMeetingDetail>>;
}

/** 上传音频片段进行 ASR 转写，返回新增的 transcript */
export function uploadMeetingAudioApi(
  meetingId: string,
  data: UploadMeetingAudioRequest
) {
  const formData = new FormData();
  formData.append('file', data.file, `meeting-${Date.now()}.wav`);
  if (data.speakerUserId !== null) {
    formData.append('speakerUserId', String(data.speakerUserId));
  }
  formData.append('speakerDisplayName', data.speakerDisplayName);
  formData.append('audioStartedAtMs', String(data.audioStartedAtMs));
  formData.append('audioEndedAtMs', String(data.audioEndedAtMs));
  return httpClient.postUpload(
    `/cms/meeting/session/${meetingId}/audio`,
    formData
  ) as unknown as Promise<MeetingApiResponse<CmsMeetingTranscript | null>>;
}

/** 开始屏幕共享 */
export function startScreenShareApi(meetingId: string) {
  return httpClient.post(
    `/cms/meeting/session/${meetingId}/share/start`
  ) as unknown as Promise<MeetingApiResponse<null>>;
}

/** 停止屏幕共享 */
export function stopScreenShareApi(meetingId: string) {
  return httpClient.post(
    `/cms/meeting/session/${meetingId}/share/stop`
  ) as unknown as Promise<MeetingApiResponse<null>>;
}

/**
 * 通知服务端当前客户端断连（用于页面关闭/刷新时的清理）
 * 使用 fetch + keepalive 确保在页面卸载时可靠发送
 */
export function notifyMeetingDisconnect(meetingId: string) {
  const token = localStorage.getItem('token') || '';
  const locale = localStorage.getItem('app_locale') || 'zh-CN';
  const baseURL = import.meta.env.VITE_APP_BASE_API || '/dev-api';
  const requestUrl = new URL(
    `${baseURL}/cms/meeting/session/${meetingId}/disconnect`,
    window.location.origin
  ).toString();

  fetch(requestUrl, {
    method: 'POST',
    body: '{}',
    keepalive: true,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
      'Accept-Language': locale,
    },
  }).catch(() => undefined);
}

/** 获取可邀请加入会议的用户列表 */
export function listMeetingSelectableUsersApi() {
  return httpClient.get('/system/user/userList') as unknown as Promise<
    MeetingApiResponse<MeetingSelectableUser[]>
  >;
}
