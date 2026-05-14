import { httpClient } from '../client';

/******************************** 通知公告 API ********************************/

// 获取最近一周内的通知公告（首页滚动播报）
export function getRecentNoticesApi() {
  return httpClient.get('/system/notice/recent');
}
