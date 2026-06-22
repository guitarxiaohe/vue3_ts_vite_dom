import type { EntityFormField } from '@/features/entities/_shared/types';

/******************************** 提示词表单配置 ********************************/

type Translate = (key: string, params?: Record<string, unknown>) => string;

// 获取提示词表单字段配置
export function getChatPromptFormFields(t: Translate): EntityFormField[] {
  const nameLabel = t('chatPromptForm.name');
  const descriptionLabel = t('chatPromptForm.description');
  const contentLabel = t('chatPromptForm.content');
  const categoryLabel = t('chatPromptForm.category');
  const tagsLabel = t('chatPromptForm.tags');

  return [
    {
      prop: 'prompId',
      label: t('chatPromptForm.prompId'),
      type: 'text',
      readonly: true,
      hideOnCreate: true,
      copyable: false,
    },
    {
      prop: 'name',
      label: nameLabel,
      type: 'text',
      required: true,
      placeholder: t('validation.enterField', {
        field: nameLabel,
      }),
    },
    {
      prop: 'description',
      label: descriptionLabel,
      type: 'textarea',
      placeholder: t('validation.enterField', {
        field: descriptionLabel,
      }),
    },
    {
      prop: 'content',
      label: contentLabel,
      type: 'textarea',
      required: true,
      placeholder: t('validation.enterField', {
        field: contentLabel,
      }),
    },
    {
      prop: 'category',
      label: categoryLabel,
      type: 'select',
      required: true,
      optionSource: 'api',
      placeholder: t('validation.selectField', {
        field: categoryLabel,
      }),
      apiOptions: {
        entityKey: 'chatCategory',
        valueKey: 'categoryCode',
        labelKey: 'categoryName',
      },
    },
    {
      prop: 'tags',
      label: tagsLabel,
      type: 'textarea',
      placeholder: t('validation.enterField', {
        field: tagsLabel,
      }),
    },
    {
      prop: 'status',
      label: t('chatPromptForm.status'),
      type: 'radio',
      optionSource: 'static',
      defaultValue: 1,
      options: [
        { label: t('dictDataForm.enabled'), value: 1 },
        { label: t('dictDataForm.disabled'), value: 0 },
      ],
    },
  ];
}
