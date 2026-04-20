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
  roleSort?: number;
  /** 创建时间 */
  createTime?: string | Date;
  /** 是否管理员 */
  admin?: boolean;
}
