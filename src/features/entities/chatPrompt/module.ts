import { defineAsyncComponent } from 'vue';
import { i18n } from '@/i18n';
import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

/******************************** 提示词实体 ********************************/

const title = i18n.global.t('entity.chatPrompt.title');

const entityModule = createEntityModule({
  entityKey: 'chatPrompt',
  formComponent: defineAsyncComponent(() => import('./form/index.vue')),
  rowActions: {
    actionColumnWidth: 180,
  },
  tableActions: {
    right: [
      {
        component: defineAsyncComponent(
          () => import('./batch-actions/rule.vue')
        ),
      },
    ],
  },
  config: {
    title,
    actions: {
      showImport: true,
      showExport: true,
    },
    table: {
      rowKey: 'prompId',
      height: 560,
      defaultSort: { field: 'createdAt', order: 'desc' },
    },
    detail: {
      title,
      width: '56%',
      visibleCount: 8,
    },
  },
});

export default entityModule;
