import { defineAsyncComponent } from 'vue';
import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

/******************************** 实体配置管理 ********************************/

const entityModule = createEntityModule({
  entityKey: 'entity',
  formComponent: defineAsyncComponent(() => import('./form/index.vue')),
  config: {
    title: '实体配置',
    actions: {
      showImport: false,
      showExport: true,
    },
    filters: {
      fields: {
        entityKey: {
          key: 'entityKey',
          label: '实体标识',
          component: 'input',
          placeholder: '请输入实体标识',
          order: 1,
        },
        entityName: {
          key: 'entityName',
          label: '实体名称',
          component: 'input',
          placeholder: '请输入实体名称',
          order: 2,
        },
        tableName: {
          key: 'tableName',
          label: '关联表名',
          component: 'input',
          placeholder: '请输入表名',
          order: 3,
        },
      },
    },
    table: {
      rowKey: 'id',
      height: 560,
      defaultSort: { field: 'sort', order: 'asc' },
    },
    detail: {
      title: '实体配置详情',
      width: '52%',
      visibleCount: 10,
    },
  },
});

export default entityModule;
