import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

/******************************** 会议总结实体（只读日志） ********************************/

const entityModule = createEntityModule({
  entityKey: 'meetingSummary',
  config: {
    title: '会议总结',
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
        summaryType: {
          key: 'summaryType',
          label: '总结类型',
          component: 'select',
          placeholder: '请选择总结类型',
          order: 2,
          options: [
            { label: '阶段总结', value: 'STAGE' },
            { label: '最终总结', value: 'FINAL' },
          ],
        },
      },
    },
    table: {
      rowKey: 'id',
      height: 560,
      defaultSort: { field: 'summaryIndex', order: 'asc' },
    },
    detail: {
      title: '总结详情',
      width: '70%',
      visibleCount: 8,
    },
  },
});

export default entityModule;
