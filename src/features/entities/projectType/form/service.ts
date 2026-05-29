import { httpClient } from '@/api/client';
import type { TableListQuery } from '@/components/table-entity/index.type';
import { getApiErrorText, isApiSuccess } from '@/utils/api-success';

/******************************** 项目类型表单服务 ********************************/

export interface CreateProjectTypePayload {
  typeName?: string;
  typeCode?: string;
  remark?: string;
}

export interface EditProjectTypePayload {
  typeId?: string | number;
  typeName?: string;
  typeCode?: string;
  remark?: string;
}

export function createProjectType(payload: CreateProjectTypePayload) {
  return httpClient.post('/system/type', payload);
}

export function editProjectType(payload: EditProjectTypePayload) {
  return httpClient.put('/system/type', payload);
}

export function listProjectTypes(params?: TableListQuery) {
  return httpClient.get('/system/type/list', params);
}

export async function listProjectTypeRows(
  params: TableListQuery = { pageNum: 1, pageSize: 20 }
) {
  const response = (await listProjectTypes(params)) as {
    code?: number;
    msg?: string;
    message?: string;
    rows?: Record<string, unknown>[];
    total?: number;
  };

  if (response.code != null && !isApiSuccess(response.code)) {
    throw new Error(getApiErrorText(response));
  }

  return {
    total: Number(response.total) || 0,
    rows: (response.rows ?? []) as Record<string, any>[],
  };
}

export async function deleteProjectTypes(ids: Array<string | number>) {
  const idPath = ids.map(String).join(',');
  const response = (await httpClient.delete(`/system/type/${idPath}`)) as {
    code?: number;
    msg?: string;
    message?: string;
  };

  if (response.code != null && !isApiSuccess(response.code)) {
    throw new Error(getApiErrorText(response));
  }
}
