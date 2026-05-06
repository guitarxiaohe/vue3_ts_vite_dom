import { defineAsyncComponent } from 'vue';
import type { EntityModule } from '@/features/entities/types';

/******************************** 菜单实体 ********************************/

// 菜单模块
const entityModule: EntityModule = {
  entityKey: 'menu',
  form: {
    component: defineAsyncComponent(() => import('./form/index.vue')),
  },
  rowActions: {
    showView: false,
    showCopy: false,
    actionColumnWidth: 160,
  },
  config: {
    entityKey: 'menu',
    title: '菜单管理',
    actions: {
      showCreate: true,
      showEdit: true,
      showCopy: false,
      showDelete: true,
      showImport: false,
      showExport: false,
    },
    filters: {
      fields: {
        menuId: {
          key: 'menuId',
          label: '菜单编号',
          component: 'input',
          placeholder: '请输入菜单编号',
          order: 1,
        },
        menuName: {
          key: 'menuName',
          label: '菜单名称',
          component: 'input',
          placeholder: '请输入菜单名称',
          order: 2,
        },
        path: {
          key: 'path',
          label: '访问路径',
          component: 'input',
          placeholder: '请输入访问路径',
          order: 3,
        },
      },
    },
    table: {
      rowKey: 'menuId',
      height: 560,
      pageSize: 20,
      showColumnSettings: true,
      useFieldConfig: false,
    },
    detail: {
      title: '菜单详情',
      width: '52%',
      visibleCount: 10,
    },
  },
};

export default entityModule;
