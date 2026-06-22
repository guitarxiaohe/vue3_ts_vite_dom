import { defineAsyncComponent } from 'vue';
import { i18n } from '@/i18n';
import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

/******************************** 知识库实体 ********************************/

const title = i18n.global.t('entity.chatKnowledge.title');

const entityModule = createEntityModule({
  entityKey: 'chatKnowledge',
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
    table: {
      rowKey: 'knowledgeId',
      height: 560,
      defaultSort: { field: 'sort', order: 'asc' },
    },
    detail: {
      title,
      width: '56%',
      visibleCount: 10,
    },
  },
});

export default entityModule;
