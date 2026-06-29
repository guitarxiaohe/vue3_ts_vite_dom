import { defineAsyncComponent } from 'vue';
import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

/******************************** 会议主表实体 ********************************/

const entityModule = createEntityModule({
  entityKey: 'meetingSession',
  rowActions: {
    actionColumnWidth: 220,
    customButtons: [
      {
        key: 'dismissMeeting',
        label: '解散会议',
        order: 35,
        visible: (row) => row.status === 'ACTIVE',
        component: defineAsyncComponent(
          () => import('./row-actions/dismiss-meeting.vue')
        ),
      },
    ],
  },
  batchActions: [
    {
      key: 'generateMeetingLink',
      label: '生成会议链接',
      order: 35,
      // visible: (row) => row.status === 'ACTIVE' || row.status === 'CLOSING',
      component: defineAsyncComponent(
        () => import('./batch-actions/generate-meeting.vue')
      ),
    },
  ],
  config: {
    title: '会议管理',
    actions: {
      showImport: false,
      showExport: true,
    },
    // filters: {
    //   fields: {
    //     title: {
    //       key: 'title',
    //       label: '会议标题',
    //       component: 'input',
    //       placeholder: '请输入会议标题',
    //       order: 1,
    //     },
    //     status: {
    //       key: 'status',
    //       label: '会议状态',
    //       component: 'select',
    //       placeholder: '请选择状态',
    //       order: 2,
    //       options: [
    //         { label: '进行中', value: 'ACTIVE' },
    //         { label: '关闭中', value: 'CLOSING' },
    //         { label: '已关闭', value: 'CLOSED_SUCCESS' },
    //         { label: '关闭失败', value: 'CLOSE_FAILED' },
    //       ],
    //     },
    //     rtcStatus: {
    //       key: 'rtcStatus',
    //       label: 'RTC状态',
    //       component: 'select',
    //       placeholder: '请选择RTC状态',
    //       order: 3,
    //       options: [
    //         { label: '初始化', value: 'INIT' },
    //         { label: '运行中', value: 'RUNNING' },
    //         { label: '已停止', value: 'STOPPED' },
    //         { label: '失败', value: 'FAILED' },
    //       ],
    //     },
    //   },
    // },
    table: {
      rowKey: 'id',
      height: 560,
      defaultSort: { field: 'startedAt', order: 'desc' },
      children: [
        {
          label: '参会人员',
          relationField: {
            parentKey: 'id',
            childKey: 'meetingId',
          },
          entityKey: 'meetingParticipant',
          rowKey: 'id',
        },
        {
          label: '会议转写',
          relationField: {
            parentKey: 'id',
            childKey: 'meetingId',
          },
          entityKey: 'meetingTranscript',
          rowKey: 'id',
          hiddenColumnKeys: ['meetingId'],
        },
        {
          label: '会议总结',
          relationField: {
            parentKey: 'id',
            childKey: 'meetingId',
          },
          entityKey: 'meetingSummary',
          rowKey: 'id',
          hiddenColumnKeys: ['meetingId'],
        },
      ],
    },
    detail: {
      title: '会议详情',
      width: '70%',
      visibleCount: 10,
    },
  },
});

export default entityModule;
