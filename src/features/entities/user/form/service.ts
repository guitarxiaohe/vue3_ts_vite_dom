import { httpClient } from '@/api/client';
import type { SysRole } from '@/types/user/role.type';
import type { SysPost, SysUser, SysUserDetailApiResponse } from '@/types/user';

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
  status?: string;
  roleIds?: Array<number | string>;
  postIds?: Array<number | string>;
  remark?: string;
}

export interface EditUserPayload {
  userId: string;
  deptId: number | string;
  userName: string;
  nickName: string;
  email?: string;
  phonenumber?: string;
  sex?: string;
  avatar?: string;
  status?: string;
  roleIds?: Array<number | string>;
  postIds?: Array<number | string>;
  remark?: string;
}

// 用户表单选项响应
export type UserFormOptionsResponse = SysUserDetailApiResponse & {
  roles?: SysRole[];
  roleIds?: Array<number | string>;
  posts?: SysPost[];
  postIds?: Array<number | string>;
  data?: SysUser;
};

// 新增用户（POST /system/user）
export function createUser(payload: CreateUserPayload) {
  return httpClient.post('/system/user', payload);
}

export function editUser(payload: EditUserPayload) {
  return httpClient.put('/system/user', payload);
}

// 查询用户表单角色选项与已选角色
export function getUserFormOptions(userId?: number | string) {
  const suffix = userId == null || userId === '' ? '/' : `/${userId}`;
  return httpClient.get(
    `/system/user${suffix}`
  ) as Promise<UserFormOptionsResponse>;
}
