import type { ColumnsItem } from '@/components/table-entlty/index.type';
import { httpClient } from '../client';
import type {
  FieldConfig,
  LoginParams,
  LoginResponse,
  MenuItem,
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
