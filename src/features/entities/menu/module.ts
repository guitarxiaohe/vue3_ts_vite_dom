import { defineAsyncComponent, h } from 'vue';
import type { EntityModule } from '@/features/entities/types';
import type { ColumnsItem } from '@/components/table-entity/index.type';
import { listMenuRows } from '@/api/modules/menu';
import { i18n } from '@/i18n';

function createMenuColumns(): ColumnsItem[] {
  return [
    {
      key: 'menuName',
      dataKey: 'menuName',
      title: i18n.global.t('menuPage.menuName'),
      width: 240,
      fieldType: 'input',
      cellRenderer: ({ rowData, cellData }) =>
        h(
          'div',
          {
            style: {
              paddingLeft: `${Math.max(Number(rowData.menuLevel ?? 1) - 1, 0) * 18}px`,
              fontWeight: Number(rowData.menuLevel ?? 1) === 1 ? '600' : '400',
            },
          },
          String(cellData ?? '--')
        ),
    },
    {
      key: 'menuType',
      dataKey: 'menuType',
      title: i18n.global.t('menuPage.menuType'),
      width: 110,
      fieldType: 'select',
      cellRenderer: ({ cellData }) => {
        const value = String(cellData ?? '');
        let text = value || '--';
        if (value === 'M') text = i18n.global.t('menuPage.typeDirectory');
        if (value === 'C') text = i18n.global.t('menuPage.typeMenu');
        if (value === 'F') text = i18n.global.t('menuPage.typeButton');
        return h('span', text);
      },
    },
    {
      key: 'parentName',
      dataKey: 'parentName',
      title: i18n.global.t('menuPage.parentMenu'),
      width: 160,
      fieldType: 'input',
    },
    {
      key: 'orderNum',
      dataKey: 'orderNum',
      title: i18n.global.t('menuPage.orderNum'),
      width: 100,
      fieldType: 'number',
    },
    {
      key: 'path',
      dataKey: 'path',
      title: i18n.global.t('menuPage.path'),
      width: 180,
      fieldType: 'input',
    },
    {
      key: 'component',
      dataKey: 'component',
      title: i18n.global.t('menuPage.component'),
      width: 180,
      fieldType: 'input',
    },
    {
      key: 'perms',
      dataKey: 'perms',
      title: i18n.global.t('menuPage.permission'),
      width: 180,
      fieldType: 'input',
    },
    {
      key: 'visible',
      dataKey: 'visible',
      title: i18n.global.t('menuPage.visible'),
      width: 110,
      fieldType: 'select',
      cellRenderer: ({ cellData }) =>
        h(
          'span',
          String(cellData ?? '0') === '0'
            ? i18n.global.t('menuPage.visibleYes')
            : i18n.global.t('menuPage.visibleNo')
        ),
    },
    {
      key: 'status',
      dataKey: 'status',
      title: i18n.global.t('menuPage.status'),
      width: 110,
      fieldType: 'select',
      cellRenderer: ({ cellData }) =>
        h(
          'span',
          String(cellData ?? '0') === '0'
            ? i18n.global.t('menuPage.statusEnabled')
            : i18n.global.t('menuPage.statusDisabled')
        ),
    },
    {
      key: 'createTime',
      dataKey: 'createTime',
      title: i18n.global.t('common.createTime'),
      width: 180,
      fieldType: 'datetime',
    },
  ];
}

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
