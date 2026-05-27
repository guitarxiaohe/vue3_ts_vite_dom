import { defineAsyncComponent } from 'vue';
import type { EntityModule } from '@/features/entities/types';
import { listMenuRows } from '@/api/modules/menu';

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
    customButtons: [
      {
        key: 'zixiang',
        component: defineAsyncComponent(
          () => import('./row-actions/sub-item.vue')
        ),
        label: 'sdsd',
      },
    ],
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

    table: {
      rowKey: 'menuId',

      height: 560,
      pageSize: 20,
      showColumnSettings: true,
      useFieldConfig: false,
      fetcher: listMenuRows,
    },
    detail: {
      title: '菜单详情',
      width: '52%',
      visibleCount: 10,
    },
  },
};

export default entityModule;
