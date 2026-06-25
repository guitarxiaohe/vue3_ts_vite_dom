import { defineAsyncComponent } from 'vue';
import { i18n } from '@/i18n';
import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

/******************************** AI 规则实体 ********************************/

const title = i18n.global.t('entity.chatRule.title');

const entityModule = createEntityModule({
  entityKey: 'chatRule',
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
      rowKey: 'ruleId',
      height: 560,
      defaultSort: { field: 'priority', order: 'asc' },
    },
    detail: {
      title,
      width: '56%',
      visibleCount: 10,
    },
  },
});

export default entityModule;
