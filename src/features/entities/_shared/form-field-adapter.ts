import type { DetailField } from '@/features/form-shell/types/detail';
import type { EntityFormField } from './types';

/******************************** 字段适配 ********************************/

// 将实体表单字段配置转换为 form-shell 可消费的字段结构
export function mapEntityFormFields(fields: EntityFormField[]): DetailField[] {
  return fields.map((field) => {
    const nextField: DetailField = {
      prop: field.prop,
      label: field.label,
      type: field.type === 'text' ? 'text' : field.type,
      required: field.required,
      min: field.min,
      max: field.max,
      readonly: field.readonly,
      disabled: field.disabled,
      disabledOnEdit: field.disabledOnEdit,
      multiple: field.multiple,
      clearable: field.clearable,
      rules: field.rules,
      placeholder: field.placeholder,
      defaultValue: field.defaultValue,
      hideOnCreate: field.hideOnCreate,
      hideOnEdit: field.hideOnEdit,
      copyable: field.copyable,
    };

    if (field.optionSource === 'static' && field.options) {
      nextField.options = field.options;
    }

    if (
      (field.type === 'select' || field.type === 'async-select') &&
      field.optionSource === 'api' &&
      field.apiOptions
    ) {
      nextField.type = 'async-select';
      nextField.asyncSelectConfig = {
        fetcher: field.apiOptions.fetcher
          ? async (params) => {
              const result = await field.apiOptions!.fetcher!({
                pageNum: params.page,
                pageSize: params.pageSize,
                keyword: params.keyword,
                ...(field.apiOptions?.dataParams ?? {}),
              });

              return {
                items: result.rows ?? [],
                total: Number(result.total) || 0,
              };
            }
          : undefined,
        entityConfig: field.apiOptions.entityKey
          ? {
              entityKey: field.apiOptions.entityKey,
              columns: field.apiOptions.columns,
              queryKey: field.apiOptions.queryKey,
              dataParams: field.apiOptions.dataParams,
            }
          : undefined,
        columns: field.apiOptions.columns,
        valueKey: field.apiOptions.valueKey,
        labelKey: field.apiOptions.labelKey,
        dragKey: field.apiOptions.dragKey,
      };
    }

    return nextField;
  });
}
