import { httpClient } from '../client';
import type { CmsMeetingDetail } from './meeting.type';

/**
 * 会议创建请求参数
 */
interface MeetingCreateRequest {
  /** 会议标题 */
  title: string;
  /** 计划开始时间，格式：YYYY-MM-DD HH:mm:ss */
  scheduledStartAt: string;
  /** 计划结束时间，格式：YYYY-MM-DD HH:mm:ss */
  scheduledEndAt: string;
}

/** 生成会议链接 */
export function generateMeetingLinkApi(data: MeetingCreateRequest) {
  return httpClient.post('/cms/meeting/generateMeetingLink', data);
}

/**
 * 根据会议房间号查找会议
 * @param roomName 后端自己拼接 后六位号码
 * @returns
 */
export function getMeetingByRoomNameApi(roomName: string) {
  return httpClient.get<CmsMeetingDetail>(
    `/cms/meeting/public/room/${roomName}`
  );
}
/**
 * 通过房间号进入该房间
 * @param code
 * @returns
 */
export function enterTheRoomByCodeApi(code: string) {
  return httpClient.post<CmsMeetingDetail>(
    `/cms/meeting/public/room/${code}/join`
  );
}
