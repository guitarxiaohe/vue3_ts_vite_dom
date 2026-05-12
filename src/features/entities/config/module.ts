import { defineAsyncComponent } from 'vue';
import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

/******************************** 参数配置实体 ********************************/

const entityModule = createEntityModule({
  entityKey: 'config',
  formComponent: defineAsyncComponent(() => import('./form/index.vue')),
  rowActions: {
    actionColumnWidth: 180,
  },
  config: {
    title: '参数配置',
    actions: {
      showImport: false,
      showExport: true,
    },
    filters: {
      fields: {
        configName: {
          key: 'configName',
          label: '参数名称',
          component: 'input',
          placeholder: '请输入参数名称',
          order: 1,
        },
        configKey: {
          key: 'configKey',
          label: '参数键名',
          component: 'input',
          placeholder: '请输入参数键名',
          order: 2,
        },
        configType: {
          key: 'configType',
          label: '系统内置',
          component: 'select',
          placeholder: '请选择',
          order: 3,
          options: [
            { label: '是', value: 'Y' },
            { label: '否', value: 'N' },
          ],
        },
      },
    },
    table: {
      rowKey: 'configId',
      height: 560,
      defaultSort: { field: 'configId', order: 'asc' },
    },
    detail: {
      title: '参数详情',
      width: '52%',
      visibleCount: 8,
    },
  },
});

export default entityModule;
