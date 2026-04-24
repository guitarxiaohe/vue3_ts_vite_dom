import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login, getRoutersApi } from '@/api/modules/user';
import type { LoginParams } from '@/types/user';
import type { SysRouter } from '@/types/menu';
import { ElMessage } from 'element-plus';

const TOKEN_KEY = 'token';

const ROUTER_KEY = 'routers';
export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));
  const treeRouters = ref<SysRouter[] | null>(
    JSON.parse(localStorage.getItem(ROUTER_KEY) || '[]')
  );

  const isLoggedIn = computed(() => !!token.value);

  const loginAction = async (params: LoginParams) => {
    try {
      const response = (await login(params)) as any;

      if (response.code === 200) {
        token.value = response.token;
        localStorage.setItem(TOKEN_KEY, response.token);
        ElMessage.success('登录成功');
        return true;
      } else {
        ElMessage.error(response.msg || '登录失败');
        return false;
      }
    } catch (error: any) {
      ElMessage.error(error.message || '登录失败');
      return false;
    }
  };

  const logout = () => {
    token.value = null;
    localStorage.removeItem(TOKEN_KEY);
  };

  const getRouters = async () => {
    try {
      const response = (await getRoutersApi()) as any;
      const routers = Array.isArray(response.data) ? response.data : [];
      treeRouters.value = routers;
      localStorage.setItem(ROUTER_KEY, JSON.stringify(routers));
      return routers;
    } catch (error: any) {
      ElMessage.error(error.message || '获取路由失败');
      return [];
    }
  };
  return {
    token,
    isLoggedIn,
    loginAction,
    logout,
    getRouters,
    treeRouters,
  };
});
