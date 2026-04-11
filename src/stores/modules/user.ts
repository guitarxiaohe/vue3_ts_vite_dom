import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login } from '@/api/modules/user';
import type { LoginParams } from '@/types/user';
import { ElMessage } from 'element-plus';

const TOKEN_KEY = 'token';

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));

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

  return {
    token,
    isLoggedIn,
    loginAction,
    logout,
  };
});
