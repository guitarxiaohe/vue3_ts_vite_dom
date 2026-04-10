/**
 * 判断值是否为空
 *
 * @description
 * 统一处理 null/undefined/空字符串/空数组，保留 0、false 等合法值
 *
 * @param value - 待检查的值
 * @returns 是否为空
 */
export const isEmptyValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
};
