import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

/******************************** 任务日志实体（只读） ********************************/

const entityModule = createEntityModule({
  entityKey: 'jobLog',
  config: {
    title: '任务日志',
    actions: {
      showCreate: false,
      showEdit: false,
      showCopy: false,
      showDelete: true,
      showExport: true,
    },
    filters: {
      fields: {
        jobName: {
          key: 'jobName',
          label: '任务名称',
          component: 'input',
          placeholder: '请输入任务名称',
          order: 1,
        },
        jobGroup: {
          key: 'jobGroup',
          label: '任务组名',
          component: 'input',
          placeholder: '请输入任务组名',
          order: 2,
        },
        status: {
          key: 'status',
          label: '执行状态',
          component: 'select',
          placeholder: '请选择执行状态',
          order: 3,
          options: [
            { label: '成功', value: '0' },
            { label: '失败', value: '1' },
          ],
        },
      },
    },
    table: {
      rowKey: 'jobLogId',
      height: 560,
      pageSize: 20,
      defaultSort: { field: 'startTime', order: 'desc' },
    },
    detail: {
      title: '任务日志详情',
      width: '60%',
      visibleCount: 10,
    },
  },
});

export default entityModule;
