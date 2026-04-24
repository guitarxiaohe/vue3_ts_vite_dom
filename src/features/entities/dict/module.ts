import { defineAsyncComponent } from 'vue';
import type { EntityModule } from '@/features/entities/types';

/******************************** 字典类型实体 ********************************/

// 字典类型模块（子表实体：dictData，关联字段：dictType）
const entityModule: EntityModule = {
  entityKey: 'dict',
  form: {
    component: defineAsyncComponent(
      () => import('@/features/entities/dict/form/index.vue')
    ),
  },
  rowActions: {
    actionColumnWidth: 180,
  },
  config: {
    entityKey: 'dict',
    title: '字典类型',
    actions: {
      showCreate: true,
      showEdit: true,
      showCopy: true,
      showDelete: true,
      showImport: false,
      showExport: true,
    },
    filters: {
      fields: {
        dictName: {
          key: 'dictName',
          label: '字典名称',
          component: 'input',
          placeholder: '请输入字典名称',
          order: 1,
        },
        dictType: {
          key: 'dictType',
          label: '字典类型',
          component: 'input',
          placeholder: '请输入字典类型',
          order: 2,
        },
        status: {
          key: 'status',
          label: '状态',
          component: 'select',
          placeholder: '请选择状态',
          order: 3,
          options: [
            { label: '启用', value: '0' },
            { label: '停用', value: '1' },
          ],
        },
      },
    },
    table: {
      rowKey: 'dictId',
      height: 560,
      pageSize: 20,
      defaultSort: { field: 'createdTime', order: 'desc' },
      showColumnSettings: true,
      children: [
        {
          label: '字典值信息',
          relationField: {
            parentKey: 'dictType',
            childKey: 'dictType',
          },
          entityKey: 'dictData',
          rowKey: 'dictCode',
          hiddenColumnKeys: ['dictType'],
        },
      ],
    },
    detail: {
      title: '字典类型详情',
      width: '70%',
      visibleCount: 10,
    },
  },
};

export default entityModule;
