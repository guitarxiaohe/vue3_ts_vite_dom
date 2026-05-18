import { httpClient } from '@/api/client';
import type { SysRole } from '@/types/user/role.type';

/******************************** 角色权限表单服务 ********************************/

// 树选择节点
export interface PermissionTreeNode {
  id: number | string;
  label: string;
  children?: PermissionTreeNode[];
}

// 角色提交参数
export interface RolePermissionPayload {
  roleId?: number | string;
  roleName: string;
  roleKey: string;
  roleSort: number | string;
  status: string;
  dataScope: string;
  menuCheckStrictly: boolean;
  deptCheckStrictly: boolean;
  menuIds: Array<number | string>;
  deptIds: Array<number | string>;
  remark?: string;
}

// 角色菜单树响应
export interface RoleMenuTreeResponse {
  code?: number;
  msg?: string;
  data?: PermissionTreeNode[];
  menus?: PermissionTreeNode[];
  checkedKeys?: Array<number | string>;
}

// 角色部门树响应
export interface DeptTreeResponse {
  code?: number;
  msg?: string;
  data?: PermissionTreeNode[];
}

// 角色列表响应
export interface RoleListResponse {
  code?: number;
  msg?: string;
  rows?: SysRole[];
  total?: number;
}

// 查询角色详情
export function getRoleInfo(roleId: number | string) {
  return httpClient.get<SysRole>(`/system/role/${roleId}`);
}

// 查询角色列表
export function listRoles(params?: Record<string, unknown>) {
  return httpClient.get(
    '/system/role/list',
    params
  ) as Promise<RoleListResponse>;
}

// 新增角色
export function createRole(payload: RolePermissionPayload) {
  return httpClient.post('/system/role', payload);
}

// 修改角色
export function editRole(payload: RolePermissionPayload) {
  return httpClient.put('/system/role', payload);
}

// 修改角色数据权限
export function updateRoleDataScope(payload: RolePermissionPayload) {
  return httpClient.put('/system/role/dataScope', payload);
}

// 查询菜单权限树
export function getMenuTreeSelect() {
  return httpClient.get(
    '/system/menu/treeselect'
  ) as Promise<RoleMenuTreeResponse>;
}

// 查询角色菜单权限树
export function getRoleMenuTreeSelect(roleId: number | string) {
  return httpClient.get(
    `/system/menu/roleMenuTreeselect/${roleId}`
  ) as Promise<RoleMenuTreeResponse>;
}

// 查询部门数据权限树
export function getDeptTreeSelect() {
  return httpClient.get('/system/dept/treeselect') as Promise<DeptTreeResponse>;
}
