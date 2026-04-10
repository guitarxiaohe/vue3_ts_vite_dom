import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useAppQuery, useAppPaginatedQuery, useAppMutation } from '@/composables/useQuery'
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, type Product, type ProductFilters } from '@/api/modules/product'

export const useProductStore = defineStore('product', () => {
  const queryClient = useQueryClient()

  // 状态
  const currentPage = ref(1)
  const pageSize = ref(20)
  const filters = ref<ProductFilters>({})

  // 查询：产品列表（带分页）
  const productsQuery = useAppPaginatedQuery(
    ['products'],
    getProducts,
    () => ({
      page: currentPage.value,
      limit: pageSize.value,
      ...filters.value
    }),
    {
      staleTime: 3 * 60 * 1000, // 3分钟新鲜数据
      keepPreviousData: true     // 切换分页时保留旧数据
    }
  )

  // 查询：产品详情
  const getProductDetail = (id: number) => {
    return useAppQuery(
      ['product', id],
      () => getProductById(id),
      {
        enabled: !!id,
        staleTime: 5 * 60 * 1000
      }
    )
  }

  // 变更：创建产品
  const createProductMutation = useAppMutation(createProduct, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })

  // 变更：更新产品
  const updateProductMutation = useAppMutation(
    ({ id, data }: { id: number; data: Partial<Product> }) => updateProduct(id, data),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: ['products'] })
        queryClient.invalidateQueries({ queryKey: ['product', variables.id] })
      }
    }
  )

  // 变更：删除产品
  const deleteProductMutation = useAppMutation(deleteProduct, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })

  // 操作方法
  const setPage = (page: number) => {
    currentPage.value = page
  }

  const setFilters = (newFilters: ProductFilters) => {
    filters.value = { ...filters.value, ...newFilters }
    currentPage.value = 1
  }

  const resetFilters = () => {
    filters.value = {}
    currentPage.value = 1
  }

  return {
    currentPage,
    pageSize,
    filters,
    productsQuery,
    getProductDetail,
    createProductMutation,
    updateProductMutation,
    deleteProductMutation,
    setPage,
    setFilters,
    resetFilters
  }
})
