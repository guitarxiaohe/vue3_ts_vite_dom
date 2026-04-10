// 通用响应结构
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: string
}

// 分页参数
export interface PaginationParams {
  page: number
  limit: number
  sort?: string
  order?: 'asc' | 'desc'
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// 查询选项
export interface QueryOptions<T = any> {
  enabled?: boolean
  staleTime?: number      // 数据被认为"新鲜"的时间（毫秒）
  cacheTime?: number      // 缓存保留时间（毫秒）
  refetchOnWindowFocus?: boolean
  refetchInterval?: number
  retry?: number
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}
