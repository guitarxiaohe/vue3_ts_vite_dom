import { defineAsyncComponent } from 'vue';
import { i18n } from '@/i18n';
import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

/******************************** AI 分类实体 ********************************/

const title = i18n.global.t('entity.chatCategory.title');

const entityModule = createEntityModule({
  entityKey: 'chatCategory',
  formComponent: defineAsyncComponent(() => import('./form/index.vue')),
  rowActions: {
    actionColumnWidth: 180,
  },
  tableActions: {
    right: [
      {
        component: defineAsyncComponent(
          () => import('./batch-actions/rule.vue')
        ),
      },
    ],
  },
  config: {
    title,
    actions: {
      showImport: true,
      showExport: true,
    },
    table: {
      rowKey: 'categoryId',
      height: 560,
      defaultSort: { field: 'sort', order: 'asc' },
    },
    detail: {
      title,
      width: '52%',
      visibleCount: 8,
    },
  },
});

export default entityModule;
