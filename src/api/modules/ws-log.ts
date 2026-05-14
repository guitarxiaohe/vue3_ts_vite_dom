import { httpClient } from '../client';

/** 获取当前用户最近消息日志 */
export function getRecentWsLogsApi() {
  return httpClient.get('/system/wslog/recent');
}
