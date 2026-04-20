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

interface SnakeToCamelOptions {
  preserveLeadingUnderscore?: boolean; // 保留开头的下划线
  preserveTrailingUnderscore?: boolean; // 保留结尾的下划线
  uppercaseFirst?: boolean; // 首字母大写
  handleNumbers?: boolean; // 处理数字后面的下划线
}

export function snakeToCamel(
  str: string,
  options: SnakeToCamelOptions = {}
): string {
  const {
    preserveLeadingUnderscore = false,
    preserveTrailingUnderscore = false,
    uppercaseFirst = false,
    handleNumbers = true,
  } = options;

  if (!str || typeof str !== 'string') return str;

  // 处理边界情况：全是下划线的字符串
  if (/^_+$/.test(str)) return str;

  let result = str;

  // 处理数字后面的下划线（如 user_123_id -> user123Id）
  if (handleNumbers) {
    result = result.replace(/_([0-9]+)/g, (_, numbers: string) => numbers);
  }

  // 将下划线后的字母转为大写
  result = result.replace(
    /_([a-z])/gi,
    (match, letter: string, offset: number) => {
      if (preserveLeadingUnderscore && offset === 0 && match === '_') {
        return '_';
      }
      return letter.toUpperCase();
    }
  );

  // 移除中间可能多余的下划线
  result = result.replace(/_/g, '');

  // 处理结尾的下划线
  if (!preserveTrailingUnderscore) {
    result = result.replace(/_+$/, '');
  }

  // 首字母大写（帕斯卡命名）
  if (uppercaseFirst && result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  return result;
}
