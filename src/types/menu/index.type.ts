import type { PaginationParams } from '@/types/api';

/******************************** 菜单基础类型 ********************************/

// 菜单名称国际化项
export interface MenuLocaleItem {
  locale: 'zh-CN' | 'en-US' | 'ja-JP';
  label: string;
}

// 菜单实体
export interface SysMenu {
  menuId?: number;
  menuName: string;
  parentId?: number;
  orderNum?: number;
  path?: string;
  component?: string | null;
  query?: string | null;
  routeName?: string;
  isFrame?: 0 | 1;
  isCache?: 0 | 1;
  menuType?: 'M' | 'C' | 'F';
  visible?: '0' | '1';
  status?: '0' | '1';
  perms?: string | null;
  icon?: string;
  createBy?: string;
  createTime?: string | null;
  updateBy?: string;
  updateTime?: string | null;
  remark?: string;
  children?: SysMenu[];
  localeNames?: MenuLocaleItem[];
}

/******************************** 菜单查询类型 ********************************/

// 菜单列表查询参数
export interface SysMenuQuery
  extends Partial<Pick<SysMenu, 'menuId' | 'menuName' | 'path' | 'status'>>,
    Partial<PaginationParams> {
  pageNum?: number;
  pageSize?: number;
}

/******************************** 菜单表单类型 ********************************/

// 菜单表单数据
export interface SysMenuFormData extends SysMenu {
  localeNames: MenuLocaleItem[];
}

/******************************** 路由菜单类型 ********************************/

// 路由元信息
export interface SysRouterMeta {
  title?: string;
  icon?: string;
  noCache?: boolean;
  link?: string;
}

// 登录态路由树
export interface SysRouter {
  menuId?: number;
  parentId?: number;
  parentName?: string;
  menuType?: 'M' | 'C' | 'F' | string;
  name?: string;
  path?: string;
  hidden?: boolean;
  redirect?: string;
  component?: string;
  query?: string;
  alwaysShow?: boolean;
  meta?: SysRouterMeta | null;
  children?: SysRouter[];
}
