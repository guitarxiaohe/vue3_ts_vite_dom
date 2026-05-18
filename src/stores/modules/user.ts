import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login, getRoutersApi } from '@/api/modules/user';
import { useSystemStore } from '@/stores';
import type { LoginParams } from '@/types/user';
import type { SysRouter } from '@/types/menu';
import { ElMessage } from 'element-plus';

const TOKEN_KEY = 'token';
const USER_NAME_KEY = 'user_name';
const USER_AVATAR_KEY = 'user_avatar';

const ROUTER_KEY = 'routers';
export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));
  const userName = ref<string>(localStorage.getItem(USER_NAME_KEY) || '');
  const avatar = ref<string>(localStorage.getItem(USER_AVATAR_KEY) || '');
  const treeRouters = ref<SysRouter[] | null>(
    JSON.parse(localStorage.getItem(ROUTER_KEY) || '[]')
  );

  const isLoggedIn = computed(() => !!token.value);
  const displayName = computed(() => userName.value || 'XiaoHe');
  const avatarText = computed(() =>
    displayName.value.slice(0, 1).toUpperCase()
  );

  const loginAction = async (params: LoginParams) => {
    try {
      const response = (await login(params)) as any;

      if (response.code === 200) {
        token.value = response.token;
        userName.value =
          response.user?.nickName ||
          response.user?.userName ||
          String(params.username ?? '');
        avatar.value = response.user?.avatar || '';
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_NAME_KEY, userName.value);
        localStorage.setItem(USER_AVATAR_KEY, avatar.value);
        // 登录后从数据库加载用户设置
        const systemStore = useSystemStore();
        await systemStore.loadFromServer();
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
    userName.value = '';
    avatar.value = '';
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    localStorage.removeItem(USER_AVATAR_KEY);
    // 登出时清除用户个性化设置缓存
    const systemStore = useSystemStore();
    systemStore.clearUserSettings();
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
    userName,
    avatar,
    displayName,
    avatarText,
    isLoggedIn,
    loginAction,
    logout,
    getRouters,
    treeRouters,
  };
});
