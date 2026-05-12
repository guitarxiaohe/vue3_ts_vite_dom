import { defineAsyncComponent } from 'vue';
import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

/******************************** 字典值实体 ********************************/

// 字典值作为 dict 的子表，也支持独立列表访问
const entityModule = createEntityModule({
  entityKey: 'dictData',
  formComponent: defineAsyncComponent(() => import('./form/index.vue')),
  rowActions: {
    actionColumnWidth: 180,
  },
  config: {
    title: '字典值管理',
    actions: {
      showImport: false,
      showExport: true,
    },
    filters: {
      fields: {
        dictType: {
          key: 'dictType',
          label: '字典类型',
          component: 'input',
          placeholder: '请输入字典类型',
          order: 1,
        },
        dictLabel: {
          key: 'dictLabel',
          label: '字典标签',
          component: 'input',
          placeholder: '请输入字典标签',
          order: 2,
        },
        status: {
          key: 'status',
          label: '状态',
          component: 'select',
          placeholder: '请选择状态',
          order: 3,
          options: [
            { label: '正常', value: '0' },
            { label: '停用', value: '1' },
          ],
        },
      },
    },
    table: {
      rowKey: 'dictCode',
      height: 560,
      defaultSort: { field: 'dictSort', order: 'asc' },
    },
    detail: {
      title: '字典值详情',
      width: '52%',
      visibleCount: 8,
    },
  },
});

export default entityModule;
