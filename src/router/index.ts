import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import Layout from '@/layout/index.vue';
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('@/views/login/index.vue'),
    // meta: { requiresAuth: true },
  },
  {
    path: '/',
    component: () => Layout,
    redirect: '/entity',
    children: [
      {
        path: '/entity',
        component: () => import('@/views/entity/index.vue'),
      },
    ],
  },
  {
    path: '/three',
    component: () => import('@/views/three/index'),
    // meta: { requiresAuth: true },
  },
  {
    path: '/components',
    component: () => import('@/views/components.vue'),
    // meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const requiresAuth = to.meta.requiresAuth !== false;

  //   if (requiresAuth && !token) {
  //     next('/login')
  //   } else if (to.path === '/login' && token) {
  //     next('/')
  //   } else {
  //     next()
  //   }
  next();
});

export default router;
