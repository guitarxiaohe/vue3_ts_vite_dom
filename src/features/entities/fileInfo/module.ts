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
  
    table: {
      rowKey: 'fileId',
      height: 520,
      pageSize: 20,
      showColumnSettings: true,
      defaultSort:{
        field: 'createdTime',
        order: 'asc',
      }
    },
    detail: {
      title: '文件详情',
      width: '42%',
    },
  },
};

export default entityModule;
