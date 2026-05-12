import { httpClient } from '../client';

/******************************** 监控 API ********************************/

// 获取服务监控信息
export function getServerInfo() {
  return httpClient.get('/monitor/server');
}

// 获取缓存监控信息
export function getCacheInfo() {
  return httpClient.get('/monitor/cache');
}

// 获取在线用户列表
export function listOnlineUsers(params?: Record<string, any>) {
  return httpClient.get('/monitor/online/list', params);
}

// 强退在线用户
export function forceLogoutOnlineUser(tokenId: string) {
  return httpClient.delete(`/monitor/online/${tokenId}`);
}
