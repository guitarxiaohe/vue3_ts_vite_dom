import { httpClient } from '@/api/client';

/******************************** 用户表单服务 ********************************/

// 新增用户请求参数
export interface CreateUserPayload {
  deptId: number | string;
  userName: string;
  nickName: string;
  email?: string;
  phonenumber?: string;
  sex?: string;
  avatar?: string;
}

// 新增用户（POST /system/user）
export function createUser(payload: CreateUserPayload) {
  return httpClient.post('/system/user', payload);
}
