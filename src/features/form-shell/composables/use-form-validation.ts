import { computed, nextTick, ref, watch, type Ref } from 'vue';
import type { FormInstance, FormItemRule } from 'element-plus';
import { i18n } from '@/i18n';
import type { DetailField, DetailRecord } from '../types/detail';

/******************************** 常量 ********************************/

// Java Integer 最大值
const INT_MAX = 2147483647;

// Java Integer 最小值
const INT_MIN = -2147483648;

/******************************** 表单校验 ********************************/

// 统一处理表单校验与禁用逻辑
export function useFormValidation(
  formData: Ref<DetailRecord>,
  fields: Ref<DetailField[]>,
  isCreate: Ref<boolean>
) {
  const formRef = ref<FormInstance>();

  // 判断字段是否禁用
  function isFieldDisabled(field: DetailField) {
    if (field.readonly) return true;
    if (field.disabled) return true;
    if (field.disabledOnEdit && !isCreate.value) return true;
    return false;
  }

  // 生成表单校验规则
  const rules = computed(() => {
    const result: Record<string, FormItemRule[]> = {};

    (fields.value ?? []).forEach((field) => {
      const fieldRules: FormItemRule[] = [];

      if (field.required) {
        fieldRules.push({
          required: true,
          message: i18n.global.t('validation.required', { field: field.label }),
          trigger: ['blur', 'change'],
        });
      }

      if (field.type === 'number') {
        const min = field.min ?? INT_MIN;
        const max = field.max ?? INT_MAX;

        fieldRules.push({
          type: 'number',
          min,
          max,
          message: i18n.global.t('validation.numberRange', {
            field: field.label,
            min,
            max,
          }),
          trigger: ['blur', 'change'],
        });
      }

      if (field.rules?.length) {
        fieldRules.push(...field.rules);
      }

      if (fieldRules.length) {
        result[field.prop] = fieldRules;
      }
    });

    return result;
  });

  // 校验表单
  async function validate() {
    if (formRef.value && typeof formRef.value.validate === 'function') {
      await nextTick();
      return formRef.value.validate();
    }
    return Promise.resolve(true);
  }

  // 字段清空时自动移除旧校验
  watch(
    formData,
    (newData) => {
      if (!formRef.value) return;

      setTimeout(() => {
        const clearedFields: string[] = [];

        Object.keys(newData).forEach((key) => {
          const value = newData[key];
          if (
            value === undefined ||
            value === null ||
            value === '' ||
            (Array.isArray(value) && value.length === 0)
          ) {
            clearedFields.push(key);
          }
        });

        if (clearedFields.length) {
          formRef.value?.clearValidate(clearedFields);
        }
      }, 0);
    },
    { deep: true }
  );

  return {
    formRef,
    rules,
    isFieldDisabled,
    validate,
    INT_MAX,
    INT_MIN,
  };
}
