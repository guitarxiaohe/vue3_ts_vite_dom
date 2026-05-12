import { httpClient } from '../client';

/******************************** 代码生成 API ********************************/

// 获取已导入表列表
export function listGenTable(params?: Record<string, any>) {
  return httpClient.get('/tool/gen/list', params);
}

// 获取单表详情（含列信息）
export function getGenTable(tableId: number | string) {
  return httpClient.get(`/tool/gen/${tableId}`);
}

// 获取数据库表列表（未导入）
export function listDbTable(params?: Record<string, any>) {
  return httpClient.get('/tool/gen/db/list', params);
}

// 导入表结构（tables 为逗号分隔的表名，通过 URL 参数传递）
export function importTable(tables: string) {
  return httpClient.post(
    `/tool/gen/importTable?tables=${encodeURIComponent(tables)}`
  );
}

// 编辑/保存生成配置
export function updateGenTable(data: Record<string, any>) {
  return httpClient.put('/tool/gen', data);
}

// 删除生成表
export function deleteGenTable(tableIds: string) {
  return httpClient.delete(`/tool/gen/${tableIds}`);
}

// 预览代码
export function previewCode(tableId: number | string) {
  return httpClient.get(`/tool/gen/preview/${tableId}`);
}

// 生成代码（下载 ZIP）
export function downloadCode(tableName: string) {
  return httpClient.get(`/tool/gen/download/${tableName}`);
}

// 同步数据库结构
export function synchDb(tableName: string) {
  return httpClient.get(`/tool/gen/synchDb/${tableName}`);
}

// 获取表列列表
export function listGenTableColumn(tableId: number | string) {
  return httpClient.get(`/tool/gen/column/${tableId}`);
}

/******************************** 实体配置 API ********************************/

// 获取实体配置列表
export function listEntityConfig() {
  return httpClient.get('/system/fieldConfig/listByEntityKey/__all__');
}
