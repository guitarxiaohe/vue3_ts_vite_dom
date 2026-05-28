import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  login,
  register,
  getInfoApi,
  getRoutersApi,
} from '@/api/modules/user';
import { ROUTER_TREE_QUERY_KEY } from '@/api/modules/menu';
import { queryClient } from '@/api/query-client';
import { useSystemStore } from '@/stores';
import type {
  GetInfoResponse,
  LoginParams,
  RegisterParams,
  SysUser,
} from '@/types/user';
import type { SysRouter } from '@/types/menu';
import { ElMessage } from 'element-plus';

const TOKEN_KEY = 'token';
const USER_NAME_KEY = 'user_name';
const USER_AVATAR_KEY = 'user_avatar';
const USER_INFO_KEY = 'user_info';
const USER_ROLES_KEY = 'user_roles';
const USER_PERMISSIONS_KEY = 'user_permissions';

const ROUTER_KEY = 'routers';

function readJsonStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export const useUserStore = defineStore('user', () => {
  let bootstrapPromise: Promise<boolean> | null = null;

  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));
  const userName = ref<string>(localStorage.getItem(USER_NAME_KEY) || '');
  const avatar = ref<string>(localStorage.getItem(USER_AVATAR_KEY) || '');
  const userInfo = ref<SysUser | null>(
    readJsonStorage<SysUser | null>(USER_INFO_KEY, null)
  );
  const roles = ref<string[]>(readJsonStorage<string[]>(USER_ROLES_KEY, []));
  const permissions = ref<string[]>(
    readJsonStorage<string[]>(USER_PERMISSIONS_KEY, [])
  );
  const treeRouters = ref<SysRouter[] | null>(
    readJsonStorage<SysRouter[]>(ROUTER_KEY, [])
  );

  const isLoggedIn = computed(() => !!token.value);
  const displayName = computed(
    () =>
      userName.value ||
      userInfo.value?.nickName ||
      userInfo.value?.userName ||
      'XiaoHe'
  );
  const avatarText = computed(() =>
    displayName.value.slice(0, 1).toUpperCase()
  );

  const setUserInfo = (
    user: SysUser | null,
    nextRoles: string[] = roles.value,
    nextPermissions: string[] = permissions.value
  ) => {
    userInfo.value = user;
    userName.value = user?.nickName || user?.userName || '';
    avatar.value = user?.avatar || '';
    roles.value = nextRoles;
    permissions.value = nextPermissions;

    if (user) {
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
      localStorage.setItem(USER_NAME_KEY, userName.value);
      localStorage.setItem(USER_AVATAR_KEY, avatar.value);
    } else {
      localStorage.removeItem(USER_INFO_KEY);
      localStorage.removeItem(USER_NAME_KEY);
      localStorage.removeItem(USER_AVATAR_KEY);
    }

    localStorage.setItem(USER_ROLES_KEY, JSON.stringify(nextRoles));
    localStorage.setItem(USER_PERMISSIONS_KEY, JSON.stringify(nextPermissions));
  };

  const getInfoAction = async () => {
    try {
      const response = (await getInfoApi()) as GetInfoResponse;
      if (response.code === 200) {
        const user = response.user ?? response.data ?? null;
        const nextRoles = Array.isArray(response.roles) ? response.roles : [];
        const nextPermissions = Array.isArray(response.permissions)
          ? response.permissions
          : [];
        setUserInfo(user, nextRoles, nextPermissions);
        return user;
      }
      ElMessage.error(response.msg || response.message || '获取用户信息失败');
      return null;
    } catch (error: any) {
      ElMessage.error(error.message || '获取用户信息失败');
      return null;
    }
  };

  // 页面刷新后首次进入时，强制补一次用户详情与权限缓存
  const bootstrapSession = async (): Promise<boolean> => {
    if (!token.value) {
      return false;
    }

    if (bootstrapPromise) {
      return bootstrapPromise;
    }

    bootstrapPromise = (async () => {
      const user = await getInfoAction();
      if (!user) {
        return false;
      }

      // 刷新时同步补一次动态路由缓存，确保菜单与按钮权限一致
      await getRouters();
      return true;
    })();

    try {
      return await bootstrapPromise;
    } finally {
      bootstrapPromise = null;
    }
  };

  const loginAction = async (params: LoginParams) => {
    try {
      const response = (await login(params)) as any;

      if (response.code === 200) {
        token.value = response.token;
        localStorage.setItem(TOKEN_KEY, response.token);
        if (response.user) {
          setUserInfo(response.user);
        } else {
          userName.value = String(params.username ?? '');
          localStorage.setItem(USER_NAME_KEY, userName.value);
        }
        await getInfoAction();
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

  // 注册
  const registerAction = async (params: RegisterParams) => {
    try {
      const response = await register(params);
      if (response.code === 200) {
        ElMessage.success(response.msg || '注册成功');
        return { ok: true, msg: response.msg || '' };
      }
      ElMessage.error(response.msg || '注册失败');
      return { ok: false, msg: response.msg || '注册失败' };
    } catch (error: any) {
      const message = error?.message || error || '注册失败';
      ElMessage.error(message);
      return { ok: false, msg: String(message) };
    }
  };

  const logout = () => {
    token.value = null;
    setUserInfo(null, [], []);
    treeRouters.value = [];
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROUTER_KEY);
    localStorage.removeItem(USER_ROLES_KEY);
    localStorage.removeItem(USER_PERMISSIONS_KEY);
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
      queryClient.setQueryData(ROUTER_TREE_QUERY_KEY, routers);
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
    userInfo,
    roles,
    permissions,
    displayName,
    avatarText,
    isLoggedIn,
    loginAction,
    registerAction,
    getInfoAction,
    bootstrapSession,
    logout,
    getRouters,
    treeRouters,
  };
});
