import { defineAsyncComponent } from 'vue';
import { i18n } from '@/i18n';
import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

/******************************** 未命中问题实体 ********************************/

const title = i18n.global.t('entity.chatQuestion.title');

const entityModule = createEntityModule({
  entityKey: 'chatQuestion',
  formComponent: defineAsyncComponent(() => import('./form/index.vue')),
  rowActions: {
    actionColumnWidth: 180,
  },

  config: {
    title,
    table: {
      rowKey: 'questionId',
      height: 560,
      defaultSort: { field: 'questionId', order: 'desc' },

      children: [
        {
          label: '规则',
          relationField: {
            parentKey: 'ruleId',
            childKey: 'chatRule',
          },
          entityKey: 'chatRule',
          rowKey: 'ruleId',
        },
      ],
    },

    detail: {
      title,
      width: '48%',
      visibleCount: 8,
    },
  },
});

export default entityModule;
