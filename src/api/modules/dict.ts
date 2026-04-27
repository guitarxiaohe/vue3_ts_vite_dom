import { httpClient } from '../client';
import type { DictDataItem } from '@/types/dict';
import { getApiErrorText, isApiSuccess } from '@/utils/api-success';

/******************************** Query Key ********************************/

// 字典值全量缓存键
export const DICT_DATA_ALL_QUERY_KEY = ['system', 'dict', 'data', 'all'] as const;

/******************************** 接口方法 ********************************/

// 拉取全部字典值（分页接口，固定 pageSize=9999）
export async function fetchAllDictData(): Promise<DictDataItem[]> {
  const response = (await httpClient.get('/system/dict/data', {
    pageNum: 1,
    pageSize: 9999,
  })) as {
    code?: number;
    msg?: string;
    message?: string;
    rows?: DictDataItem[];
    data?: { rows?: DictDataItem[] };
  };

  if (!isApiSuccess(response.code ?? 0)) {
    throw new Error(getApiErrorText(response));
  }

  const rows = response.rows ?? response.data?.rows ?? [];
  return Array.isArray(rows) ? rows : [];
}
