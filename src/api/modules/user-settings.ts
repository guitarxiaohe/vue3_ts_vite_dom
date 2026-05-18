import { httpClient } from '../client';

/** 获取当前用户全部设置 */
export function getUserSettings() {
  return httpClient.get<Record<string, string>>('/system/userSettings');
}

/** 批量保存当前用户设置 */
export function saveUserSettings(data: Record<string, string>) {
  return httpClient.put('/system/userSettings', data);
}
