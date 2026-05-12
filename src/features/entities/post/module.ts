import { defineAsyncComponent } from 'vue';
import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

/******************************** 岗位实体 ********************************/

const entityModule = createEntityModule({
  entityKey: 'post',
  formComponent: defineAsyncComponent(() => import('./form/index.vue')),
  rowActions: {
    actionColumnWidth: 180,
  },
  config: {
    title: '岗位管理',
    actions: {
      showImport: false,
      showExport: true,
    },
    filters: {
      fields: {
        postCode: {
          key: 'postCode',
          label: '岗位编码',
          component: 'input',
          placeholder: '请输入岗位编码',
          order: 1,
        },
        postName: {
          key: 'postName',
          label: '岗位名称',
          component: 'input',
          placeholder: '请输入岗位名称',
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
      rowKey: 'postId',
      height: 560,
      defaultSort: { field: 'postSort', order: 'asc' },
    },
    detail: {
      title: '岗位详情',
      width: '52%',
      visibleCount: 8,
    },
  },
});

export default entityModule;
