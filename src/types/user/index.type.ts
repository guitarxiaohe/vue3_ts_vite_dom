import type { ApiResponse } from '@/types/api';
import type { SysDept } from './dept.type';
import type { SysRole } from './role.type';

/**
 * 岗位（若依 /system/user 等接口）
 */
export interface SysPost {
  postId?: string | number;
  postCode?: string;
  postName?: string;
  postSort?: string | number;
  status?: string;
  remark?: string;
}

/**
 * 用户性别枚举
 */
export enum UserSex {
  /** 男 */
  MALE = '0',
  /** 女 */
  FEMALE = '1',
  /** 未知 */
  UNKNOWN = '2',
}

/**
 * 帐号状态枚举
 */
export enum UserStatus {
  /** 正常 */
  NORMAL = '0',
  /** 停用 */
  DISABLED = '1',
}

/**
 * 删除标志枚举
 */
export enum DelFlag {
  /** 存在 */
  EXIST = '0',
  /** 删除 */
  DELETED = '2',
}
export interface User {
  id: number;
  username: string;
  email?: string;
  avatar?: string;
  createdAt?: string;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResponse {
  msg: string;
  code: number;
  token: string;
}

// ----------------- 菜单相关 -----------------
export interface MenuItem {
  menuId: number;
  menuName: string;
  parentName?: string;
  parentId: number | null;
  orderNum: number;
  path: string;
  component?: string;
  query?: string;
  isFrame: '0' | '1';
  isCache: '0' | '1';
  menuType: 'M' | 'C' | 'F';
  visible: '0' | '1';
  status: '0' | '1';
  perms?: string;
  icon?: string;
  children?: MenuItem[];
}

export interface FlatMenuItem extends MenuItem {
  fullPath: string;
  level: number;
  allParentIds: number[];
}

export interface TreeNode extends MenuItem {
  fullPath: string;
  level: number;
  children?: TreeNode[];
}

// 字段配置（完整版）
export interface FieldConfig {
  id: number;
  entityKey: string;
  fieldKey: string;
  fieldName: string;
  dictCode: string | null;
  selectEntityKey: string | null;
  sort: number;
  isFuzzySearch: boolean; // 转为布尔值
  isVisible: boolean; // 转为布尔值
  createdBy: number | null;
  createdTime: number | null;
  updatedBy: number | null;
  updatedTime: number | null;
}

/**
 * 用户信息接口（完整版）
 */
export interface SysUser {
  /** 用户ID */
  userId: number | string;

  /** 微信用户openid */
  openId?: string;

  /** 部门ID */
  deptId?: number | string;

  /** 用户账号 */
  userName: string;

  /** 用户昵称 */
  nickName: string;

  /** 用户邮箱 */
  email?: string;

  /** 手机号码 */
  phonenumber?: string;

  /** 用户性别（0=男,1=女,2=未知） */
  sex?: UserSex | string;

  /** 用户头像 */
  avatar?: string;

  /** 密码 */
  password?: string;

  /** 盐加密 */
  salt?: string;

  /** 帐号状态（0正常 1停用） */
  status?: UserStatus | string;

  /** 删除标志（0代表存在 2代表删除） */
  delFlag?: DelFlag | string;

  /** 最后登录IP */
  loginIp?: string;

  /** 最后登录时间 */
  loginDate?: string | Date | number;

  /** 部门对象 */
  dept?: SysDept;

  /** 角色对象列表 */
  roles?: SysRole[];

  /** 角色组ID数组 */
  roleIds?: (number | string)[];

  /** 岗位组ID数组 */
  postIds?: (number | string)[];

  /** 角色ID（单个） */
  roleId?: number | string;

  /** 创建者 */
  createBy?: string;

  /** 创建时间 */
  createTime?: string | Date;

  /** 更新者 */
  updateBy?: string;

  /** 更新时间 */
  updateTime?: string | Date;

  /** 备注 */
  remark?: string;

  /** 若依：是否管理员 */
  admin?: boolean;
}

/**
 * GET /system/user/{id} 完整响应体：data 为用户，根级附带 roles、posts、roleIds（与 data 内字段并存）
 */
export type SysUserDetailApiResponse = ApiResponse<SysUser> & {
  msg?: string;
  roleIds?: string[];
  roles?: SysRole[];
  posts?: SysPost[];
};
