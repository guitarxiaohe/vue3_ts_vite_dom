import { defineAsyncComponent } from 'vue';
import type { EntityModule } from '@/features/entities/types';

/******************************** 文件实体 ********************************/

// 文件管理模块配置
const entityModule: EntityModule = {
  entityKey: 'fileInfo',
  form: {
    component: defineAsyncComponent(() => import('./form/index.vue')),
  },
  rowActions: {
    actionColumnWidth: 220,
    customButtons: [
      {
        key: 'download',
        label: '下载',
        order: 10,
        component: defineAsyncComponent(
          () => import('./row-actions/download-button.vue')
        ),
      },
    ],
  },
  config: {
    entityKey: 'fileInfo',
    title: '文件管理',
    actions: {
      showCreate: true,
      showEdit: true,
      showCopy: false,
      showDelete: true,
      showImport: true,
      showExport: true,
    },
    filters: {
      fields: {
        fileOriginName: {
          key: 'fileOriginName',
          label: '文件名称',
          component: 'input',
          placeholder: '请输入文件名称',
          order: 1,
        },
        fileSuffix: {
          key: 'fileSuffix',
          label: '文件类型',
          component: 'select',
          placeholder: '请选择文件类型',
          order: 2,
          options: [
            { label: '图片', value: 'image' },
            { label: '文档', value: 'document' },
            { label: '其他', value: 'other' },
          ],
        },
      },
    },
    table: {
      rowKey: 'fileId',
      height: 520,
      pageSize: 20,
      showColumnSettings: true,
    },
    detail: {
      title: '文件详情',
      width: '42%',
    },
  },
};

export default entityModule;
