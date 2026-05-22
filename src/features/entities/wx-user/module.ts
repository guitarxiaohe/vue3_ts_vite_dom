import { defineAsyncComponent } from 'vue';
import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

const entityModule = createEntityModule({
  entityKey: 'wxUser',
  formComponent: defineAsyncComponent(() => import('./form/index.vue')),
  config: {
    title: '微信用户',
    actions: {
      showCreate: false,
      showCopy: false,
    },
    filters: {
      fields: {
        name: {
          key: 'name',
          label: '姓名',
          component: 'input',
          placeholder: '请输入姓名',
          order: 1,
        },
      },
    },
    table: {
      rowKey: 'id',
      defaultSort: { field: 'create_time', order: 'desc' },
    },
  },
});

export default entityModule;
