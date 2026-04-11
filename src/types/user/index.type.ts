export interface User {
  id: number;
  username: string;
  email?: string;
  avatar?: string;
  createdAt?: string;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResponse {
  msg: string;
  code: number;
  token: string;
}
