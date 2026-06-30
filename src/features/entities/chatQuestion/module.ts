import { defineAsyncComponent } from 'vue';
import { i18n } from '@/i18n';
import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

/******************************** 未命中问题实体 ********************************/

const title = i18n.global.t('entity.chatQuestion.title');

const entityModule = createEntityModule({
  entityKey: 'chatQuestion',
  formComponent: defineAsyncComponent(() => import('./form/index.vue')),
  rowActions: {
    actionColumnWidth: 280,
    customButtons: [
      {
        key: 'aiCreateRule',
        label: 'AI 生成规则',
        component: defineAsyncComponent(
          () => import('./row-actions/ai-create-rule.vue')
        ),
        visible: (row) => row.status == 'PENDING',
      },
    ],
  },

  batchActions: [
    defineAsyncComponent(() => import('./batch-actions/ai-create-rule.vue')),
  ],

  config: {
    title,
    actions: {
      showImport: true,
      showExport: true,
    },
    table: {
      rowKey: 'questionId',
      height: 560,
      defaultSort: { field: 'questionId', order: 'desc' },

      children: [
        {
          label: '规则',
          relationField: {
            parentKey: 'resolvedRuleId',
            childKey: 'ruleId',
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
