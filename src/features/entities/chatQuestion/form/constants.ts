import type { EntityFormField } from '@/features/entities/_shared/types';

/******************************** 未命中问题表单配置 ********************************/

type Translate = (key: string, params?: Record<string, unknown>) => string;

// 获取未命中问题表单字段配置
export function getChatQuestionFormFields(t: Translate): EntityFormField[] {
  const sessionIdLabel = t('chatQuestionForm.sessionId');
  const questionLabel = t('chatQuestionForm.question');
  const categoryLabel = t('chatQuestionForm.category');
  const sceneLabel = t('chatQuestionForm.scene');
  const moduleKeyLabel = t('chatQuestionForm.moduleKey');
  const entityKeyLabel = t('chatQuestionForm.entityKey');
  const pagePathLabel = t('chatQuestionForm.pagePath');
  const statusLabel = t('chatQuestionForm.status');
  const resolvedRuleIdLabel = t('chatQuestionForm.resolvedRuleId');

  return [
    {
      prop: 'questionId',
      label: t('chatQuestionForm.questionId'),
      type: 'text',
      readonly: true,
      hideOnCreate: true,
      copyable: false,
    },
    {
      prop: 'sessionId',
      label: sessionIdLabel,
      type: 'text',
      placeholder: t('validation.enterField', {
        field: sessionIdLabel,
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
      prop: 'category',
      label: categoryLabel,
      type: 'select',
      optionSource: 'api',
      clearable: true,
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
      prop: 'moduleKey',
      label: moduleKeyLabel,
      type: 'text',
      placeholder: t('validation.enterField', {
        field: moduleKeyLabel,
      }),
    },
    {
      prop: 'entityKey',
      label: entityKeyLabel,
      type: 'text',
      placeholder: t('validation.enterField', {
        field: entityKeyLabel,
      }),
    },
    {
      prop: 'pagePath',
      label: pagePathLabel,
      type: 'text',
      placeholder: t('validation.enterField', {
        field: pagePathLabel,
      }),
    },
    {
      prop: 'status',
      label: statusLabel,
      type: 'async-select',
      optionSource: 'api',
      apiOptions: {
        dictCode: 'chat_question_status',
      },
    },
    {
      prop: 'resolvedRuleId',
      label: resolvedRuleIdLabel,
      type: 'number',
      readonly: true,
      hideOnCreate: true,
      min: 0,
    },
  ];
}
