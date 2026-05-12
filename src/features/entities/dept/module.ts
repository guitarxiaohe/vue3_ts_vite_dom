import { defineAsyncComponent } from 'vue';
import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

/******************************** 部门实体 ********************************/

const entityModule = createEntityModule({
  entityKey: 'dept',
  formComponent: defineAsyncComponent(() => import('./form/index.vue')),
  rowActions: {
    actionColumnWidth: 180,
  },
  config: {
    title: '部门管理',
    actions: {
      showImport: false,
      showExport: true,
    },
    table: {
      rowKey: 'deptId',
      height: 560,
      defaultSort: { field: 'orderNum', order: 'asc' },
    },
    detail: {
      title: '部门详情',
      width: '52%',
      visibleCount: 10,
    },
  },
});

export default entityModule;
