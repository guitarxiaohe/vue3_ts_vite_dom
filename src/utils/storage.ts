import { isDayjs } from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { FilterFormValue } from '@/features/multiview/types';
import { isEmptyValue } from '@/utils/value';

/**
 * 本地存储工具函数
 *
 * 封装 localStorage 操作，提供类型安全的存取方法
 */

/**
 * 分页大小存储键前缀
 */
const PAGE_SIZE_PREFIX = 'page_size_';

/**
 * 默认分页大小
 */
const DEFAULT_PAGE_SIZE = 20;

/**
 * 列表筛选缓存前缀
 */
const LIST_FILTER_CACHE_PREFIX = 'list_filter_cache_';

/**
 * 列表筛选缓存值类型
 */
type ListFilterCacheValue =
  | string
  | number
  | boolean
  | null
  | { __type: 'date'; value: number }
  | ListFilterCacheValue[];

const isDateCacheValue = (
  value: unknown
): value is { __type: 'date'; value: number } =>
  Boolean(
    value &&
      typeof value === 'object' &&
      (value as { __type?: string }).__type === 'date' &&
      typeof (value as { value?: number }).value === 'number'
  );

const isDayjsValue = (value: unknown): value is Dayjs => isDayjs(value);

const normalizeFilterValue = (value: FilterFormValue): ListFilterCacheValue => {
  if (isEmptyValue(value)) {
    return null;
  }

  if (value instanceof Date) {
    return { __type: 'date', value: value.getTime() };
  }

  if (isDayjsValue(value)) {
    return { __type: 'date', value: value.valueOf() };
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeFilterValue(item as FilterFormValue));
  }

  return value as string | number | boolean;
};

const restoreFilterValue = (value: ListFilterCacheValue): FilterFormValue => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      restoreFilterValue(item as ListFilterCacheValue)
    ) as FilterFormValue;
  }

  if (isDateCacheValue(value)) {
    return new Date(value.value);
  }

  return value as string | number | boolean;
};

/**
 * 规范化筛选缓存对象（用于存储与对比）
 */
export const normalizeListFilterCache = (
  values: Record<string, FilterFormValue>,
  keys?: string[]
): Record<string, ListFilterCacheValue> => {
  const targetKeys =
    keys && keys.length > 0 ? [...keys].sort() : Object.keys(values).sort();
  const result: Record<string, ListFilterCacheValue> = {};

  targetKeys.forEach((key) => {
    result[key] = normalizeFilterValue(values[key]);
  });

  return result;
};

/**
 * 获取实体的分页大小
 *
 * @description
 * 从 localStorage 读取指定实体的分页大小
 * 如果不存在或无效，返回默认值
 *
 * @param entityKey - 实体标识
 * @param defaultValue - 默认值（可选，默认为 20）
 * @returns 分页大小
 *
 * @example
 * ```ts
 * const pageSize = getPageSize('customer'); // 20
 * const pageSize = getPageSize('customer', 50); // 50
 * ```
 */
export const getPageSize = (
  entityKey: string,
  defaultValue = DEFAULT_PAGE_SIZE
): number => {
  if (!entityKey) return defaultValue;

  try {
    const key = `${PAGE_SIZE_PREFIX}${entityKey}`;
    const stored = localStorage.getItem(key);

    if (stored) {
      const parsed = parseInt(stored, 10);
      // 验证有效性：必须是正整数且在合理范围内（1-1000）
      if (!isNaN(parsed) && parsed > 0 && parsed <= 1000) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('读取分页大小失败:', error);
  }

  return defaultValue;
};

/**
 * 保存实体的分页大小
 *
 * @description
 * 将指定实体的分页大小保存到 localStorage
 *
 * @param entityKey - 实体标识
 * @param pageSize - 分页大小
 *
 * @example
 * ```ts
 * setPageSize('customer', 50);
 * ```
 */
export const setPageSize = (entityKey: string, pageSize: number): void => {
  if (!entityKey || !pageSize || pageSize <= 0) return;

  try {
    const key = `${PAGE_SIZE_PREFIX}${entityKey}`;
    localStorage.setItem(key, pageSize.toString());
  } catch (error) {
    console.warn('保存分页大小失败:', error);
  }
};

/**
 * 清除实体的分页大小
 *
 * @description
 * 从 localStorage 删除指定实体的分页大小
 *
 * @param entityKey - 实体标识
 *
 * @example
 * ```ts
 * clearPageSize('customer');
 * ```
 */
export const clearPageSize = (entityKey: string): void => {
  if (!entityKey) return;

  try {
    const key = `${PAGE_SIZE_PREFIX}${entityKey}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('清除分页大小失败:', error);
  }
};

/**
 * 清除所有实体的分页大小
 *
 * @description
 * 从 localStorage 删除所有实体的分页大小（通过前缀匹配）
 *
 * @example
 * ```ts
 * clearAllPageSizes();
 * ```
 */
export const clearAllPageSizes = (): void => {
  try {
    const keysToRemove: string[] = [];

    // 遍历所有 localStorage 键，找到以前缀开头的键
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PAGE_SIZE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    // 删除找到的键
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn('清除所有分页大小失败:', error);
  }
};

/**
 * 保存列表筛选缓存
 *
 * @description
 * 用于收藏筛选条件，缓存 key 建议使用路由级 cacheKey
 */
export const setListFilterCache = (
  cacheKey: string,
  values: Record<string, FilterFormValue>,
  keys?: string[]
): void => {
  if (!cacheKey) return;

  try {
    const key = `${LIST_FILTER_CACHE_PREFIX}${cacheKey}`;
    const normalized = normalizeListFilterCache(values, keys);
    localStorage.setItem(key, JSON.stringify(normalized));
  } catch (error) {
    console.warn('保存筛选缓存失败:', error);
  }
};

/**
 * 获取列表筛选缓存
 */
export const getListFilterCache = (
  cacheKey: string
): Record<string, FilterFormValue> | undefined => {
  if (!cacheKey) return undefined;

  try {
    const key = `${LIST_FILTER_CACHE_PREFIX}${cacheKey}`;
    const stored = localStorage.getItem(key);
    if (!stored) return undefined;

    const parsed = JSON.parse(stored) as Record<string, ListFilterCacheValue>;
    const result: Record<string, FilterFormValue> = {};

    Object.entries(parsed).forEach(([fieldKey, value]) => {
      result[fieldKey] = restoreFilterValue(value);
    });

    return result;
  } catch (error) {
    console.warn('读取筛选缓存失败:', error);
  }

  return undefined;
};

/**
 * 清除列表筛选缓存
 */
export const clearListFilterCache = (cacheKey: string): void => {
  if (!cacheKey) return;

  try {
    const key = `${LIST_FILTER_CACHE_PREFIX}${cacheKey}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('清除筛选缓存失败:', error);
  }
};
