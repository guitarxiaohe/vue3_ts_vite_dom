import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { i18n } from '@/i18n';
import { getEntityModule } from '@/features/entities/registry';
import { useUserStore } from '@/stores/modules/user';
import Layout from '@/layout/index.vue';

const APP_TITLE = import.meta.env.VITE_APP_TITLE || 'XiaoHe';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { requiresAuth: false, titleKey: 'user.login' },
  },
  {
    path: '/external-meeting',
    name: 'external',
    component: () => import('@/views/external-meeting/index.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/index',
    name: 'Index',
    component: () => import('@/views/index.vue'),
    meta: { requiresAuth: false, titleKey: 'user.login' },
  },
  {
    path: '/',
    component: Layout,
    redirect: '/entity',
    children: [
      {
        path: '/entity',
        redirect: '/multiview/entity',
      },
      {
        path: '/components',
        name: 'Components',
        component: () => import('@/views/components.vue'),
        meta: { requiresAuth: true, titleKey: 'menu.components' },
      },

      {
        path: '/three',
        name: 'ThreeScene',
        component: () => import('@/views/three/index'),
        meta: { requiresAuth: true, titleKey: 'menu.threeScene' },
      },
      {
        path: '/fileInfo',
        name: 'FileInfo',
        component: () => import('@/views/fileInfo/index.vue'),
        meta: { requiresAuth: true, titleKey: 'menu.files' },
      },
      {
        path: '/monitor/online',
        name: 'MonitorOnline',
        component: () => import('@/views/monitor/online/index.vue'),
        meta: { requiresAuth: true, titleKey: 'monitor.online.title' },
      },
      {
        path: '/monitor/server',
        name: 'MonitorServer',
        component: () => import('@/views/monitor/server/index.vue'),
        meta: { requiresAuth: true, titleKey: 'monitor.server.title' },
      },
      {
        path: '/monitor/cache',
        name: 'MonitorCache',
        component: () => import('@/views/monitor/cache/index.vue'),
        meta: { requiresAuth: true, titleKey: 'monitor.cache.title' },
      },
      {
        path: '/monitor/druid',
        name: 'MonitorDruid',
        component: () => import('@/views/monitor/druid/index.vue'),
        meta: { requiresAuth: true, titleKey: 'monitor.druid.title' },
      },
      {
        path: '/tool/build',
        name: 'ToolBuild',
        component: () => import('@/views/tool/build/index.vue'),
        meta: { requiresAuth: true, titleKey: 'tool.build.title' },
      },
      {
        path: '/tool/gen',
        name: 'ToolGen',
        component: () => import('@/views/tool/gen/index.vue'),
        meta: { requiresAuth: true, titleKey: 'tool.gen.title' },
      },
      {
        path: '/tool/swagger',
        name: 'ToolSwagger',
        component: () => import('@/views/tool/swagger/index.vue'),
        meta: { requiresAuth: true, titleKey: 'tool.swagger.title' },
      },
      {
        path: 'multiview/:entityKey(.*)',
        name: 'Multiview',
        component: () => import('@/views/multiview/multiview-page.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/NotFound.vue'),
        meta: { requiresAuth: false, titleKey: 'notFound.title' },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 动态网页标题: VITE_APP_TITLE + 当前菜单名称
router.afterEach((to) => {
  const { t } = i18n.global;
  let pageTitle = '';

  // 通用实体页面：从 EntityModule 配置取标题
  if (to.name === 'Multiview' && to.params.entityKey) {
    const entityKey = String(to.params.entityKey);
    const module = getEntityModule(entityKey);
    pageTitle = module?.config?.title || entityKey;
  } else if (to.meta?.titleKey) {
    pageTitle = t(to.meta.titleKey as string);
  }

  document.title = pageTitle ? `${APP_TITLE} - ${pageTitle}` : APP_TITLE;
});

const whiteList = ['/login', '/NotFound', '/external-meeting'];

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore();
  const token = localStorage.getItem('token');

  if (token) {
    if (to.path === '/login') {
      next({ path: '/' });
    } else {
      const ready = await userStore.bootstrapSession();
      if (!ready) {
        userStore.logout();
        next({ path: '/login', replace: true });
        return;
      }
      next();
    }
  } else {
    if (whiteList.includes(to.path)) {
      next();
    } else {
      next({ path: '/login', replace: true });
      // ElMessageBox.confirm(t('user.tokenExpiredDesc'), t('user.tokenExpired'), {
      //   confirmButtonText: t('common.confirm'),
      //   cancelButtonText: t('common.cancel'),
      //   type: 'warning',
      // })
      //   .then(() => {
      //     window.location.href = '/login';
      //     next({ path: '/login', replace: true });
      //   })
      //   .catch(() => {
      //     next(false);
      //   });
    }
  }
});

export default router;
