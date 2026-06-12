import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

/******************************** 会议转写实体（只读日志） ********************************/

const entityModule = createEntityModule({
  entityKey: 'meetingTranscript',
  config: {
    title: '会议转写',
    actions: {
      showCreate: false,
      showEdit: false,
      showCopy: false,
      showDelete: true,
      showExport: true,
    },
    filters: {
      fields: {
        meetingId: {
          key: 'meetingId',
          label: '会议ID',
          component: 'input',
          placeholder: '请输入会议ID',
          order: 1,
        },
        displayName: {
          key: 'displayName',
          label: '发言人',
          component: 'input',
          placeholder: '请输入发言人',
          order: 2,
        },
      },
    },
    table: {
      rowKey: 'id',
      height: 560,
      defaultSort: { field: 'sequenceNo', order: 'asc' },
    },
    detail: {
      title: '转写详情',
      width: '70%',
      visibleCount: 10,
    },
  },
});

export default entityModule;
