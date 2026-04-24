import type { EntityFormField } from '@/features/entities/_shared/types';

/******************************** 文件表单配置 ********************************/

type Translate = (key: string, params?: Record<string, unknown>) => string;

// 获取文件实体表单字段配置
export function getFileInfoFormFields(t: Translate): EntityFormField[] {
  return [
    {
      prop: 'fileId',
      label: t('fileInfo.column.fileId'),
      type: 'text',
      readonly: true,
      hideOnCreate: true,
      copyable: false,
    },
    {
      prop: 'fileOriginName',
      label: t('fileInfo.column.fileOriginName'),
      type: 'text',
      required: true,
      placeholder: t('validation.enterField', {
        field: t('fileInfo.column.fileOriginName'),
      }),
    },
    {
      prop: 'fileSuffix',
      label: t('fileInfo.column.fileSuffix'),
      type: 'select',
      optionSource: 'static',
      options: [
        { label: t('fileInfo.typeImage'), value: 'image' },
        { label: t('fileInfo.typeDocument'), value: 'document' },
        { label: t('fileInfo.typeOther'), value: 'other' },
      ],
      placeholder: t('validation.selectField', {
        field: t('fileInfo.column.fileSuffix'),
      }),
    },
    {
      prop: 'fileSizeInfo',
      label: t('fileInfo.column.fileSizeInfo'),
      type: 'text',
      placeholder: t('validation.enterField', {
        field: t('fileInfo.column.fileSizeInfo'),
      }),
    },
    {
      prop: 'fileObjectName',
      label: t('fileInfo.column.fileObjectName'),
      type: 'text',
      placeholder: t('validation.enterField', {
        field: t('fileInfo.column.fileObjectName'),
      }),
    },
    {
      prop: 'filePath',
      label: t('fileInfo.column.filePath'),
      type: 'textarea',
      placeholder: t('validation.enterField', {
        field: t('fileInfo.column.filePath'),
      }),
    },
    {
      prop: 'delFlag',
      label: t('fileInfo.column.delFlag'),
      type: 'select',
      optionSource: 'static',
      options: [
        { label: t('fileInfo.delFlagN'), value: 'N' },
        { label: t('fileInfo.delFlagY'), value: 'Y' },
      ],
      defaultValue: 'N',
    },
  ];
}
