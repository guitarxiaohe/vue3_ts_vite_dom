import type { EntityFormField } from '@/features/entities/_shared/types';

type Translate = (key: string, params?: Record<string, unknown>) => string;

export function getPostFormFields(t: Translate): EntityFormField[] {
  return [
    {
      prop: 'postId',
      label: t('postForm.postId'),
      type: 'text',
      readonly: true,
      hideOnCreate: true,
      copyable: false,
    },
    {
      prop: 'postCode',
      label: t('postForm.postCode'),
      type: 'text',
      required: true,
      placeholder: t('validation.enterField', {
        field: t('postForm.postCode'),
      }),
    },
    {
      prop: 'postName',
      label: t('postForm.postName'),
      type: 'text',
      required: true,
      placeholder: t('validation.enterField', {
        field: t('postForm.postName'),
      }),
    },
    {
      prop: 'postSort',
      label: t('postForm.postSort'),
      type: 'number',
      required: true,
      defaultValue: 1,
    },
    {
      prop: 'status',
      label: t('postForm.status'),
      type: 'radio',
      optionSource: 'static',
      defaultValue: '0',
      options: [
        { label: t('postForm.enabled'), value: '0' },
        { label: t('postForm.disabled'), value: '1' },
      ],
    },
    {
      prop: 'remark',
      label: t('postForm.remark'),
      type: 'textarea',
      placeholder: t('validation.enterField', {
        field: t('postForm.remark'),
      }),
    },
  ];
}
