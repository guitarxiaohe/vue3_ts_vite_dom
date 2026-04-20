import { httpClient } from '../client';
import type { SysFileInfo } from '@/types/fileInfo';
import { getApiErrorText, isApiSuccess } from '@/utils/api-success';
import { isMockEnabled } from '@/utils/is-mock';

const nowTs = () => new Date().toISOString();

let mockFileIdSeed = 100;
let mockFileRows: SysFileInfo[] = Array.from({ length: 27 }, (_, i) => ({
  fileId: i + 1,
  fileOriginName: `示例文件-${i + 1}.txt`,
  fileSuffix: 'txt',
  fileSizeInfo: `${(i + 1) * 12}KB`,
  fileObjectName: `obj_${i + 1}.txt`,
  filePath: `/mock/path/${i + 1}`,
  delFlag: 'N',
  createBy: i % 2 === 0 ? 'admin' : 'test',
}));

/** 列表（分页参数由调用方传入，后端需 createBy） */
export const listFileInfo = (params: Record<string, unknown>) => {
  if (isMockEnabled()) {
    const pageNum = Number(params.pageNum ?? 1);
    const pageSize = Number(params.pageSize ?? 10);
    const createBy = String(params.createBy ?? '');
    const filtered = createBy
      ? mockFileRows.filter((r) => String(r.createBy ?? '').includes(createBy))
      : [...mockFileRows];
    const start = (pageNum - 1) * pageSize;
    return Promise.resolve({
      code: 200,
      message: 'mock',
      msg: 'mock',
      total: filtered.length,
      rows: filtered.slice(start, start + pageSize),
      timestamp: nowTs(),
    } as any);
  }
  return httpClient.get('/fileInfo/list', params);
};

export const getFileInfo = (fileId: number | string) => {
  if (isMockEnabled()) {
    const row =
      mockFileRows.find((r) => Number(r.fileId) === Number(fileId)) ?? null;
    return Promise.resolve({
      code: 200,
      message: 'mock',
      msg: 'mock',
      data: row,
      timestamp: nowTs(),
    } as any);
  }
  return httpClient.get(`/fileInfo/${fileId}`);
};

export const addFileInfo = (data: SysFileInfo) => {
  if (isMockEnabled()) {
    mockFileIdSeed += 1;
    mockFileRows.unshift({
      ...data,
      fileId: mockFileIdSeed,
      delFlag: data.delFlag ?? 'N',
    });
    return Promise.resolve({
      code: 200,
      message: 'mock',
      msg: '操作成功',
      timestamp: nowTs(),
    } as any);
  }
  return httpClient.post('/fileInfo', data);
};

export const updateFileInfo = (data: SysFileInfo) => {
  if (isMockEnabled()) {
    const targetId = Number(data.fileId);
    mockFileRows = mockFileRows.map((r) =>
      Number(r.fileId) === targetId ? { ...r, ...data } : r
    );
    return Promise.resolve({
      code: 200,
      message: 'mock',
      msg: '操作成功',
      timestamp: nowTs(),
    } as any);
  }
  return httpClient.put('/fileInfo', data);
};

export const deleteFileInfo = (fileIds: (number | string)[]) => {
  if (isMockEnabled()) {
    const removeSet = new Set(fileIds.map((id) => String(id)));
    mockFileRows = mockFileRows.filter((r) => !removeSet.has(String(r.fileId)));
    return Promise.resolve({
      code: 200,
      message: 'mock',
      msg: '操作成功',
      timestamp: nowTs(),
    } as any);
  }
  const path = fileIds.join(',');
  return httpClient.delete(`/fileInfo/${path}`);
};

/** 校验 AjaxResult 风格响应 */
export function assertAjaxOk(res: { code?: number; msg?: string; message?: string }) {
  if (!isApiSuccess(res.code ?? 0)) {
    throw new Error(getApiErrorText(res));
  }
}
