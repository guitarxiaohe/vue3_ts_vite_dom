import { httpClient } from '../client';

/** 生成会议链接 */
export function generateMeetingLinkApi() {
  return httpClient.get('/cms/meeting/generateMeetingLink');
}

/**
 * 根据会议名称查找会议
 * @param roomName 后六位号码
 * @returns
 */
export function getMeetingByRoomNameApi(roomName: string) {
  return httpClient.get(`/cms/meeting/public/room/${roomName}`);
}
