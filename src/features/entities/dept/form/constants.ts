import type { EntityFormField } from '@/features/entities/_shared/types';

type Translate = (key: string, params?: Record<string, unknown>) => string;

export function getDeptFormFields(t: Translate): EntityFormField[] {
  return [
    {
      prop: 'deptId',
      label: t('deptForm.deptId'),
      type: 'text',
      readonly: true,
      hideOnCreate: true,
      copyable: false,
    },
    {
      prop: 'parentId',
      label: t('deptForm.parentDept'),
      type: 'async-select',
      optionSource: 'api',
      placeholder: t('validation.selectField', {
        field: t('deptForm.parentDept'),
      }),
      apiOptions: {
        entityKey: 'dept',
        valueKey: 'deptId',
        labelKey: 'deptName',
        dragKey: 'leader',
      },
    },
    {
      prop: 'deptName',
      label: t('deptForm.deptName'),
      type: 'text',
      required: true,
      placeholder: t('validation.enterField', {
        field: t('deptForm.deptName'),
      }),
    },
    {
      prop: 'orderNum',
      label: t('deptForm.orderNum'),
      type: 'number',
      required: true,
      defaultValue: 1,
    },
    {
      prop: 'leader',
      label: t('deptForm.leader'),
      type: 'text',
      placeholder: t('validation.enterField', {
        field: t('deptForm.leader'),
      }),
    },
    {
      prop: 'phone',
      label: t('deptForm.phone'),
      type: 'text',
      placeholder: t('validation.enterField', {
        field: t('deptForm.phone'),
      }),
    },
    {
      prop: 'email',
      label: t('deptForm.email'),
      type: 'text',
      placeholder: t('validation.enterField', {
        field: t('deptForm.email'),
      }),
    },
    {
      prop: 'status',
      label: t('deptForm.status'),
      type: 'radio',
      optionSource: 'static',
      defaultValue: '0',
      options: [
        { label: t('deptForm.enabled'), value: '0' },
        { label: t('deptForm.disabled'), value: '1' },
      ],
    },
  ];
}
