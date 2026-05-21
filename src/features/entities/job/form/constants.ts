import type { EntityFormField } from '@/features/entities/_shared/types';

type Translate = (key: string, params?: Record<string, unknown>) => string;

export function getJobFormFields(t: Translate): EntityFormField[] {
  return [
    {
      prop: 'jobId',
      label: t('jobForm.jobId'),
      type: 'text',
      readonly: true,
      hideOnCreate: true,
      copyable: false,
    },
    {
      prop: 'jobName',
      label: t('jobForm.jobName'),
      type: 'text',
      required: true,
      placeholder: t('validation.enterField', {
        field: t('jobForm.jobName'),
      }),
    },
    {
      prop: 'jobGroup',
      label: t('jobForm.jobGroup'),
      type: 'text',
      placeholder: t('validation.enterField', {
        field: t('jobForm.jobGroup'),
      }),
    },
    {
      prop: 'invokeTarget',
      label: t('jobForm.invokeTarget'),
      type: 'textarea',
      required: true,
      placeholder: t('validation.enterField', {
        field: t('jobForm.invokeTarget'),
      }),
    },
    {
      prop: 'cronExpression',
      label: t('jobForm.cronExpression'),
      type: 'text',
      required: true,
      placeholder: t('validation.enterField', {
        field: t('jobForm.cronExpression'),
      }),
    },
    {
      prop: 'misfirePolicy',
      label: t('jobForm.misfirePolicy'),
      type: 'radio',
      optionSource: 'static',
      defaultValue: '0',
      options: [
        { label: t('jobForm.misfireDefault'), value: '0' },
        { label: t('jobForm.misfireImmediate'), value: '1' },
        { label: t('jobForm.misfireOnce'), value: '2' },
        { label: t('jobForm.misfireIgnore'), value: '3' },
      ],
    },
    {
      prop: 'concurrent',
      label: t('jobForm.concurrent'),
      type: 'radio',
      optionSource: 'static',
      defaultValue: '1',
      options: [
        { label: t('jobForm.concurrentAllow'), value: '0' },
        { label: t('jobForm.concurrentForbid'), value: '1' },
      ],
    },
    {
      prop: 'status',
      label: t('jobForm.status'),
      type: 'radio',
      optionSource: 'static',
      defaultValue: '0',
      options: [
        { label: t('jobForm.enabled'), value: '0' },
        { label: t('jobForm.paused'), value: '1' },
      ],
    },
    {
      prop: 'remark',
      label: t('jobForm.remark'),
      type: 'textarea',
      placeholder: t('validation.enterField', {
        field: t('jobForm.remark'),
      }),
    },
  ];
}
