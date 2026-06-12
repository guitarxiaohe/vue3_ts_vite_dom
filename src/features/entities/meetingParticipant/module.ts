import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

/******************************** 会议参会人实体 ********************************/

const entityModule = createEntityModule({
  entityKey: 'meetingParticipant',
  config: {
    title: '参会人员',
    actions: {
      showImport: false,
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
        userName: {
          key: 'userName',
          label: '用户账号',
          component: 'input',
          placeholder: '请输入用户账号',
          order: 2,
        },
        inviteStatus: {
          key: 'inviteStatus',
          label: '邀请状态',
          component: 'select',
          placeholder: '请选择邀请状态',
          order: 3,
          options: [
            { label: '待接受', value: 'PENDING' },
            { label: '已接受', value: 'ACCEPTED' },
            { label: '已拒绝', value: 'DECLINED' },
          ],
        },
      },
    },
    table: {
      rowKey: 'id',
      height: 560,
      defaultSort: { field: 'inviteSentAt', order: 'desc' },
    },
    detail: {
      title: '参会人员详情',
      width: '52%',
      visibleCount: 8,
    },
  },
});

export default entityModule;
