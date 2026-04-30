import type { SysUser } from '@/types/user';
import type { SysRole } from '@/types/user/role.type';

/******************************** 类型定义 ********************************/

interface MockAuthUserSeed {
  userId: number;
  username: string;
  password: string;
  nickName: string;
  email: string;
  deptId: number;
  deptName: string;
  role: SysRole;
  status?: string;
}

export interface MockAuthUser extends SysUser {
  username: string;
  password: string;
  token: string;
}

/******************************** Mock 用户 ********************************/

const mockAuthUserSeeds: MockAuthUserSeed[] = [
  {
    userId: 1,
    username: 'admin',
    password: 'admin123',
    nickName: '系统管理员',
    email: 'admin@mock.com',
    deptId: 100,
    deptName: '平台研发部',
    role: {
      roleId: 1,
      roleName: '超级管理员',
      roleKey: 'admin',
      status: '0',
      roleSort: 1,
      admin: true,
    },
    status: '0',
  },
  {
    userId: 2,
    username: 'operator',
    password: 'operator123',
    nickName: '生产操作员',
    email: 'operator@mock.com',
    deptId: 101,
    deptName: '整车生产部',
    role: {
      roleId: 2,
      roleName: '生产操作员',
      roleKey: 'operator',
      status: '0',
      roleSort: 2,
    },
    status: '0',
  },
  {
    userId: 3,
    username: 'auditor',
    password: 'auditor123',
    nickName: '审计访客',
    email: 'auditor@mock.com',
    deptId: 102,
    deptName: '质量审计部',
    role: {
      roleId: 3,
      roleName: '审计访客',
      roleKey: 'auditor',
      status: '0',
      roleSort: 3,
    },
    status: '0',
  },
];

/******************************** 工具方法 ********************************/

// 构建完整 mock 用户
function buildMockAuthUser(seed: MockAuthUserSeed): MockAuthUser {
  return {
    userId: seed.userId,
    deptId: seed.deptId,
    userName: seed.username,
    username: seed.username,
    password: seed.password,
    nickName: seed.nickName,
    email: seed.email,
    status: seed.status ?? '0',
    sex: '0',
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${seed.username}`,
    dept: {
      deptId: seed.deptId,
      deptName: seed.deptName,
    },
    roles: [seed.role],
    roleIds: [seed.role.roleId ?? ''],
    roleId: seed.role.roleId,
    admin: Boolean(seed.role.admin),
    token: `mock-token-${seed.username}`,
    createBy: 'mock-system',
    createTime: '2026-04-30 09:00:00',
    remark: `Mock user for ${seed.role.roleName}`,
  };
}

// 克隆用户数据，避免直接暴露源对象
function cloneMockAuthUser(user: MockAuthUser): MockAuthUser {
  return {
    ...user,
    dept: user.dept ? { ...user.dept } : undefined,
    roles: user.roles?.map((role) => ({ ...role })),
    roleIds: user.roleIds ? [...user.roleIds] : undefined,
  };
}

/******************************** 导出方法 ********************************/

// 获取全部 mock 登录用户
export function listMockAuthUsers(): MockAuthUser[] {
  return mockAuthUserSeeds.map((seed) => buildMockAuthUser(seed));
}

// 根据账号密码查找 mock 用户
export function findMockAuthUserByCredentials(
  username: string,
  password: string
): MockAuthUser | undefined {
  const matched = listMockAuthUsers().find(
    (user) => user.username === username && user.password === password
  );

  return matched ? cloneMockAuthUser(matched) : undefined;
}

// 根据 token 查找 mock 用户
export function findMockAuthUserByToken(
  token?: string | null
): MockAuthUser | undefined {
  if (!token) {
    return undefined;
  }

  const matched = listMockAuthUsers().find((user) => user.token === token);
  return matched ? cloneMockAuthUser(matched) : undefined;
}

// 获取当前 token 对应的角色标识列表
export function getMockRoleKeysByToken(token?: string | null): string[] {
  const matched = findMockAuthUserByToken(token);
  return matched?.roles?.map((role) => String(role.roleKey ?? '')).filter(Boolean) ?? [];
}
