import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import {
  DICT_DATA_ALL_QUERY_KEY,
  fetchAllDictData,
} from '@/api/modules/dict';

/******************************** 字典缓存查询 ********************************/

// 首次请求后缓存字典值，默认 30 分钟内命中缓存
export function useAllDictDataQuery(enabled = true) {
  return useQuery({
    queryKey: DICT_DATA_ALL_QUERY_KEY,
    queryFn: fetchAllDictData,
    enabled: computed(() => enabled),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
