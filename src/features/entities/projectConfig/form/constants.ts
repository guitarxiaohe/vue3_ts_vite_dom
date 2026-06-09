import type { EntityFormField } from '@/features/entities/_shared/types';

/******************************** 用户表单配置 ********************************/

type Translate = (key: string, params?: Record<string, unknown>) => string;

// 获取用户实体表单字段配置
export function getUserFormFields(t: Translate): EntityFormField[] {
  return [
    {
      prop: 'projectId',
      label: '',
      type: 'text',
      required: true,
      placeholder: t('validation.enterField', {
        field: t('projectConfig.projectName'),
      }),
    },
    {
      prop: 'projectName',
      label: '项目名称',
      type: 'text',
      required: true,
      placeholder: t('validation.enterField', {
        field: t('projectConfig.projectName'),
      }),
    },

    {
      prop: 'projectType',
      label: '类型',
      type: 'select',
      required: true,
      optionSource: 'api',
      placeholder: t('validation.enterField', {
        field: '类型',
      }),
      apiOptions: {
        dictCode: 'project_type',
      },
    },

    {
      prop: 'projectAddress',
      label: '项目地址',
      type: 'text',
      required: true,
    },
    {
      prop: 'images',
      label: '图片',
      type: 'picture',
      required: true,
    },
    {
      prop: 'companyName',
      label: '公司名称',
      type: 'text',
      required: true,
    },
    {
      prop: 'remark',
      label: '项目备注',
      type: 'textarea',
      required: false,
    },
  ];
}
