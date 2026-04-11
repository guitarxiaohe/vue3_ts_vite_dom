import { httpClient } from '../client';
import type { LoginParams, LoginResponse } from '@/types/user';

export const login = (data: LoginParams) => {
  return httpClient.post<LoginResponse>('/login', data);
};
