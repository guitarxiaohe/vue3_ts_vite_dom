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
          label: '规则得分情况',
          relationField: {
            parentKey: 'logId',
            childKey: ' conversationLogId',
          },
          entityKey: 'chatRuleMatchLog',
          rowKey: 'matchLogId',
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
