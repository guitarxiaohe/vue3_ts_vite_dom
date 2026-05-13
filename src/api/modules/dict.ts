import { httpClient } from '../client';
import type { DictDataItem } from '@/types/dict';
import { getApiErrorText, isApiSuccess } from '@/utils/api-success';

/******************************** Query Key ********************************/

// 字典值全量缓存键
export const DICT_DATA_ALL_QUERY_KEY = [
  'system',
  'dict',
  'data',
  'all',
] as const;

/******************************** 接口方法 ********************************/

// 拉取全部字典值（分页接口，固定 pageSize=9999）
export async function fetchAllDictData(): Promise<DictDataItem[]> {
  const response = (await httpClient.get('/system/dict/data/list', {
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

/******************************** 字典类型 CRUD ********************************/

// 新增字典类型
export function addDictType(data: Record<string, unknown>) {
  return httpClient.post('/system/dict/type', data);
}

// 修改字典类型
export function updateDictType(data: Record<string, unknown>) {
  return httpClient.put('/system/dict/type', data);
}

/******************************** 字典值 CRUD ********************************/

// 新增字典值
export function addDictData(data: Record<string, unknown>) {
  return httpClient.post('/system/dict/data', data);
}

// 修改字典值
export function updateDictData(data: Record<string, unknown>) {
  return httpClient.put('/system/dict/data', data);
}

// 批量删除字典值
export function deleteDictData(dictCodes: (number | string)[]) {
  return httpClient.delete(`/system/dict/data/${dictCodes.join(',')}`);
}
