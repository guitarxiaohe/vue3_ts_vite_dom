import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login, getRoutersApi } from '@/api/modules/user';
import type { LoginParams, TreeNode } from '@/types/user';
import { ElMessage } from 'element-plus';
import { useMenu } from '@/composables/useMenu';

const TOKEN_KEY = 'token';

const ROUTER_KEY = 'routers';
export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));
  const treeRouters = ref<TreeNode[] | null>(
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
      const { treeList } = useMenu(response.data);
      token.value = response.token;
      treeRouters.value = treeList.value;
      localStorage.setItem(ROUTER_KEY, JSON.stringify(treeList.value));
      return treeList;
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
