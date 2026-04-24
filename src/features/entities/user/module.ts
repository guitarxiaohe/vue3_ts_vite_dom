import { defineAsyncComponent } from 'vue';
import type { EntityModule } from '@/features/entities/types';
// 用户管理模块配置
const entityModule: EntityModule = {
  entityKey: 'user',
  form: {
    component: defineAsyncComponent(() => import('./form/index.vue')),
  },
  rowActions: {
    actionColumnWidth: 220,
    customButtons: [
      {
        key: 'resetPassword',
        label: '重置密码',
        order: 40,
        component: defineAsyncComponent(
          () => import('./row-actions/reset-button.vue')
        ),
      },
    ],
  },
  config: {
    entityKey: 'user',
    title: '用户管理',
    actions: {
      showCreate: true,
      showEdit: true,
      showCopy: true,
      showDelete: true,
      showImport: true,
      showExport: true,
    },
    table: {
      rowKey: 'userId',
      height: 520,
      pageSize: 20,
      defaultSort: { field: 'userId', order: 'asc' },
      showColumnSettings: true,
    },
    detail: {
      title: '用户详情',
      width: '42%',
      visibleCount: 8,
    },
  },
};

export default entityModule;
