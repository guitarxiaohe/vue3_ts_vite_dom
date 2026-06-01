import { defineAsyncComponent } from 'vue';
import type { EntityModule } from '@/features/entities/types';
// 用户管理模块配置
const entityModule: EntityModule = {
  entityKey: 'projectConfig',
  form: {
    component: defineAsyncComponent(() => import('./form/index.vue')),
  },
  rowActions: {
    actionColumnWidth: 220,
  },
  config: {
    entityKey: 'projectConfig',
    title: '项目配置',

    table: {
      rowKey: 'projectId',
      height: 520,
      pageSize: 20,
      defaultSort: { field: 'projectId', order: 'asc' },
      showColumnSettings: true,
    },
    detail: {
      title: '项目详情',
      width: '42%',
      visibleCount: 8,
    },
  },
};

export default entityModule;
