import type { EntityFormField } from '@/features/entities/_shared/types';

/******************************** 字段配置表单 ********************************/

type Translate = (key: string, params?: Record<string, unknown>) => string;

// 获取字段配置表单字段
export function getFieldConfigFormFields(t: Translate): EntityFormField[] {
  return [
    {
      prop: 'id',
      label: t('fieldConfig.id'),
      type: 'text',
      readonly: true,
      hideOnCreate: true,
      copyable: false,
    },
    {
      prop: 'entityKey',
      label: t('fieldConfig.entityKey'),
      type: 'text',
      required: true,
      disabledOnEdit: true,
      placeholder: t('validation.enterField', {
        field: t('fieldConfig.entityKey'),
      }),
    },
    {
      prop: 'fieldKey',
      label: t('fieldConfig.fieldKey'),
      type: 'text',
      required: true,
      disabledOnEdit: true,
      placeholder: t('validation.enterField', {
        field: t('fieldConfig.fieldKey'),
      }),
    },
    {
      prop: 'fieldName',
      label: t('fieldConfig.fieldName'),
      type: 'text',
      required: true,
      placeholder: t('validation.enterField', {
        field: t('fieldConfig.fieldName'),
      }),
    },
    {
      prop: 'fieldType',
      label: t('fieldConfig.fieldType'),
      type: 'select',
      required: true,
      optionSource: 'static',
      defaultValue: 'input',
      options: [
        { label: t('fieldConfig.typeInput'), value: 'input' },
        { label: t('fieldConfig.typeText'), value: 'text' },
        { label: t('fieldConfig.typeSelect'), value: 'select' },
        { label: t('fieldConfig.dictSelect'), value: 'dict' },
        { label: t('fieldConfig.typeDate'), value: 'date' },
        { label: t('fieldConfig.typeDatetime'), value: 'datetime' },
        { label: t('fieldConfig.typeTextarea'), value: 'textarea' },
        { label: t('fieldConfig.typeNumber'), value: 'number' },
        { label: t('fieldConfig.typeSwitch'), value: 'switch' },
        { label: t('fieldConfig.typeFile'), value: 'file' },
        { label: t('fieldConfig.typeBy'), value: 'by' },
        { label: t('fieldConfig.typeUser'), value: 'user' },
      ],
    },
    {
      prop: 'fieldRole',
      label: t('fieldConfig.fieldRole'),
      type: 'select',
      optionSource: 'static',
      defaultValue: '',
      options: [
        { label: t('fieldConfig.roleNone'), value: '' },
        { label: t('fieldConfig.roleCreateUser'), value: 'createUser' },
        { label: t('fieldConfig.roleUpdateUser'), value: 'updateUser' },
        { label: t('fieldConfig.roleFileInfo'), value: 'fileInfo' },
      ],
    },
    {
      prop: 'dictCode',
      label: t('fieldConfig.dictCode'),
      type: 'text',
      placeholder: t('validation.enterField', {
        field: t('fieldConfig.dictCode'),
      }),
    },
    {
      prop: 'selectEntityKey',
      label: t('fieldConfig.selectEntityKey'),
      type: 'text',
      placeholder: t('validation.enterField', {
        field: t('fieldConfig.selectEntityKey'),
      }),
    },
    {
      prop: 'sort',
      label: t('fieldConfig.sort'),
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 9999,
    },
    {
      prop: 'isFuzzySearch',
      label: t('fieldConfig.isFuzzySearch'),
      type: 'select',
      optionSource: 'static',
      defaultValue: 0,
      options: [
        { label: t('common.no'), value: 0 },
        { label: t('common.yes'), value: 1 },
      ],
    },
    {
      prop: 'isVisible',
      label: t('fieldConfig.isVisible'),
      type: 'select',
      optionSource: 'static',
      defaultValue: 1,
      options: [
        { label: t('common.no'), value: 0 },
        { label: t('common.yes'), value: 1 },
      ],
    },
    {
      prop: 'fixed',
      label: t('fieldConfig.fixed'),
      type: 'select',
      optionSource: 'static',
      defaultValue: '',
      options: [
        { label: t('fieldConfig.fixedNone'), value: '' },
        { label: t('fieldConfig.fixedLeft'), value: 'left' },
        { label: t('fieldConfig.fixedRight'), value: 'right' },
      ],
    },
  ];
}
