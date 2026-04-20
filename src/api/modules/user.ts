import type { ColumnsItem } from '@/components/table-entity/index.type';
import { httpClient } from '../client';
import type {
  LoginParams,
  LoginResponse,
  MenuItem,
  SysUserDetailApiResponse,
} from '@/types/user';

export const login = (data: LoginParams) => {
  return httpClient.post<LoginResponse>('/login', data);
};

export const getRoutersApi = () => {
  return httpClient.post<MenuItem[]>('/routers');
};

// 根据实体标识查询字段配置列表
export const getByEntityKeyAndFieldKeyApi = (entityKey: string) => {
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
  return httpClient.get(
    `/system/user/${userId}`
  ) as Promise<SysUserDetailApiResponse>;
};
