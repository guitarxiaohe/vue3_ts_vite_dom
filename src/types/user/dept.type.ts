/**
 * 部门对象接口
 */
export interface SysDept {
  /** 部门ID */
  deptId?: number | string;
  /** 部门名称 */
  deptName?: string;
  /** 部门负责人 */
  leader?: string;
  /** 父部门ID */
  parentId?: number | string;
  /** 部门状态 */
  status?: string;
  /** 显示顺序 */
  orderNum?: number;
  /** 创建时间 */
  createTime?: string | Date;
  /** 子部门列表 */
  children?: SysDept[];
}
