import { httpClient } from '../client';
import type { LoginParams, LoginResponse, MenuItem } from '@/types/user';

export const login = (data: LoginParams) => {
  return httpClient.post<LoginResponse>('/login', data);
};

export const getRoutersApi = () => {
  return httpClient.post<MenuItem[]>('/routers');
};
