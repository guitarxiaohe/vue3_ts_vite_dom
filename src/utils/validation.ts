import type { FormItemRule } from 'element-plus';

export type Translate = (
  key: string,
  params?: Record<string, unknown>
) => string;

/**
 * 构建字符串长度区间校验规则（软限制）
 *
 * @description
 * - 仅在值非空时校验长度，空值直接通过
 * - 必填校验需配合 required 规则使用
 */
export const buildLengthRangeRule = (
  t: Translate,
  label: string,
  min: number,
  max: number
): FormItemRule => ({
  validator: (
    _rule: unknown,
    value: unknown,
    callback: (error?: Error) => void
  ) => {
    if (value === undefined || value === null || value === '') {
      callback();
      return;
    }

    const length = String(value).length;
    if (length < min || length > max) {
      callback(
        new Error(
          t('form.lengthRange', {
            label,
            min,
            max,
          })
        )
      );
      return;
    }

    callback();
  },
  trigger: 'blur',
});

/**
 * 构建字符串最大长度校验规则（软限制）
 *
 * @description
 * - 仅在值非空时校验长度，空值直接通过
 * - 必填校验需配合 required 规则使用
 */
export const buildMaxLengthRule = (
  t: Translate,
  label: string,
  max: number
): FormItemRule => ({
  validator: (
    _rule: unknown,
    value: unknown,
    callback: (error?: Error) => void
  ) => {
    if (value === undefined || value === null || value === '') {
      callback();
      return;
    }

    if (String(value).length > max) {
      callback(
        new Error(
          t('validation.maxLength', {
            field: label,
            max,
          })
        )
      );
      return;
    }

    callback();
  },
  trigger: 'blur',
});
