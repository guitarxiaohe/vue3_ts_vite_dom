import type { EntityFormField } from '@/features/entities/_shared/types';

/******************************** 用户表单配置 ********************************/

type Translate = (key: string, params?: Record<string, unknown>) => string;

// 获取用户实体表单字段配置
export function getUserFormFields(t: Translate): EntityFormField[] {
  return [
    {
      prop: 'typeName',
      label: '类型名称',
      type: 'text',
      required: true,
      placeholder: t('validation.enterField', {
        field: t('projectType.typeName'),
      }),
    },

    {
      prop: 'typeCode',
      label: '类型编码',
      type: 'text',
      required: true,
    },
    {
      prop: 'remark',
      label: '备注',
      type: 'textarea',
      placeholder: t('validation.enterField', {
        field: t('projectType.remark'),
      }),
    },
  ];
}
