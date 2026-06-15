import { httpClient } from '@/api/client';
import type { MeetingRtcTokenResponse } from './meeting-rtc.type';

/**
 * 获取 RTC Token
 * @param meetingId 会议 ID
 */
export function getRtcTokenApi(meetingId: string) {
  return httpClient.post<MeetingRtcTokenResponse>(
    `/cms/meeting/session/${meetingId}/rtc/token`
  );
}

/**
 * 启动 RTC Worker
 * @param meetingId 会议 ID
 */
export function startRtcApi(meetingId: string) {
  return httpClient.post(`/cms/meeting/session/${meetingId}/rtc/start`);
}

/**
 * 停止 RTC Worker
 * @param meetingId 会议 ID
 */
export function stopRtcApi(meetingId: string) {
  return httpClient.post(`/cms/meeting/session/${meetingId}/rtc/stop`);
}

/**
 * 上传音频片段（由 Worker 调用，前端通常不需要调用）
 * @param meetingId 会议 ID
 * @param data 音频片段数据
 */
export function uploadAudioChunkApi(meetingId: string, data: FormData) {
  return httpClient.postUpload(
    `/cms/meeting/session/${meetingId}/rtc/chunk`,
    data
  );
}
