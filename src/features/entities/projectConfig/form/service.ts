import { httpClient } from '@/api/client';
import type { SysRole } from '@/types/user/role.type';
import type { SysPost, SysUser, SysUserDetailApiResponse } from '@/types/user';

/******************************** 用户表单服务 ********************************/

// 新增用户请求参数
export interface CreateUserPayload {
  /**
   * 项目地址
   */
  projectAddress?: string;
  /**
   * 主键id
   */
  projectId?: number;
  /**
   * 项目名称
   */
  projectName?: string;
  /**
   * 项目类型（字典） code: project_type
   */
  projectType?: string;
}

export interface EditUserPayload {
  /**
   * 主键id
   */
  projectId?: string;
  /**
   * 项目地址
   */
  projectAddress?: string;
  /**
   * 项目名称
   */
  projectName?: string;
  /**
   * 项目类型（字典） code: project_type
   */
  projectType?: string;
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
  return httpClient.post('/system/projectConfig', payload);
}

export function editUser(payload: EditUserPayload) {
  return httpClient.put('/system/projectConfig', payload);
}
