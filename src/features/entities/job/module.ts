import { defineAsyncComponent } from 'vue';
import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

/******************************** 定时任务实体 ********************************/

const entityModule = createEntityModule({
  entityKey: 'job',
  formComponent: defineAsyncComponent(() => import('./form/index.vue')),
  rowActions: {
    actionColumnWidth: 180,
  },
  config: {
    title: '定时任务',
    actions: {
      showImport: false,
      showExport: true,
    },
    filters: {
      fields: {
        jobName: {
          key: 'jobName',
          label: '任务名称',
          component: 'input',
          placeholder: '请输入任务名称',
          order: 1,
        },
        jobGroup: {
          key: 'jobGroup',
          label: '任务组名',
          component: 'input',
          placeholder: '请输入任务组名',
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
            { label: '暂停', value: '1' },
          ],
        },
      },
    },
    table: {
      rowKey: 'jobId',
      height: 560,
      defaultSort: { field: 'jobId', order: 'asc' },
    },
    detail: {
      title: '任务详情',
      width: '52%',
      visibleCount: 10,
    },
  },
});

export default entityModule;
