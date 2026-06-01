import { defineAsyncComponent } from 'vue';
import type { EntityModule } from '@/features/entities/types';

const entityModule: EntityModule = {
  entityKey: 'projectType',
  form: {
    component: defineAsyncComponent(() => import('./form/index.vue')),
  },
  rowActions: {
    actionColumnWidth: 220,
  },
  config: {
    entityKey: 'projectType',
    title: '项目配置',

    table: {
      rowKey: 'typeId',
      height: 520,
      pageSize: 20,
      defaultSort: { field: 'typeId', order: 'asc' },
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
