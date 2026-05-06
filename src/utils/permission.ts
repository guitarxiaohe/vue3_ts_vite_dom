import { useUserStore } from '@/stores/modules/user';

/**
 * 构造权限 ID（规则：{ENTITY_KEY_UPPER}_{CODE}）
 */
export const buildPermissionId = (entityKey: string, code: string): string => {
  if (!entityKey || !code) return '';
  return `${entityKey.toUpperCase()}_${code}`;
};

/**
 * 解析权限 ID（优先 permissionId，其次 permissionCode + entityKey）
 */
export const resolvePermissionId = (
  entityKey: string,
  permissionCode?: string,
  permissionId?: string
): string => {
  if (permissionId) return permissionId;
  if (permissionCode) return buildPermissionId(entityKey, permissionCode);
  return '';
};

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
    if (!permissionId) return true;
    const routers = userStore.treeRouters ?? [];
    const normalizedPermission = permissionId.toUpperCase();

    const walkRouters = (items: typeof routers): boolean => {
      return items.some((item) => {
        const currentPermission = String(item.meta?.title ?? '').toUpperCase();
        if (currentPermission === normalizedPermission) {
          return true;
        }
        return item.children ? walkRouters(item.children) : false;
      });
    };

    return walkRouters(routers);
  };

  return {
    hasPermission,
    buildPermissionId,
    resolvePermissionId,
  };
};
