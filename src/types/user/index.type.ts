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
