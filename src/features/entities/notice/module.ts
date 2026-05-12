import { defineAsyncComponent } from 'vue';
import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

/******************************** 通知公告实体 ********************************/

const entityModule = createEntityModule({
  entityKey: 'notice',
  formComponent: defineAsyncComponent(() => import('./form/index.vue')),
  rowActions: {
    actionColumnWidth: 180,
  },
  config: {
    title: '通知公告',
    actions: {
      showImport: false,
      showExport: true,
    },
    filters: {
      fields: {
        noticeTitle: {
          key: 'noticeTitle',
          label: '公告标题',
          component: 'input',
          placeholder: '请输入公告标题',
          order: 1,
        },
        noticeType: {
          key: 'noticeType',
          label: '公告类型',
          component: 'select',
          placeholder: '请选择公告类型',
          order: 2,
          options: [
            { label: '通知', value: '1' },
            { label: '公告', value: '2' },
          ],
        },
        status: {
          key: 'status',
          label: '状态',
          component: 'select',
          placeholder: '请选择状态',
          order: 3,
          options: [
            { label: '正常', value: '0' },
            { label: '关闭', value: '1' },
          ],
        },
      },
    },
    table: {
      rowKey: 'noticeId',
      height: 560,
      defaultSort: { field: 'createdTime', order: 'desc' },
    },
    detail: {
      title: '公告详情',
      width: '52%',
      visibleCount: 8,
    },
  },
});

export default entityModule;
