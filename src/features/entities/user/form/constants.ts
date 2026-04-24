import type { EntityFormField } from '@/features/entities/_shared/types';

/******************************** 用户表单配置 ********************************/

type Translate = (key: string, params?: Record<string, unknown>) => string;

// 获取用户实体表单字段配置
export function getUserFormFields(t: Translate): EntityFormField[] {
  return [
    {
      prop: 'userId',
      label: t('user.userId'),
      type: 'text',
      readonly: true,
      hideOnCreate: true,
      copyable: false,
    },
    {
      prop: 'userName',
      label: t('user.username'),
      type: 'text',
      required: true,
      placeholder: t('validation.enterField', {
        field: t('user.username'),
      }),
    },
    {
      prop: 'nickName',
      label: t('user.nickName'),
      type: 'text',
      required: true,
      placeholder: t('validation.enterField', {
        field: t('user.nickName'),
      }),
    },
    {
      prop: 'email',
      label: t('login.email'),
      type: 'text',
      placeholder: t('validation.enterField', {
        field: t('login.email'),
      }),
    },
    {
      prop: 'deptId',
      label: t('user.department'),
      type: 'select',
      optionSource: 'api',
      placeholder: t('validation.selectField', {
        field: t('user.department'),
      }),
      apiOptions: {
        entityKey: 'dept',
        valueKey: 'deptId',
        labelKey: 'deptName',
        dragKey: 'leader',
      },
    },
    {
      prop: 'status',
      label: t('user.status'),
      type: 'select',
      optionSource: 'static',
      defaultValue: '0',
      options: [
        { label: t('deptForm.enabled'), value: '0' },
        { label: t('deptForm.disabled'), value: '1' },
      ],
    },
  ];
}
