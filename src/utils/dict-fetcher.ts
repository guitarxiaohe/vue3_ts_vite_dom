import { queryClient } from '@/api/query-client';
import { DICT_DATA_ALL_QUERY_KEY } from '@/api/modules/dict';
import type { DictDataItem } from '@/types/dict';

/******************************** 字典数据异步查询器 ********************************/

// 基于缓存的字典全量数据，为指定 dictType 创建带搜索/分页的 fetcher
export function createDictDataFetcher(dictType: string) {
  return async (params: {
    keyword?: string;
    page?: number;
    pageNum?: number;
    pageSize: number;
  }) => {
    const allDict =
      queryClient.getQueryData<DictDataItem[]>(DICT_DATA_ALL_QUERY_KEY) ?? [];

    let filtered = allDict.filter((item) => item.dictType === dictType);

    // 关键词搜索：匹配 label 或 value
    const keyword = String(params.keyword ?? '')
      .trim()
      .toLowerCase();
    if (keyword) {
      filtered = filtered.filter((item) => {
        const label = String(item.dictLabel ?? '').toLowerCase();
        const value = String(item.dictValue ?? '').toLowerCase();
        return label.includes(keyword) || value.includes(keyword);
      });
    }

    // 分页（兼容 AsyncSelectFetchParams.page 和 TableListQuery.pageNum）
    const page = (params.pageNum ?? params.page ?? 1) as number;
    const start = (page - 1) * params.pageSize;
    const items = filtered.slice(start, start + params.pageSize);

    return {
      rows: items.map((item) => ({
        ...item,
        label: item.dictLabel,
        value: item.dictValue || item.dictCode,
      })),
      total: filtered.length,
    };
  };
}
