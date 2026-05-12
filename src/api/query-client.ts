import { QueryClient } from '@tanstack/vue-query';

/******************************** 全局 QueryClient ********************************/

// 独立导出，供非组件上下文（工具函数）读取 TanStack 缓存
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retryDelay: 1000,
    },
    mutations: {
      retry: 0,
    },
  },
});
