import type { EntityFormField } from '@/features/entities/_shared/types';
import { buildMaxLengthRule } from '@/utils/validation';

/******************************** AI 规则表单配置 ********************************/

type Translate = (key: string, params?: Record<string, unknown>) => string;

// 获取 AI 规则表单字段配置
export function getChatRuleFormFields(t: Translate): EntityFormField[] {
  const ruleCodeLabel = t('chatRuleForm.ruleCode');
  const ruleNameLabel = t('chatRuleForm.ruleName');
  const categoryLabel = t('chatRuleForm.category');
  const matchPatternLabel = t('chatRuleForm.matchPattern');
  const actionConfigLabel = t('chatRuleForm.actionConfig');
  const answerTemplateLabel = t('chatRuleForm.answerTemplate');

  return [
    {
      prop: 'ruleId',
      label: t('chatRuleForm.ruleId'),
      type: 'text',
      readonly: true,
      hideOnCreate: true,
      copyable: false,
    },
    {
      prop: 'ruleCode',
      label: ruleCodeLabel,
      type: 'text',
      required: true,
      placeholder: t('validation.enterField', {
        field: ruleCodeLabel,
      }),
      rules: [buildMaxLengthRule(t, ruleCodeLabel, 64)],
    },
    {
      prop: 'ruleName',
      label: ruleNameLabel,
      type: 'text',
      required: true,
      placeholder: t('validation.enterField', {
        field: ruleNameLabel,
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
      prop: 'matchType',
      label: t('chatRuleForm.matchType'),
      type: 'async-select',
      required: true,
      optionSource: 'api',
      defaultValue: 'KEYWORD',
      apiOptions: {
        dictCode: 'chat_rule_match_type',
      },
    },

    {
      prop: 'priority',
      label: t('chatRuleForm.priority'),
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 2147483647,
    },
    {
      prop: 'actionType',
      label: t('chatRuleForm.actionType'),
      type: 'async-select',
      required: true,
      optionSource: 'api',
      defaultValue: 'ANSWER',
      placeholder: t('validation.selectField', {
        field: t('chatRuleForm.actionType'),
      }),
      apiOptions: {
        dictCode: 'chat_rule_action_type',
      },
    },
    {
      prop: 'status',
      label: t('chatRuleForm.status'),
      type: 'radio',
      optionSource: 'api',
      defaultValue: 1,
      apiOptions: {
        dictCode: 'chat_enable_status',
      },
    },
    {
      prop: 'matchPattern',
      label: matchPatternLabel,
      type: 'textarea',
      required: true,
      placeholder: t('validation.enterField', {
        field: matchPatternLabel,
      }),
    },
    {
      prop: 'actionConfig',
      label: actionConfigLabel,
      type: 'textarea',
      placeholder: t('validation.enterField', {
        field: actionConfigLabel,
      }),
    },
    {
      prop: 'answerTemplate',
      label: answerTemplateLabel,
      type: 'articleEditor',
      placeholder: t('validation.enterField', {
        field: answerTemplateLabel,
      }),
    },
  ];
}
