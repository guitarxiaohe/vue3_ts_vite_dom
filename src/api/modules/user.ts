import type { ColumnsItem } from '@/components/table-entity/index.type';
import { httpClient } from '../client';
import type {
  DataStructure,
  LoginParams,
  LoginResponse,
  MenuItem,
  SysUser,
  SysUserDetailApiResponse,
} from '@/types/user';
import { isMockEnabled } from '@/utils/is-mock';

const nowTs = () => new Date().toISOString();

const mockEntityColumns: Record<string, ColumnsItem[]> = {
  user: [
    { key: 'userId', dataKey: 'userId', title: '用户ID', width: 90 },
    { key: 'userName', dataKey: 'userName', title: '账号', width: 120 },
    { key: 'nickName', dataKey: 'nickName', title: '昵称', width: 120 },
    { key: 'email', dataKey: 'email', title: '邮箱', width: 220 },
  ] as ColumnsItem[],
  fileInfo: [
    { key: 'fileId', dataKey: 'fileId', title: '文件ID', width: 90 },
    {
      key: 'fileOriginName',
      dataKey: 'fileOriginName',
      title: '文件名称',
      width: 180,
    },
    { key: 'fileSuffix', dataKey: 'fileSuffix', title: '后缀', width: 100 },
    { key: 'fileSizeInfo', dataKey: 'fileSizeInfo', title: '大小', width: 110 },
  ] as ColumnsItem[],
};

const mockUserRows: SysUser[] = Array.from({ length: 26 }, (_, i) => ({
  userId: i + 1,
  userName: `user_${i + 1}`,
  nickName: `用户${i + 1}`,
  email: `user${i + 1}@mock.com`,
  status: i % 2 === 0 ? '0' : '1',
  sex: String(i % 3),
  dept: {
    deptId: 100 + (i % 4),
    deptName: ['研发部', '产品部', '运营部', '测试部'][i % 4],
  },
  roles: [
    {
      roleId: 1,
      roleName: '普通角色',
      roleKey: 'common',
    },
  ],
}));

export const login = (data: LoginParams) => {
  return httpClient.post<LoginResponse>('/login', data);
};

export const getRoutersApi = () => {
  return httpClient.post<MenuItem[]>('/routers');
};

// 根据实体标识查询字段配置列表
export const getByEntityKeyAndFieldKeyApi = (entityKey: string) => {
  if (isMockEnabled()) {
    return Promise.resolve({
      code: 200,
      message: 'mock',
      msg: 'mock',
      data: mockEntityColumns[entityKey] ?? [],
      timestamp: nowTs(),
    } as any);
  }
  return httpClient.get<ColumnsItem[]>(
    '/system/fieldConfig/listByEntityKey/' + entityKey
  );
};

/**
 * 根据实体标识和 id 删除
 * 支持批量删除，多个 id 用逗号分隔
 * @param entityKey
 * @param ids
 * @returns
 */
export const deleteByEntityKeyAndIdApi = (entityKey: string, ids: string) => {
  if (isMockEnabled()) {
    return Promise.resolve({
      code: 200,
      message: `mock deleted ${entityKey}: ${ids}`,
      msg: '操作成功',
      timestamp: nowTs(),
    } as any);
  }
  const path = entityKey + '/' + ids;
  return httpClient.delete('/system/fieldConfig/delete/' + path);
};

/**
 * 根据实体标识分页拉取列表（query：pageNum、pageSize 及 dataParams）
 * 与 getByEntityKeyAndFieldKeyApi 同一路径时，由后端按是否带分页参数等区分返回（字段配置 vs 行数据）
 */
export const getListByEntityKeyApi = (
  entityKey: string,
  params?: Record<string, unknown>
) => {
  if (isMockEnabled()) {
    const pageNum = Number(params?.pageNum ?? 1);
    const pageSize = Number(params?.pageSize ?? 10);
    const start = (pageNum - 1) * pageSize;
    const rowsSource = entityKey === 'user' ? mockUserRows : [];
    const rows = rowsSource.slice(start, start + pageSize);
    return Promise.resolve({
      code: 200,
      message: 'mock',
      msg: 'mock',
      total: rowsSource.length,
      rows,
      timestamp: nowTs(),
    } as any);
  }
  return httpClient.get(
    '/system/fieldConfig/listByEntityKey/' + encodeURIComponent(entityKey),
    params
  );
};

/**
 * 根据用户 ID 查询详情（code=200，msg；data 为用户；根级可有 roleIds、roles、posts）
 */
export const getSysUserById = (
  userId: string | number
): Promise<SysUserDetailApiResponse> => {
  if (isMockEnabled()) {
    const uid = Number(userId);
    const user =
      mockUserRows.find((u) => Number(u.userId) === uid) ?? mockUserRows[0];
    return Promise.resolve({
      code: 200,
      message: 'mock',
      msg: 'mock',
      data: user,
      roleIds: (user.roles ?? []).map((r) => String(r.roleId ?? '')),
      roles: user.roles,
      posts: [],
      timestamp: nowTs(),
    } as SysUserDetailApiResponse);
  }
  return httpClient.get(
    `/system/user/${userId}`
  ) as Promise<SysUserDetailApiResponse>;
};

// ('/system/fieldConfig/orst');

export const fieldConfigSort = (data: DataStructure) => {
  return httpClient.put(
    '/system/fieldConfig/sort',
    data
  ) as Promise<SysUserDetailApiResponse>;
};

/**
 *
 *
 * {
  "entityKey": "user",
  "items": [
    { "id": 101, "sort": 1 },
    { "id": 102, "sort": 2 },
    { "id": 103, "sort": 3 }
  ]
}
 */
