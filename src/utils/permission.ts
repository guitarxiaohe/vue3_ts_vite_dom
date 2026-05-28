import { useUserStore } from '@/stores/modules/user';
import {
  buildPermissionId,
  hasPermissionByList,
  resolvePermissionId,
} from './permission-helpers';

/**
 * 提取权限 code（取最后一个 "_" 之后的片段）
 */
export const getPermissionCode = (permissionId: string): string => {
  const code = permissionId.split('_').pop();
  return code?.toUpperCase() ?? '';
};

/**
 * 判断是否为查看权限
 */
export const isViewPermissionId = (permissionId: string): boolean => {
  return getPermissionCode(permissionId) === 'VIEW';
};

/**
 * 权限校验工具
 */
export const usePermission = () => {
  const userStore = useUserStore();

  const hasPermission = (permissionId?: string) => {
    return hasPermissionByList(userStore.permissions, permissionId);
  };

  return {
    hasPermission,
    buildPermissionId,
    resolvePermissionId,
  };
};
