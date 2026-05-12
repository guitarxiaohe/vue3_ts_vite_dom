import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

/******************************** 登录日志实体（只读） ********************************/

const entityModule = createEntityModule({
  entityKey: 'loginLog',
  config: {
    title: '登录日志',
    actions: {
      showCreate: false,
      showEdit: false,
      showCopy: false,
      showDelete: true,
      showExport: true,
    },
    filters: {
      fields: {
        userName: {
          key: 'userName',
          label: '用户名称',
          component: 'input',
          placeholder: '请输入用户名称',
          order: 1,
        },
        ipaddr: {
          key: 'ipaddr',
          label: '登录地址',
          component: 'input',
          placeholder: '请输入登录地址',
          order: 2,
        },
        status: {
          key: 'status',
          label: '登录状态',
          component: 'select',
          placeholder: '请选择登录状态',
          order: 3,
          options: [
            { label: '成功', value: '0' },
            { label: '失败', value: '1' },
          ],
        },
      },
    },
    table: {
      rowKey: 'infoId',
      height: 560,
      pageSize: 20,
      defaultSort: { field: 'loginTime', order: 'desc' },
    },
    detail: {
      title: '登录日志详情',
      width: '52%',
      visibleCount: 8,
    },
  },
});

export default entityModule;
