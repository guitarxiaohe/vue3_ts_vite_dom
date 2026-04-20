import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import { i18n } from '@/i18n';
import Layout from '@/layout/index.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => Layout,
    redirect: '/entity',
    children: [
      {
        path: '/entity',
        name: 'Entity',
        component: () => import('@/views/entity/index.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/components',
        name: 'Components',
        component: () => import('@/views/components.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/three',
        name: 'ThreeScene',
        component: () => import('@/views/three/index'),
        meta: { requiresAuth: true },
      },
      {
        path: '/fileInfo',
        name: 'FileInfo',
        component: () => import('@/views/fileInfo/index.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/NotFound.vue'),
        meta: { requiresAuth: false },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const whiteList = ['/login', '/NotFound'];

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token');
  const { t } = i18n.global;

  if (token) {
    if (to.path === '/login') {
      next({ path: '/' });
    } else {
      next();
    }
  } else {
    if (whiteList.includes(to.path)) {
      next();
    } else {
      ElMessageBox.confirm(t('user.tokenExpiredDesc'), t('user.tokenExpired'), {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      })
        .then(() => {
          window.location.href = '/login';
          next({ path: '/login', replace: true });
        })
        .catch(() => {
          next(false);
        });
    }
  }
});

export default router;
