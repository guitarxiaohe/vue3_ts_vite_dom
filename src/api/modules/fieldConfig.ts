import { httpClient } from '../client';
import type { FieldConfig, FieldConfigQuery } from '@/types/field-config';
import { getApiErrorText, isApiSuccess } from '@/utils/api-success';
import { isMockEnabled } from '@/utils/is-mock';

/******************************** Mock 数据 ********************************/

const nowTs = () => Date.now();
let mockIdSeed = 200;

let mockFieldConfigs: FieldConfig[] = [
  {
    id: 1,
    entityKey: 'user',
    fieldKey: 'userName',
    fieldName: '用户名',
    fieldType: 'input',
    fieldRole: null,
    sort: 1,
    isFuzzySearch: 1,
    isVisible: 1,
    fixed: null,
    createdBy: 1,
    createdTime: nowTs(),
    updatedBy: 1,
    updatedTime: nowTs(),
  },
  {
    id: 2,
    entityKey: 'user',
    fieldKey: 'deptId',
    fieldName: '所属部门',
    fieldType: 'select',
    fieldRole: null,
    selectEntityKey: 'dept',
    sort: 2,
    isFuzzySearch: 0,
    isVisible: 1,
    fixed: null,
    createdBy: 1,
    createdTime: nowTs(),
    updatedBy: 1,
    updatedTime: nowTs(),
  },
  {
    id: 3,
    entityKey: 'fileInfo',
    fieldKey: 'fileOriginName',
    fieldName: '文件名称',
    fieldType: 'input',
    fieldRole: null,
    sort: 1,
    isFuzzySearch: 1,
    isVisible: 1,
    fixed: 'left',
    createdBy: 1,
    createdTime: nowTs(),
    updatedBy: 1,
    updatedTime: nowTs(),
  },
];

/******************************** 接口方法 ********************************/

// 查询字段配置列表
export function listFieldConfig(params: FieldConfigQuery) {
  if (isMockEnabled()) {
    const pageNum = Number(params.pageNum ?? 1);
    const pageSize = Number(params.pageSize ?? 10);
    const filters = { ...params };

    const rows = mockFieldConfigs.filter((item) => {
      if (
        filters.entityKey &&
        !String(item.entityKey ?? '').includes(String(filters.entityKey))
      ) {
        return false;
      }
      if (
        filters.fieldKey &&
        !String(item.fieldKey ?? '').includes(String(filters.fieldKey))
      ) {
        return false;
      }
      if (
        filters.fieldName &&
        !String(item.fieldName ?? '').includes(String(filters.fieldName))
      ) {
        return false;
      }
      if (filters.fieldType && item.fieldType !== filters.fieldType) {
        return false;
      }
      if (filters.fieldRole && item.fieldRole !== filters.fieldRole) {
        return false;
      }
      return true;
    });

    const start = (pageNum - 1) * pageSize;

    return Promise.resolve({
      code: 200,
      msg: '操作成功',
      total: rows.length,
      rows: rows.slice(start, start + pageSize),
    } as any);
  }

  return httpClient.get('/system/fieldConfig/list', params);
}

// 查询字段配置详情
export function getFieldConfig(id: number | string) {
  if (isMockEnabled()) {
    return Promise.resolve({
      code: 200,
      msg: '操作成功',
      data:
        mockFieldConfigs.find((item) => Number(item.id) === Number(id)) ?? null,
    } as any);
  }

  return httpClient.get(`/system/fieldConfig/${id}`);
}

// 新增字段配置
export function addFieldConfig(data: FieldConfig) {
  if (isMockEnabled()) {
    mockIdSeed += 1;
    mockFieldConfigs.unshift({
      ...data,
      id: mockIdSeed,
      createdTime: nowTs(),
      updatedTime: nowTs(),
    });

    return Promise.resolve({
      code: 200,
      msg: '操作成功',
    } as any);
  }

  return httpClient.post('/system/fieldConfig', data);
}

// 修改字段配置
export function updateFieldConfig(data: FieldConfig) {
  if (isMockEnabled()) {
    mockFieldConfigs = mockFieldConfigs.map((item) =>
      Number(item.id) === Number(data.id)
        ? { ...item, ...data, updatedTime: nowTs() }
        : item
    );

    return Promise.resolve({
      code: 200,
      msg: '操作成功',
    } as any);
  }

  return httpClient.put('/system/fieldConfig', data);
}

// 删除字段配置
export function deleteFieldConfig(ids: Array<number | string>) {
  if (isMockEnabled()) {
    const idSet = new Set(ids.map((item) => Number(item)));
    mockFieldConfigs = mockFieldConfigs.filter(
      (item) => !idSet.has(Number(item.id))
    );

    return Promise.resolve({
      code: 200,
      msg: '操作成功',
    } as any);
  }

  return httpClient.delete(`/system/fieldConfig/${ids.join(',')}`);
}

// 统一校验 AjaxResult 风格响应
export function assertAjaxOk(res: { code?: number; msg?: string; message?: string }) {
  if (!isApiSuccess(res.code ?? 0)) {
    throw new Error(getApiErrorText(res));
  }
}
