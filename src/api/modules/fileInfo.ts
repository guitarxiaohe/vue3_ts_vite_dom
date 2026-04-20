import { httpClient } from '../client';
import type { SysFileInfo } from '@/types/fileInfo';
import { getApiErrorText, isApiSuccess } from '@/utils/api-success';

/** 列表（分页参数由调用方传入，后端需 createBy） */
export const listFileInfo = (params: Record<string, unknown>) => {
  return httpClient.get('/fileInfo/list', params);
};

export const getFileInfo = (fileId: number | string) => {
  return httpClient.get(`/fileInfo/${fileId}`);
};

export const addFileInfo = (data: SysFileInfo) => {
  return httpClient.post('/fileInfo', data);
};

export const updateFileInfo = (data: SysFileInfo) => {
  return httpClient.put('/fileInfo', data);
};

export const deleteFileInfo = (fileIds: (number | string)[]) => {
  const path = fileIds.join(',');
  return httpClient.delete(`/fileInfo/${path}`);
};

/** 校验 AjaxResult 风格响应 */
export function assertAjaxOk(res: { code?: number; msg?: string; message?: string }) {
  if (!isApiSuccess(res.code ?? 0)) {
    throw new Error(getApiErrorText(res));
  }
}
