import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types/api';
import { useUserStore } from '@/stores';
import { ElMessage, ElMessageBox } from 'element-plus';
import { i18n } from '@/i18n';

class HttpClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_APP_BASE_API || '/dev-api',
      timeout: 60 * 60 * 1000,
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
        // 添加国际化语言头
        const locale = localStorage.getItem('app_locale') || 'zh-CN';
        config.headers['Accept-Language'] = locale;
        // console.log(
        //   '%c[Request] ' + `${config.method?.toUpperCase()} ${config.url}`,
        //   'color: red; background-color: yellow; font-weight: bold;',
        //   config.params || config.data
        // );
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response) => {
        if (response.data?.code === 401) {
          const { t } = i18n.global;
          // 统一错误处理
          const { logout } = useUserStore();

          ElMessageBox.confirm(
            t('user.tokenExpiredDesc'),
            t('user.tokenExpired'),
            {
              confirmButtonText: t('common.confirm'),
              cancelButtonText: t('common.cancel'),
              type: 'warning',
            }
          )
            .then(() => {
              logout();
              const fullPath =
                window.location.pathname + window.location.search;
              window.location.href = `/login?redirect=${encodeURIComponent(fullPath)}`;
            })
            .catch(() => {});
          return Promise.reject(response.data);
        } else if (response.data?.code == 404) {
          ElMessage.error('未找到当前接口');
          return Promise.reject(response.data.message);
        } else if (response.data?.code == 500) {
          ElMessage.error(response?.data?.msg || '后端问题');
          return Promise.reject(response.data.msg);
        } else {
          return Promise.resolve(response?.data);
        }
      },
      (error) => {
        console.error(`[Error] ${error.config?.url}`, error);
        ElMessage.error(this.resolveErrorMessage(error));
        return Promise.reject(error);
      }
    );
  }

  private resolveErrorMessage(error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data as
        | { msg?: string; message?: string }
        | undefined;
      if (data?.msg || data?.message) {
        return data.msg || data.message || '后端问题';
      }
      if (status === 502) {
        return '服务暂时不可用，请稍后重试';
      }
      if (status === 504) {
        return '服务响应超时，请稍后重试';
      }
      if (status) {
        return `请求失败（${status}）`;
      }
      return error.message || '网络异常，请稍后重试';
    }
    if (error instanceof Error) {
      return error.message || '后端问题';
    }
    return '后端问题';
  }

  async request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.request<
        ApiResponse<T>,
        ApiResponse<T>
      >(config);
      return response;
    } catch (error: any) {
      // 返回统一的错误格式
      return Promise.reject(error);
    }
  }

  get<T = any>(url: string, params?: any): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', url, params });
  }

  post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data });
  }

  postUpload<T = any>(
    url: string,
    data: FormData,
    onProgress?: (percent: number) => void
  ): Promise<T> {
    return this.instance.request<T, T>({
      method: 'POST',
      url,
      data,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress
        ? (e) => {
            if (e.total) {
              onProgress(Math.round((e.loaded / e.total) * 100));
            }
          }
        : undefined,
    });
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
