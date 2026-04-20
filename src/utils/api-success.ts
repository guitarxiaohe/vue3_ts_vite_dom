/** 与后端约定：0 / 200 为成功（若依常用 200） */
export function isApiSuccess(code: number): boolean {
  return code === 200 || code === 0;
}

export function getApiErrorText(res: {
  msg?: string;
  message?: string;
}): string {
  return res.msg ?? res.message ?? '请求失败';
}
