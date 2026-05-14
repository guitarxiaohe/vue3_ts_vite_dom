import { httpClient } from '../client';
import type { DataStructure } from '@/types/user';

/******************************** 动态实体 API ********************************/

// 获取实体字段配置（无分页参数时返回 field_config，有分页参数时返回业务数据）
export function getByEntityKeyAndFieldKeyApi(entityKey: string) {
  return httpClient.get('/system/fieldConfig/listByEntityKey/' + entityKey);
}

// 根据实体标识分页拉取业务数据
export function getListByEntityKeyApi(
  entityKey: string,
  params?: Record<string, unknown>
) {
  return httpClient.get(
    '/system/fieldConfig/listByEntityKey/' + encodeURIComponent(entityKey),
    params
  );
}

// 删除实体数据（支持批量，ids 逗号分隔）
export function deleteByEntityKeyAndIdApi(entityKey: string, ids: string) {
  return httpClient.delete(
    '/system/fieldConfig/delete/' + entityKey + '/' + ids
  );
}

// 批量更新字段排序
export function fieldConfigSort(data: DataStructure) {
  return httpClient.put('/system/fieldConfig/sort', data);
}

// 新增实体数据行
export function addEntityRowApi(
  entityKey: string,
  data: Record<string, unknown>
) {
  return httpClient.post('/system/fieldConfig/data/' + entityKey, data);
}

// 修改实体数据行
export function updateEntityRowApi(
  entityKey: string,
  id: number | string,
  data: Record<string, unknown>
) {
  return httpClient.put(
    '/system/fieldConfig/data/' + entityKey + '/' + id,
    data
  );
}
