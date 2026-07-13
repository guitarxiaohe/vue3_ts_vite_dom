import { queryClient } from '@/api/query-client';
import { DICT_DATA_ALL_QUERY_KEY, fetchAllDictData } from '@/api/modules/dict';
import type { DictDataItem } from '@/types/dict';

/******************************** 字典数据缓存读取 ********************************/

/**
 * 确保字典数据已加载（若缓存未命中则拉取），然后按 dictType 返回映射表
 *
 * 调用时机：不确定缓存是否已播种时使用，如页面首次加载、工具函数等
 *
 * @example
 * const map = await fetchDictMap('cms_meeting_status');  // 等数据加载完再返回
 */

export async function fetchDictMap(
  dictType: string | string[]
): Promise<Record<string, string> | Record<string, Record<string, string>>> {
  // 确保缓存已播种（已有数据则直接返回，没有则拉取并等待）
  await queryClient.ensureQueryData<DictDataItem[]>({
    queryKey: DICT_DATA_ALL_QUERY_KEY,
    queryFn: fetchAllDictData,
    staleTime: 30 * 60 * 1000,
  });

  return buildDictMap(dictType);
}

/**
 * 同步从缓存中按 dictType 获取字典映射表
 *
 * ⚠️ 前提：缓存必须已播种（useAllDictDataQuery 或 fetchDictMap 已调用并完成）
 * 缓存为空时返回空映射，不会报错也不会自动拉取
 *
 * @example
 * getDictMap('cms_meeting_status')           // { ACTIVE: '进行中', CLOSING: '关闭中' }
 * getDictMap(['cms_meeting_status', 'gender']) // { cms_meeting_status: { ... }, gender: { ... } }
 */
export function getDictMap(
  dictType: string | string[]
): Promise<Record<string, string> | Record<string, Record<string, string>>> {
  return buildDictMap(dictType);
}

/** 内部实现：从缓存构建 dictValue → dictLabel 映射 */
async function buildDictMap(
  dictType: string | string[]
): Promise<Record<string, string> | Record<string, Record<string, string>>> {
  let allDict =
    queryClient.getQueryData<DictDataItem[]>(DICT_DATA_ALL_QUERY_KEY) ?? [];
  const types = Array.isArray(dictType) ? dictType : [dictType];
  if (allDict.length === 0) {
    return fetchDictMap(dictType);
  }
  const result: Record<string, Record<string, string>> = {};
  for (const type of types) {
    const map: Record<string, string> = {};
    allDict
      .filter((item) => item.dictType === type)
      .forEach((item) => {
        const key = String(item.dictValue ?? '');
        if (key) map[key] = item.dictLabel ?? key;
      });
    result[type] = map;
  }

  return Array.isArray(dictType) ? result : (result[dictType] ?? {});
}

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
