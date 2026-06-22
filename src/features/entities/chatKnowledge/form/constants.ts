import type { EntityFormField } from '@/features/entities/_shared/types';
import { buildMaxLengthRule } from '@/utils/validation';

/******************************** 知识库表单配置 ********************************/

type Translate = (key: string, params?: Record<string, unknown>) => string;

// 获取知识库表单字段配置
export function getChatKnowledgeFormFields(t: Translate): EntityFormField[] {
  const titleLabel = t('chatKnowledgeForm.title');
  const questionLabel = t('chatKnowledgeForm.question');
  const answerLabel = t('chatKnowledgeForm.answer');
  const categoryLabel = t('chatKnowledgeForm.category');
  const sceneLabel = t('chatKnowledgeForm.scene');
  const keywordsLabel = t('chatKnowledgeForm.keywords');
  const moduleKeyLabel = t('chatKnowledgeForm.moduleKey');
  const entityKeyLabel = t('chatKnowledgeForm.entityKey');

  return [
    {
      prop: 'knowledgeId',
      label: t('chatKnowledgeForm.knowledgeId'),
      type: 'text',
      readonly: true,
      hideOnCreate: true,
      copyable: false,
    },
    {
      prop: 'title',
      label: titleLabel,
      type: 'text',
      required: true,
      placeholder: t('validation.enterField', {
        field: titleLabel,
      }),
    },
    {
      prop: 'question',
      label: questionLabel,
      type: 'textarea',
      required: true,
      placeholder: t('validation.enterField', {
        field: questionLabel,
      }),
    },
    {
      prop: 'answer',
      label: answerLabel,
      type: 'textarea',
      required: true,
      placeholder: t('validation.enterField', {
        field: answerLabel,
      }),
    },
    {
      prop: 'category',
      label: categoryLabel,
      type: 'select',
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
      prop: 'scene',
      label: sceneLabel,
      type: 'text',
      placeholder: t('validation.enterField', {
        field: sceneLabel,
      }),
    },
    {
      prop: 'keywords',
      label: keywordsLabel,
      type: 'textarea',
      placeholder: t('validation.enterField', {
        field: keywordsLabel,
      }),
    },
    {
      prop: 'moduleKey',
      label: moduleKeyLabel,
      type: 'text',
      placeholder: t('validation.enterField', {
        field: moduleKeyLabel,
      }),
      rules: [buildMaxLengthRule(t, moduleKeyLabel, 64)],
    },
    {
      prop: 'entityKey',
      label: entityKeyLabel,
      type: 'text',
      placeholder: t('validation.enterField', {
        field: entityKeyLabel,
      }),
      rules: [buildMaxLengthRule(t, entityKeyLabel, 64)],
    },
    {
      prop: 'sort',
      label: t('chatKnowledgeForm.sort'),
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 2147483647,
    },
    {
      prop: 'status',
      label: t('chatKnowledgeForm.status'),
      type: 'radio',
      optionSource: 'api',
      defaultValue: 1,
      apiOptions: {
        dictCode: 'chat_enable_status',
      },
    },
  ];
}
