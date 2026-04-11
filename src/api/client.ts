import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types/api';

class HttpClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: 'dev-api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // 添加 token
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        console.log(
          `[Request] ${config.method?.toUpperCase()} ${config.url}`,
          config.params || config.data
        );
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response) => {
        console.log(`[Response] ${response.config.url}`, response.data);
        return response.data;
      },
      (error) => {
        console.error(`[Error] ${error.config?.url}`, error);

        // 统一错误处理
        if (error.response?.status === 401) {
          // 未授权，跳转登录
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }
    );
  }

  async request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.request<ApiResponse<T>>(config);
      return response;
    } catch (error: any) {
      // 返回统一的错误格式
      return {
        code: error.response?.status || 500,
        message: error.message || '请求失败',
        data: null as any,
        timestamp: new Date().toISOString(),
      };
    }
  }

  get<T = any>(url: string, params?: any): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', url, params });
  }

  post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data });
  }

  put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data });
  }

  patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PATCH', url, data });
  }

  delete<T = any>(url: string, params?: any): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, params });
  }
}

export const httpClient = new HttpClient();
