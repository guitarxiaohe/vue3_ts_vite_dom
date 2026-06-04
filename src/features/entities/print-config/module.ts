import { defineAsyncComponent } from 'vue';
import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

/******************************** 打印配置 ********************************/

const entityModule = createEntityModule({
  entityKey: 'printConfig',
  formComponent: defineAsyncComponent(() => import('./form/index.vue')),
  rowActions: {
    actionColumnWidth: 180,
  },
  config: {
    title: '打印配置',
    actions: {
      showImport: false,
      showExport: true,
    },

    table: {
      rowKey: 'printConfigId',
      height: 560,
      defaultSort: { field: 'printConfigSort', order: 'asc' },
    },
    detail: {
      title: '打印配置详情',
      width: '52%',
      visibleCount: 8,
    },
  },
});

export default entityModule;
