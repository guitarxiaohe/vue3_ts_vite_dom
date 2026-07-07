import type { Router, RouteRecordRaw } from 'vue-router';
import type { SysRouter } from '@/types/menu';

/******************************** 动态路由配置 ********************************/

// 根布局路由名称，动态页面统一挂载到主布局下
export const ROOT_ROUTE_NAME = 'RootLayout';

// Vite 视图模块索引，后端 component 只允许解析到本地 views 目录
const viewModules: Record<string, () => Promise<unknown>> = {
  ...import.meta.glob('../views/*.vue'),
  ...import.meta.glob('../views/**/index.vue'),
  ...import.meta.glob('../views/**/index.ts'),
};

/******************************** 动态路由注册 ********************************/

// 注册后端菜单返回的页面路由
export function registerDynamicRoutes(
  router: Router,
  routers: SysRouter[]
): boolean {
  let hasRegistered = false;

  flattenRouters(routers).forEach((routeItem: SysRouter) => {
    const routePath: string | null = normalizeRoutePath(routeItem.path);
    const viewLoader = resolveViewLoader(routeItem.component);

    if (!routePath || !viewLoader || routeItem.menuType === 'F') {
      return;
    }

    if (isRoutePathRegistered(router, routePath)) {
      return;
    }

    const dynamicRoute = {
      path: routePath,
      name: buildDynamicRouteName(routeItem, routePath),
      component: viewLoader,
      meta: {
        requiresAuth: true,
        title: routeItem.meta?.title,
        icon: routeItem.meta?.icon,
        noCache: routeItem.meta?.noCache,
      },
    } as RouteRecordRaw;

    router.addRoute(ROOT_ROUTE_NAME, dynamicRoute);
    hasRegistered = true;
  });

  return hasRegistered;
}

// 判断路径是否已在路由表中
export function isRoutePathRegistered(router: Router, path: string): boolean {
  return router.getRoutes().some((route) => route.path === path);
}

/******************************** 内部工具 ********************************/

// 拉平后端路由树
function flattenRouters(routers: SysRouter[]): SysRouter[] {
  return routers.flatMap((routeItem: SysRouter) => [
    routeItem,
    ...flattenRouters(routeItem.children ?? []),
  ]);
}

// 规范化后端 path 为前端绝对路径
function normalizeRoutePath(path?: string): string | null {
  const rawPath: string = String(path ?? '').trim();

  if (!rawPath || rawPath === '/' || /^https?:\/\//.test(rawPath)) {
    return null;
  }

  return `/${rawPath.replace(/^\/+/, '')}`;
}

// 解析后端 component 到本地页面模块
function resolveViewLoader(
  component?: string
): (() => Promise<unknown>) | null {
  const rawComponent: string = String(component ?? '').trim();

  if (
    !rawComponent ||
    ['Layout', 'ParentView', 'InnerLink'].includes(rawComponent)
  ) {
    return null;
  }

  const viewPath: string = rawComponent
    .replace(/^@\/views\//, '')
    .replace(/^views\//, '')
    .replace(/^\/+/, '')
    .replace(/\.(vue|ts)$/, '');
  const candidates: string[] = [
    `../views/${viewPath}.vue`,
    `../views/${viewPath}/index.vue`,
    `../views/${viewPath}.ts`,
    `../views/${viewPath}/index.ts`,
  ];

  for (const candidate of candidates) {
    if (viewModules[candidate]) {
      return viewModules[candidate];
    }
  }

  return null;
}

// 生成稳定且唯一的动态路由名称
function buildDynamicRouteName(
  routeItem: SysRouter,
  routePath: string
): string {
  const routeKey: string =
    routeItem.menuId !== undefined
      ? String(routeItem.menuId)
      : routePath.replace(/[^a-zA-Z0-9]+/g, '_');

  return `DynamicRoute_${routeKey}`;
}
