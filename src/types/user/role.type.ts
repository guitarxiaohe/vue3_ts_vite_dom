/**
 * 角色对象接口
 */
export interface SysRole {
  /** 角色ID */
  roleId?: number | string;
  /** 角色名称 */
  roleName?: string;
  /** 角色权限字符串 */
  roleKey?: string;
  /** 角色状态 */
  status?: string;
  /** 显示顺序 */
  roleSort?: number | string;
  /** 数据范围 */
  dataScope?: string;
  /** 菜单父子联动 */
  menuCheckStrictly?: boolean;
  /** 部门父子联动 */
  deptCheckStrictly?: boolean;
  /** 菜单权限 ID */
  menuIds?: Array<number | string>;
  /** 部门数据权限 ID */
  deptIds?: Array<number | string>;
  /** 备注 */
  remark?: string;
  /** 创建时间 */
  createTime?: string | number | Date;
  /** 是否管理员 */
  admin?: boolean;
}
