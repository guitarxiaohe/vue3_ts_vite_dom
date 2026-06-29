import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

/******************************** 对话日志实体 ********************************/

const entityModule = createEntityModule({
  entityKey: 'chatConversationLog',
  config: {
    title: '对话日志',
    actions: {
      showImport: false,
      showExport: true,
    },

    table: {
      rowKey: 'logId',
      height: 560,
      defaultSort: { field: 'createdAt', order: 'desc' },
      children: [
        {
          label: '命中规则',
          relationField: {
            parentKey: 'ruleId',
            childKey: ' ruleId',
          },
          entityKey: 'chatRule',
          rowKey: 'chatRuleId',
        },
      ],
    },
    detail: {
      title: '对话详情',
      width: '56%',
      visibleCount: 10,
    },
  },
});

export default entityModule;
