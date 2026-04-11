import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/vue-query';
import { ElMessage } from 'element-plus';
import type { ApiResponse } from '@/types/api';

export function useAppQuery<TData = any, TError = Error>(
  key: string | string[],
  fetcher: () => Promise<ApiResponse<TData>>,
  options?: UseQueryOptions<TData, TError>
) {
  return useQuery<TData, TError>({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      const response = await fetcher();
      if (response.code !== 0) {
        throw new Error(response.message);
      }
      return response.data;
    },
    ...options,
  });
}

export function useAppPaginatedQuery<TData = any>(
  key: string | string[],
  fetcher: (params: any) => Promise<ApiResponse<TData>>,
  params: () => Record<string, any>,
  options?: UseQueryOptions<TData, Error>
) {
  return useQuery<TData, Error>({
    queryKey: [...(Array.isArray(key) ? key : [key]), params],
    queryFn: async () => {
      const response = await fetcher(params());
      if (response.code !== 0) {
        throw new Error(response.message);
      }
      return response.data;
    },
    ...options,
  });
}

export function useAppMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: UseMutationOptions<TData, Error, TVariables>
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables) => {
      const response = await mutationFn(variables);
      if (response.code !== 0) {
        ElMessage.error(response.message);
        throw new Error(response.message);
      }
      ElMessage.success('操作成功');
      return response.data;
    },
    ...options,
    onSuccess: (_data, _variables, _context) => {
      queryClient.invalidateQueries();
    },
    onError: (error, _variables, _context) => {
      ElMessage.error(error.message);
    },
  });
}
