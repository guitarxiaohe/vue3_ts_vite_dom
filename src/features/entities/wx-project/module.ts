import { defineAsyncComponent } from 'vue';
import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

const entityModule = createEntityModule({
  entityKey: 'wxProject',
  formComponent: defineAsyncComponent(() => import('./form/index.vue')),
  config: {
    title: '微信项目',
    filters: {
      fields: {
        title: {
          key: 'title',
          label: '项目标题',
          component: 'input',
          placeholder: '请输入项目标题',
          order: 1,
        },
      },
    },
    table: {
      rowKey: 'id',
      defaultSort: { field: 'sort_order', order: 'asc' },
    },
  },
});

export default entityModule;
