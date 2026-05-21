import type { EntityFormField } from '@/features/entities/_shared/types';

type Translate = (key: string, params?: Record<string, unknown>) => string;

export function getDictDataFormFields(t: Translate): EntityFormField[] {
  return [
    {
      prop: 'dictCode',
      label: t('dictDataForm.dictCode'),
      type: 'text',
      readonly: true,
      hideOnCreate: true,
      copyable: false,
    },
    {
      prop: 'dictSort',
      label: t('dictDataForm.dictSort'),
      type: 'number',
      required: true,
      defaultValue: 1,
    },
    {
      prop: 'dictLabel',
      label: t('dictDataForm.dictLabel'),
      type: 'text',
      required: true,
      placeholder: t('validation.enterField', {
        field: t('dictDataForm.dictLabel'),
      }),
    },
    {
      prop: 'dictValue',
      label: t('dictDataForm.dictValue'),
      type: 'text',
      required: true,
      placeholder: t('validation.enterField', {
        field: t('dictDataForm.dictValue'),
      }),
    },
    {
      prop: 'dictType',
      label: t('dictDataForm.dictType'),
      type: 'text',
      required: true,
      placeholder: t('validation.enterField', {
        field: t('dictDataForm.dictType'),
      }),
    },
    {
      prop: 'listClass',
      label: t('dictDataForm.listClass'),
      type: 'select',
      optionSource: 'static',
      options: [
        { label: t('dictDataForm.classDefault'), value: 'default' },
        { label: t('dictDataForm.classPrimary'), value: 'primary' },
        { label: t('dictDataForm.classSuccess'), value: 'success' },
        { label: t('dictDataForm.classInfo'), value: 'info' },
        { label: t('dictDataForm.classWarning'), value: 'warning' },
        { label: t('dictDataForm.classDanger'), value: 'danger' },
      ],
      placeholder: t('validation.selectField', {
        field: t('dictDataForm.listClass'),
      }),
    },
    {
      prop: 'isDefault',
      label: t('dictDataForm.isDefault'),
      type: 'radio',
      optionSource: 'static',
      defaultValue: 'N',
      options: [
        { label: t('dictDataForm.yes'), value: 'Y' },
        { label: t('dictDataForm.no'), value: 'N' },
      ],
    },
    {
      prop: 'status',
      label: t('dictDataForm.status'),
      type: 'radio',
      optionSource: 'static',
      defaultValue: '0',
      options: [
        { label: t('dictDataForm.enabled'), value: '0' },
        { label: t('dictDataForm.disabled'), value: '1' },
      ],
    },
    {
      prop: 'remark',
      label: t('dictDataForm.remark'),
      type: 'textarea',
      placeholder: t('validation.enterField', {
        field: t('dictDataForm.remark'),
      }),
    },
  ];
}
