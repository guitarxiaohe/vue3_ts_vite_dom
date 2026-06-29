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

/**
 * 将下划线字符串转换为驼峰命名（小驼峰）
 * @param {string} str - 包含下划线的字符串，如 "user_name"
 * @param {boolean} [capitalizeFirst=false] - 是否首字母大写（大驼峰）
 * @returns {string} 转换后的驼峰字符串
 */
export function toCamelCase(str: string, capitalizeFirst = false) {
  // 处理空值或非字符串
  if (typeof str !== 'string') return '';

  // 将字符串按一个或多个下划线分割，过滤掉空段（避免连续下划线）
  const parts = str.split('_').filter((part) => part.length > 0);

  if (parts.length === 0) return '';

  // 首段特殊处理
  let result = parts[0].toLowerCase();

  // 从第二段开始，每个单词首字母大写，其余小写
  for (let i = 1; i < parts.length; i++) {
    const word = parts[i].toLowerCase();
    result += word.charAt(0).toUpperCase() + word.slice(1);
  }

  // 如果需要大驼峰（首字母大写）
  if (capitalizeFirst) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  return result;
}
