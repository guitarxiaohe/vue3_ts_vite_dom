/******************************** 权限常量 ********************************/

const SUPER_PERMISSION = '*:*:*';
const DEFAULT_PERMISSION_NAMESPACE = 'system';

const DEFAULT_PERMISSION_ACTION_MAP = {
  CREATE: 'add',
  VIEW: 'list',
  EDIT: 'edit',
  COPY: 'add',
  DELETE: 'remove',
  IMPORT: 'import',
  EXPORT: 'export',
} as const;

/******************************** 权限工具 ********************************/

// 统一规范化权限值，避免大小写和空白差异
function normalizePermissionValue(permission?: string): string {
  return String(permission ?? '')
    .trim()
    .toUpperCase();
}

// 判断权限列表是否包含结构化权限串（而不是仅角色标识）
function hasStructuredPermissions(permissions: string[]): boolean {
  return permissions.some(
    (permission) =>
      permission === SUPER_PERMISSION ||
      permission.includes(':') ||
      permission.includes('_')
  );
}

// 构造权限 ID（规则：{ENTITY_KEY_UPPER}_{CODE}）
export function buildPermissionId(entityKey: string, code: string): string {
  const normalizedCode = normalizePermissionValue(code);
  const normalizedEntityKey = String(entityKey ?? '').trim();
  if (!normalizedEntityKey || !normalizedCode) return '';

  const action =
    DEFAULT_PERMISSION_ACTION_MAP[
      normalizedCode as keyof typeof DEFAULT_PERMISSION_ACTION_MAP
    ] ?? normalizedCode.toLowerCase();

  return `${DEFAULT_PERMISSION_NAMESPACE}:${normalizedEntityKey}:${action}`;
}

// 解析权限 ID（优先 permissionId，其次 permissionCode + entityKey）
export function resolvePermissionId(
  entityKey: string,
  permissionCode?: string,
  permissionId?: string
): string {
  const normalizedPermissionId = String(permissionId ?? '').trim();
  if (normalizedPermissionId) return normalizedPermissionId;

  return buildPermissionId(entityKey, permissionCode ?? '');
}

// 基于权限列表判断是否允许当前操作
export function hasPermissionByList(
  permissions: string[] | undefined,
  permissionId?: string
): boolean {
  if (!permissionId) return true;

  const normalizedPermissionId = normalizePermissionValue(permissionId);
  if (!normalizedPermissionId) return true;

  const normalizedPermissions = Array.isArray(permissions)
    ? permissions
        .map((permission) => normalizePermissionValue(permission))
        .filter(Boolean)
    : [];

  if (!normalizedPermissions.length) {
    return true;
  }

  if (normalizedPermissions.includes(SUPER_PERMISSION)) {
    return true;
  }

  // 兼容仅返回角色标识的环境，避免在未接通真实权限串前误隐藏全部按钮
  if (!hasStructuredPermissions(normalizedPermissions)) {
    return true;
  }

  return normalizedPermissions.includes(normalizedPermissionId);
}
