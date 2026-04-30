import { defineAsyncComponent } from 'vue';
import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

/******************************** 字典类型实体 ********************************/

// 字典类型模块（子表实体：dictData，关联字段：dictType）
const entityModule = createEntityModule({
  entityKey: 'dict',
  formComponent: defineAsyncComponent(
    () => import('@/features/entities/dict/form/index.vue')
  ),
  rowActions: {
    actionColumnWidth: 180,
  },
  config: {
    title: '字典类型',
    actions: {
      showImport: false,
      showExport: true,
    },
    table: {
      rowKey: 'dictId',
      height: 560,
      defaultSort: { field: 'createdTime', order: 'desc' },
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
});

export default entityModule;
