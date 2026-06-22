import type { FormItemRule } from 'element-plus';
import type { EntityFormField } from '@/features/entities/_shared/types';
import { buildMaxLengthRule } from '@/utils/validation';

/******************************** AI 分类表单配置 ********************************/

type Translate = (key: string, params?: Record<string, unknown>) => string;

// 构建分类编码校验规则
function buildCategoryCodeRules(t: Translate, label: string): FormItemRule[] {
  return [
    buildMaxLengthRule(t, label, 64),
    {
      validator: (
        _rule: unknown,
        value: unknown,
        callback: (error?: Error) => void
      ) => {
        if (value === undefined || value === null || value === '') {
          callback();
          return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(String(value))) {
          callback(new Error(t('chatCategoryForm.codePattern')));
          return;
        }

        callback();
      },
      trigger: 'blur',
    },
  ];
}

// 获取 AI 分类表单字段配置
export function getChatCategoryFormFields(t: Translate): EntityFormField[] {
  const categoryCodeLabel = t('chatCategoryForm.categoryCode');
  const categoryNameLabel = t('chatCategoryForm.categoryName');
  const descriptionLabel = t('chatCategoryForm.description');
  const keywordsLabel = t('chatCategoryForm.keywords');
  const remarkLabel = t('chatCategoryForm.remark');

  return [
    {
      prop: 'categoryId',
      label: t('chatCategoryForm.categoryId'),
      type: 'text',
      readonly: true,
      hideOnCreate: true,
      copyable: false,
    },
    {
      prop: 'categoryCode',
      label: categoryCodeLabel,
      type: 'text',
      required: true,
      placeholder: t('validation.enterField', {
        field: categoryCodeLabel,
      }),
      rules: buildCategoryCodeRules(t, categoryCodeLabel),
    },
    {
      prop: 'categoryName',
      label: categoryNameLabel,
      type: 'text',
      required: true,
      placeholder: t('validation.enterField', {
        field: categoryNameLabel,
      }),
      rules: [buildMaxLengthRule(t, categoryNameLabel, 100)],
    },

    {
      prop: 'sort',
      label: t('chatCategoryForm.sort'),
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 2147483647,
    },
    {
      prop: 'status',
      label: t('chatCategoryForm.status'),
      type: 'radio',
      optionSource: 'static',
      defaultValue: 1,
      options: [
        { label: t('dictDataForm.enabled'), value: 1 },
        { label: t('dictDataForm.disabled'), value: 0 },
      ],
    },
    {
      prop: 'description',
      label: descriptionLabel,
      type: 'textarea',
      placeholder: t('validation.enterField', {
        field: descriptionLabel,
      }),
      rules: [buildMaxLengthRule(t, descriptionLabel, 500)],
    },
    {
      prop: 'keywords',
      label: keywordsLabel,
      type: 'textarea',
      placeholder: t('validation.enterField', {
        field: keywordsLabel,
      }),
      rules: [buildMaxLengthRule(t, keywordsLabel, 500)],
    },
    {
      prop: 'remark',
      label: remarkLabel,
      type: 'textarea',
      placeholder: t('validation.enterField', {
        field: remarkLabel,
      }),
      rules: [buildMaxLengthRule(t, remarkLabel, 500)],
    },
  ];
}
