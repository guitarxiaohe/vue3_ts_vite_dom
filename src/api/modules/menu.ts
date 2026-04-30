import { httpClient } from '../client';
import type { SysMenu, SysMenuQuery, SysRouter } from '@/types/menu';
import type { TableListQuery } from '@/components/table-entity/index.type';
import { getApiErrorText, isApiSuccess } from '@/utils/api-success';
import { isMockEnabled } from '@/utils/is-mock';
import { getMockRoleKeysByToken } from './mock-auth';

/******************************** Query Key ********************************/

// 左侧路由菜单缓存键
export const ROUTER_TREE_QUERY_KEY = ['system', 'router', 'tree'] as const;

// 菜单树下拉缓存键
export const MENU_TREESELECT_QUERY_KEY = ['system', 'menu', 'treeselect'] as const;

/******************************** Mock 数据 ********************************/

type MenuNode = SysMenu & { children?: MenuNode[]; roleKeys?: string[] };

const nowText = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

let mockMenuIdSeed = 32;

let mockMenus: MenuNode[] = [
  {
    menuId: 1,
    menuName: '首页',
    parentId: 0,
    orderNum: 1,
    path: '/home/index',
    component: 'views/home/index',
    routeName: 'Home',
    isFrame: 1,
    isCache: 0,
    menuType: 'C',
    visible: '0',
    status: '0',
    icon: 'House',
    remark: '首页菜单',
    localeNames: [
      { locale: 'zh-CN', label: '首页' },
      { locale: 'en-US', label: 'Home' },
      { locale: 'ja-JP', label: 'ホーム' },
    ],
    createTime: nowText(),
    updateTime: nowText(),
    roleKeys: ['admin', 'operator', 'auditor'],
  },
  {
    menuId: 2,
    menuName: '整车生产',
    parentId: 0,
    orderNum: 2,
    path: '/production',
    component: 'Layout',
    routeName: 'Production',
    isFrame: 1,
    isCache: 1,
    menuType: 'M',
    visible: '1',
    status: '0',
    icon: 'CarFront',
    localeNames: [{ locale: 'zh-CN', label: '整车生产' }],
    createTime: nowText(),
    updateTime: nowText(),
    roleKeys: ['admin', 'operator'],
    children: [
      {
        menuId: 3,
        menuName: '整车断点',
        parentId: 2,
        orderNum: 1,
        path: '/production/breakpoint',
        component: 'views/production/breakpoint/index',
        routeName: 'ProductionBreakpoint',
        isFrame: 1,
        isCache: 0,
        menuType: 'C',
        visible: '0',
        status: '0',
        icon: 'MapPinned',
        localeNames: [{ locale: 'zh-CN', label: '整车断点' }],
        createTime: nowText(),
        updateTime: nowText(),
        roleKeys: ['admin', 'operator'],
      },
      {
        menuId: 4,
        menuName: '整车报交',
        parentId: 2,
        orderNum: 2,
        path: '/production/report',
        component: 'views/production/report/index',
        routeName: 'ProductionReport',
        isFrame: 1,
        isCache: 0,
        menuType: 'C',
        visible: '0',
        status: '0',
        icon: 'ClipboardCheck',
        localeNames: [{ locale: 'zh-CN', label: '整车报交' }],
        createTime: nowText(),
        updateTime: nowText(),
        roleKeys: ['admin', 'operator'],
      },
      {
        menuId: 5,
        menuName: '车身工单信息',
        parentId: 2,
        orderNum: 3,
        path: '/production/body-order',
        component: 'views/production/body-order/index',
        routeName: 'BodyOrder',
        isFrame: 1,
        isCache: 0,
        menuType: 'C',
        visible: '0',
        status: '0',
        icon: 'FileStack',
        localeNames: [{ locale: 'zh-CN', label: '车身工单信息' }],
        createTime: nowText(),
        updateTime: nowText(),
        roleKeys: ['admin', 'operator'],
      },
    ],
  },
  {
    menuId: 7,
    menuName: '系统DVP',
    parentId: 0,
    orderNum: 7,
    path: '/dvp',
    component: 'Layout',
    routeName: 'SystemDvp',
    isFrame: 1,
    isCache: 1,
    menuType: 'M',
    visible: '0',
    status: '0',
    icon: 'Workflow',
    localeNames: [{ locale: 'zh-CN', label: '系统DVP' }],
    createTime: nowText(),
    updateTime: nowText(),
    roleKeys: ['admin', 'auditor'],
  },
  {
    menuId: 10,
    menuName: '工厂建模',
    parentId: 0,
    orderNum: 8,
    path: '/factory-model',
    component: 'views/factory-model/index',
    routeName: 'FactoryModel',
    isFrame: 1,
    isCache: 1,
    menuType: 'C',
    visible: '0',
    status: '0',
    icon: 'Building2',
    localeNames: [{ locale: 'zh-CN', label: '工厂建模' }],
    createTime: nowText(),
    updateTime: nowText(),
    roleKeys: ['admin', 'operator'],
  },
  {
    menuId: 14,
    menuName: '系统设置',
    parentId: 0,
    orderNum: 9,
    path: '/settings',
    component: 'Layout',
    routeName: 'Settings',
    isFrame: 1,
    isCache: 1,
    menuType: 'M',
    visible: '0',
    status: '0',
    icon: 'Settings',
    localeNames: [
      { locale: 'zh-CN', label: '系统设置' },
      { locale: 'en-US', label: 'Settings' },
    ],
    createTime: nowText(),
    updateTime: nowText(),
    roleKeys: ['admin'],
    children: [
      {
        menuId: 15,
        menuName: '菜单管理',
        parentId: 14,
        orderNum: 1,
        path: '/multiview/menu',
        component: 'views/multiview/multiview-page',
        routeName: 'MenuManage',
        isFrame: 1,
        isCache: 0,
        menuType: 'C',
        visible: '0',
        status: '0',
        icon: 'Settings',
        localeNames: [
          { locale: 'zh-CN', label: '菜单管理' },
          { locale: 'en-US', label: 'Menu' },
        ],
        createTime: nowText(),
        updateTime: nowText(),
        roleKeys: ['admin'],
      },
    ],
  },
];

/******************************** 工具方法 ********************************/

// 深拷贝菜单树
function cloneMenus() {
  return JSON.parse(JSON.stringify(mockMenus)) as MenuNode[];
}

// 获取当前 mock 菜单角色
function getCurrentMockRoleKeys() {
  if (typeof window === 'undefined') {
    return [];
  }

  return getMockRoleKeysByToken(window.localStorage.getItem('token'));
}

// 按角色过滤菜单树
function filterMenusByRoles(menus: MenuNode[], roleKeys: string[]): MenuNode[] {
  const hasAdminRole = roleKeys.includes('admin');
  const hasMatchedRole = (menu: MenuNode) => {
    if (hasAdminRole) {
      return true;
    }

    if (!menu.roleKeys?.length) {
      return true;
    }

    return menu.roleKeys.some((roleKey) => roleKeys.includes(roleKey));
  };

  const result: MenuNode[] = [];

  for (const menu of menus) {
    const children = menu.children?.length
      ? filterMenusByRoles(menu.children, roleKeys)
      : [];

    if (!hasMatchedRole(menu) && !children.length) {
      continue;
    }

    result.push({
      ...menu,
      children,
    });
  }

  return result;
}

// 获取当前 token 可见的 mock 菜单树
function getCurrentMockMenus() {
  return filterMenusByRoles(cloneMenus(), getCurrentMockRoleKeys());
}

// 深度遍历菜单树
function walkMenus(
  menus: MenuNode[],
  visitor: (menu: MenuNode, siblings: MenuNode[]) => boolean | void
) {
  for (const menu of menus) {
    const shouldStop = visitor(menu, menus);
    if (shouldStop === true) {
      return true;
    }
    if (menu.children?.length) {
      const childStopped = walkMenus(menu.children, visitor);
      if (childStopped) {
        return true;
      }
    }
  }
  return false;
}

// 过滤菜单树
function filterMenuTree(menus: MenuNode[], params: SysMenuQuery) {
  const menuIdText = String(params.menuId ?? '').trim();
  const menuNameText = String(params.menuName ?? '').trim().toLowerCase();
  const pathText = String(params.path ?? '').trim().toLowerCase();

  const matchMenu = (menu: MenuNode) => {
    const hitMenuId = !menuIdText || String(menu.menuId ?? '').includes(menuIdText);
    const hitName =
      !menuNameText ||
      String(menu.menuName ?? '')
        .toLowerCase()
        .includes(menuNameText);
    const hitPath =
      !pathText ||
      String(menu.path ?? '')
        .toLowerCase()
        .includes(pathText);

    return hitMenuId && hitName && hitPath;
  };

  const loop = (items: MenuNode[]): MenuNode[] => {
    const result: MenuNode[] = [];

    for (const item of items) {
      const children = item.children?.length ? loop(item.children) : [];
      if (!(matchMenu(item) || children.length)) {
        continue;
      }

      result.push({
        ...item,
        children,
      });
    }

    return result;
  };

  return loop(menus);
}

// 扁平化菜单树
function flattenMenuTree(menus: MenuNode[]) {
  const rows: MenuNode[] = [];
  walkMenus(menus, (menu) => {
    rows.push(menu);
  });
  return rows;
}

// 转换 mock 菜单为路由树
function buildMockRouters(menus: MenuNode[]): SysRouter[] {
  return menus
    .filter((menu) => menu.menuType !== 'F')
    .map((menu) => ({
      menuId: menu.menuId,
      parentId: menu.parentId,
      parentName: '',
      menuType: menu.menuType,
      name: menu.routeName || menu.menuName,
      path: menu.path,
      hidden: menu.visible === '1',
      redirect: menu.children?.length ? 'noRedirect' : undefined,
      component: menu.component ?? undefined,
      query: menu.query ?? undefined,
      alwaysShow: menu.menuType === 'M' && Boolean(menu.children?.length),
      meta: {
        title:
          menu.localeNames?.find((item) => item.locale === 'zh-CN')?.label ||
          menu.menuName,
        icon: menu.icon,
        noCache: menu.isCache === 1,
      },
      children: menu.children?.length ? buildMockRouters(menu.children) : [],
    }));
}

// 根据 ID 查找菜单
function findMenuById(menuId: number): MenuNode | null {
  let target: MenuNode | null = null;
  walkMenus(mockMenus, (menu) => {
    if (Number(menu.menuId) === Number(menuId)) {
      target = menu;
      return true;
    }
  });
  return target;
}

// 根据 ID 查找菜单所在同级列表
function findMenuSiblings(menuId: number): MenuNode[] | null {
  let siblings: MenuNode[] | null = null;
  walkMenus(mockMenus, (menu, currentSiblings) => {
    if (Number(menu.menuId) === Number(menuId)) {
      siblings = currentSiblings;
      return true;
    }
  });
  return siblings;
}

// 获取父级 children 容器
function resolveChildrenContainer(parentId: number): MenuNode[] | null {
  if (parentId === 0) {
    return mockMenus;
  }

  let targetChildren: MenuNode[] | null = null;
  walkMenus(mockMenus, (menu) => {
    if (Number(menu.menuId) === Number(parentId)) {
      menu.children = menu.children ?? [];
      targetChildren = menu.children;
      return true;
    }
  });

  return targetChildren;
}

// 按 ID 脱离菜单节点
function detachMenuById(menuId: number) {
  const loop = (menus: MenuNode[]): MenuNode | null => {
    const currentIndex = menus.findIndex(
      (menu) => Number(menu.menuId) === Number(menuId)
    );

    if (currentIndex >= 0) {
      return menus.splice(currentIndex, 1)[0] ?? null;
    }

    for (const menu of menus) {
      if (!menu.children?.length) {
        continue;
      }

      const matched = loop(menu.children);
      if (matched) {
        return matched;
      }
    }

    return null;
  };

  return loop(mockMenus);
}

// 规范化菜单提交数据
function normalizeMenuPayload(data: SysMenu) {
  return {
    ...data,
    menuId: data.menuId != null ? Number(data.menuId) : undefined,
    parentId: Number(data.parentId ?? 0),
    orderNum: Number(data.orderNum ?? 0),
    isFrame: Number(data.isFrame ?? 1) as 0 | 1,
    isCache: Number(data.isCache ?? 0) as 0 | 1,
    menuType: (data.menuType ?? 'C') as 'M' | 'C' | 'F',
    visible: (data.visible ?? '0') as '0' | '1',
    status: (data.status ?? '0') as '0' | '1',
    component: data.component ?? null,
    query: data.query ?? null,
    perms: data.perms ?? null,
    icon: data.icon || 'Menu',
    localeNames: Array.isArray(data.localeNames)
      ? data.localeNames.filter((item) => item.label.trim())
      : [],
  } as MenuNode;
}

/******************************** 接口方法 ********************************/

// 查询菜单列表
export function listMenu(params: SysMenuQuery = {}) {
  if (isMockEnabled()) {
    const rows = filterMenuTree(getCurrentMockMenus(), params);
    return Promise.resolve({
      code: 200,
      msg: '操作成功',
      rows,
      total: flattenMenuTree(rows).length,
    } as any);
  }

  return httpClient.get('/system/menu/list', params);
}

// 查询菜单列表并转换为 multiview 可消费的平铺结构
export async function listMenuRows(
  params: TableListQuery & Partial<SysMenuQuery> = { pageNum: 1, pageSize: 20 }
) {
  const response = (await listMenu(params)) as {
    rows?: SysMenu[];
    total?: number;
  };

  const rows = Array.isArray(response.rows) ? response.rows : [];
  const flatRows: Array<SysMenu & { menuLevel: number; localeDisplay: string }> = [];

  const walk = (menus: SysMenu[], level = 1) => {
    menus.forEach((menu) => {
      flatRows.push({
        ...menu,
        menuLevel: level,
        localeDisplay: (menu.localeNames ?? [])
          .map((item) => `${item.locale}:${item.label}`)
          .join(' | '),
      });

      if (menu.children?.length) {
        walk(menu.children, level + 1);
      }
    });
  };

  walk(rows);

  return {
    total: flatRows.length,
    rows: flatRows,
  };
}

// 查询菜单详情
export function getMenu(menuId: number | string) {
  if (isMockEnabled()) {
    return Promise.resolve({
      code: 200,
      msg: '操作成功',
      data: findMenuById(Number(menuId)) ?? null,
    } as any);
  }

  return httpClient.get(`/system/menu/${menuId}`);
}

// 查询菜单树选择数据
export function listMenuTreeSelect() {
  if (isMockEnabled()) {
    return Promise.resolve({
      code: 200,
      msg: '操作成功',
      data: getCurrentMockMenus(),
    } as any);
  }

  return httpClient.get('/system/menu/treeselect');
}

// 读取菜单树下拉数据
export async function fetchMenuTreeSelect(): Promise<SysMenu[]> {
  const response = (await listMenuTreeSelect()) as {
    code?: number;
    msg?: string;
    message?: string;
    data?: SysMenu[];
  };

  assertAjaxOk(response);
  return Array.isArray(response.data) ? response.data : [];
}

// 查询登录态路由树
export function listRouterTree() {
  if (isMockEnabled()) {
    return Promise.resolve({
      code: 200,
      msg: '操作成功',
      data: JSON.parse(JSON.stringify(buildMockRouters(getCurrentMockMenus()))),
    } as any);
  }

  return httpClient.get('/getRouters');
}

// 读取登录态路由树
export async function fetchRouterTree(): Promise<SysRouter[]> {
  const response = (await listRouterTree()) as {
    code?: number;
    msg?: string;
    message?: string;
    data?: SysRouter[];
  };

  assertAjaxOk(response);
  return Array.isArray(response.data) ? response.data : [];
}

// 新增菜单
export function addMenu(data: SysMenu) {
  if (isMockEnabled()) {
    const payload = normalizeMenuPayload(data);
    const container = resolveChildrenContainer(Number(payload.parentId ?? 0));

    if (!container) {
      return Promise.resolve({
        code: 500,
        msg: '父级菜单不存在',
      } as any);
    }

    mockMenuIdSeed += 1;
    container.push({
      ...payload,
      menuId: mockMenuIdSeed,
      createTime: nowText(),
      updateTime: nowText(),
    });
    container.sort(
      (a, b) => Number(a.orderNum ?? 0) - Number(b.orderNum ?? 0)
    );

    return Promise.resolve({
      code: 200,
      msg: '操作成功',
    } as any);
  }

  return httpClient.post('/system/menu', data);
}

// 修改菜单
export function updateMenu(data: SysMenu) {
  if (isMockEnabled()) {
    const payload = normalizeMenuPayload(data);
    const target = findMenuById(Number(payload.menuId));

    if (!target) {
      return Promise.resolve({
        code: 500,
        msg: '菜单不存在',
      } as any);
    }

    const originalParentId = Number(target.parentId ?? 0);
    const nextParentId = Number(payload.parentId ?? 0);

    if (originalParentId !== nextParentId) {
      const detachedMenu = detachMenuById(Number(payload.menuId));
      const nextContainer = resolveChildrenContainer(nextParentId);

      if (!detachedMenu || !nextContainer) {
        return Promise.resolve({
          code: 500,
          msg: '菜单移动失败',
        } as any);
      }

      nextContainer.push({
        ...detachedMenu,
        ...payload,
        updateTime: nowText(),
      });
      nextContainer.sort(
        (a, b) => Number(a.orderNum ?? 0) - Number(b.orderNum ?? 0)
      );
    } else {
      Object.assign(target, {
        ...payload,
        updateTime: nowText(),
      });
      findMenuSiblings(Number(payload.menuId))
        ?.sort((a, b) => Number(a.orderNum ?? 0) - Number(b.orderNum ?? 0));
    }

    return Promise.resolve({
      code: 200,
      msg: '操作成功',
    } as any);
  }

  return httpClient.put('/system/menu', data);
}

// 删除菜单
export function deleteMenu(menuId: number | string) {
  if (isMockEnabled()) {
    const removeById = (menus: MenuNode[]): boolean => {
      const targetIndex = menus.findIndex(
        (menu) => Number(menu.menuId) === Number(menuId)
      );
      if (targetIndex >= 0) {
        menus.splice(targetIndex, 1);
        return true;
      }

      return menus.some((menu) =>
        menu.children?.length ? removeById(menu.children) : false
      );
    };

    removeById(mockMenus);

    return Promise.resolve({
      code: 200,
      msg: '操作成功',
    } as any);
  }

  return httpClient.delete(`/system/menu/${menuId}`);
}

// 统一校验 AjaxResult 风格响应
export function assertAjaxOk(res: { code?: number; msg?: string; message?: string }) {
  if (!isApiSuccess(res.code ?? 0)) {
    throw new Error(getApiErrorText(res));
  }
}
