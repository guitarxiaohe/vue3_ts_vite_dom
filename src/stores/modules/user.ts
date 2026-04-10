import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useAppQuery, useAppMutation } from '@/composables/useQuery'
import { getUsers, getUserById, createUser, updateUser, deleteUser, type User, type UserFilters } from '@/api/modules/user'

export const useUserStore = defineStore('user', () => {
  const queryClient = useQueryClient()

  // 状态
  const currentPage = ref(1)
  const pageSize = ref(10)
  const filters = ref<UserFilters>({})

  // 计算属性
  const queryKey = computed(() => ['users', currentPage.value, pageSize.value, filters.value])

  // 查询：用户列表
  const usersQuery = useAppQuery(
    queryKey,
    () => getUsers({
      page: currentPage.value,
      limit: pageSize.value,
      ...filters.value
    }),
    {
      staleTime: 5 * 60 * 1000, // 5分钟新鲜数据
      cacheTime: 10 * 60 * 1000
    }
  )

  // 查询：用户详情（带参数）
  const getUserDetail = (id: number) => {
    return useAppQuery(
      ['user', id],
      () => getUserById(id),
      {
        enabled: !!id,
        staleTime: 5 * 60 * 1000
      }
    )
  }

  // 变更：创建用户
  const createUserMutation = useAppMutation(createUser, {
    onSuccess: () => {
      // 刷新用户列表
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
  })

  // 变更：更新用户
  const updateUserMutation = useAppMutation(
    ({ id, data }: { id: number; data: Partial<User> }) => updateUser(id, data),
    {
      onSuccess: (data, variables) => {
        // 刷新用户列表和详情
        queryClient.invalidateQueries({ queryKey: ['users'] })
        queryClient.invalidateQueries({ queryKey: ['user', variables.id] })
      }
    }
  )

  // 变更：删除用户
  const deleteUserMutation = useAppMutation(deleteUser, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
  })

  // 操作方法
  const setPage = (page: number) => {
    currentPage.value = page
  }

  const setFilters = (newFilters: UserFilters) => {
    filters.value = { ...filters.value, ...newFilters }
    currentPage.value = 1 // 重置页码
  }

  const resetFilters = () => {
    filters.value = {}
    currentPage.value = 1
  }

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  return {
    // 状态
    currentPage,
    pageSize,
    filters,

    // 查询
    usersQuery,
    getUserDetail,

    // 变更
    createUserMutation,
    updateUserMutation,
    deleteUserMutation,

    // 方法
    setPage,
    setFilters,
    resetFilters,
    refresh
  }
})
