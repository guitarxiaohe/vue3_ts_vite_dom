import { defineAsyncComponent } from 'vue';
import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

const entityModule = createEntityModule({
  entityKey: 'wxAbout',
  formComponent: defineAsyncComponent(() => import('./form/index.vue')),
  rowActions: {
    showCopy: false,
  },
  config: {
    title: '微信关于我',
    actions: {
      showCreate: false,
      showCopy: false,
      showDelete: false,
      showImport: false,
    },
    table: {
      rowKey: 'id',
    },
  },
});

export default entityModule;
