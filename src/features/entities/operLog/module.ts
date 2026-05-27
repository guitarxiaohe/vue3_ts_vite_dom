import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

/******************************** 操作日志实体（只读） ********************************/

const entityModule = createEntityModule({
  entityKey: 'operLog',
  config: {
    title: '操作日志',
    actions: {
      showCreate: false,
      showEdit: false,
      showCopy: false,
      showDelete: true,
      showExport: true,
    },
    filters: {
      fields: {
        title: {
          key: 'title',
          label: '系统模块',
          component: 'input',
          placeholder: '请输入系统模块',
          order: 1,
        },
        operName: {
          key: 'operName',
          label: '操作人员',
          component: 'input',
          placeholder: '请输入操作人员',
          order: 2,
        },
        status: {
          key: 'status',
          label: '操作状态',
          component: 'select',
          placeholder: '请选择操作状态',
          order: 3,
          options: [
            { label: '成功', value: '0' },
            { label: '失败', value: '1' },
          ],
        },
      },
    },
    table: {
      rowKey: 'operId',
      height: 560,
      defaultSort: { field: 'operTime', order: 'desc' },
    },
    detail: {
      title: '操作日志详情',
      width: '52%',
      visibleCount: 12,
    },
  },
});

export default entityModule;
