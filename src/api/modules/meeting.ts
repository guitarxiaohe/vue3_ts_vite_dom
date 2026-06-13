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

export function createMeetingApi(data: CreateMeetingRequest) {
  return httpClient.post('/cms/meeting/session', data) as unknown as Promise<
    MeetingApiResponse<CmsMeetingDetail>
  >;
}

export function getCurrentMeetingApi() {
  return httpClient.get('/cms/meeting/session/current') as unknown as Promise<
    MeetingApiResponse<CmsMeetingDetail | null>
  >;
}

export function getPendingMeetingsApi() {
  return httpClient.get('/cms/meeting/session/pending') as unknown as Promise<
    MeetingApiResponse<CmsMeetingPendingInvite[]>
  >;
}

export function acceptMeetingApi(meetingId: number) {
  return httpClient.post(
    `/cms/meeting/session/${meetingId}/accept`
  ) as unknown as Promise<MeetingApiResponse<CmsMeetingDetail>>;
}

export function declineMeetingApi(meetingId: number) {
  return httpClient.post(
    `/cms/meeting/session/${meetingId}/decline`
  ) as unknown as Promise<MeetingApiResponse<CmsMeetingDetail>>;
}

export function inviteMeetingParticipantsApi(
  meetingId: number,
  data: InviteMeetingParticipantsRequest
) {
  return httpClient.post(
    `/cms/meeting/session/${meetingId}/invite`,
    data
  ) as unknown as Promise<MeetingApiResponse<CmsMeetingDetail>>;
}

export function sendMeetingInteractionApi(
  meetingId: number,
  data: SendMeetingInteractionRequest
) {
  return httpClient.post(
    `/cms/meeting/session/${meetingId}/interaction`,
    data
  ) as unknown as Promise<MeetingApiResponse<CmsMeetingInteraction>>;
}

export function getMeetingDetailApi(meetingId: number) {
  return httpClient.get(
    `/cms/meeting/session/${meetingId}`
  ) as unknown as Promise<MeetingApiResponse<CmsMeetingDetail>>;
}

export function leaveMeetingApi(meetingId: number) {
  return httpClient.post(
    `/cms/meeting/session/${meetingId}/leave`
  ) as unknown as Promise<MeetingApiResponse<CmsMeetingDetail>>;
}

export function stopMeetingApi(meetingId: number) {
  return httpClient.post(
    `/cms/meeting/session/${meetingId}/stop`
  ) as unknown as Promise<MeetingApiResponse<CmsMeetingDetail>>;
}

export function dismissMeetingApi(meetingId: number) {
  return httpClient.post(
    `/cms/meeting/session/${meetingId}/dismiss`
  ) as unknown as Promise<MeetingApiResponse<CmsMeetingDetail>>;
}

export function resendFinalSummaryApi(meetingId: number) {
  return httpClient.post(
    `/cms/meeting/session/${meetingId}/resend-final-summary`
  ) as unknown as Promise<MeetingApiResponse<CmsMeetingDetail>>;
}

export function uploadMeetingAudioApi(
  meetingId: number,
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

export function listMeetingSelectableUsersApi() {
  return httpClient.get('/system/user/userList') as unknown as Promise<
    MeetingApiResponse<MeetingSelectableUser[]>
  >;
}
