import { defineAsyncComponent } from 'vue';
import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

/******************************** 角色实体 ********************************/

const entityModule = createEntityModule({
  entityKey: 'role',
  formComponent: defineAsyncComponent(() => import('./form/index.vue')),
  rowActions: {
    actionColumnWidth: 180,
  },
  config: {
    title: '角色管理',
    actions: {
      showImport: false,
      showExport: true,
    },
    table: {
      rowKey: 'roleId',
      height: 560,
      defaultSort: { field: 'roleSort', order: 'asc' },
    },
    detail: {
      title: '角色详情',
      width: '52%',
      visibleCount: 10,
    },
  },
});

export default entityModule;
