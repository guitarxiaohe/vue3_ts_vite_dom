import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/vue-query'
import { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/types/api'

// 通用查询 Hook
export function useAppQuery<TData = any, TError = Error>(
  key: string | string[],
  fetcher: () => Promise<ApiResponse<TData>>,
  options?: UseQueryOptions<TData, TError>
) {
  return useQuery<TData, TError>({

    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      const response = await fetcher()
      if (response.code !== 0) {
        throw new Error(response.message)
      }
      return response.data
    },
    ...options
  })
}

// 通用分页查询 Hook
export function useAppPaginatedQuery<TData = any>(
  key: string | string[],
  fetcher: (params: any) => Promise<ApiResponse<TData>>,
  params: () => Record<string, any>,
  options?: UseQueryOptions<TData, Error>
) {
  return useQuery<TData, Error>({
    queryKey: [...(Array.isArray(key) ? key : [key]), params],
    queryFn: async () => {
      const response = await fetcher(params())
      if (response.code !== 0) {
        throw new Error(response.message)
      }
      return response.data
    },
    ...options
  })
}

// 通用 Mutation Hook
export function useAppMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: UseMutationOptions<TData, Error, TVariables>
) {
  const queryClient = useQueryClient()

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables) => {
      const response = await mutationFn(variables)
      if (response.code !== 0) {
        ElMessage.error(response.message)
        throw new Error(response.message)
      }
      ElMessage.success('操作成功')
      return response.data
    },
    ...options,
    onSuccess: (data, variables, context) => {
      // 默认刷新所有查询
      queryClient.invalidateQueries()
      options?.onSuccess?.(data, variables, context)
    },
    onError: (error, variables, context) => {
      ElMessage.error(error.message)
      options?.onError?.(error, variables, context)
    }
  })
}
