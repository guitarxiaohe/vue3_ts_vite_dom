import type { Component } from 'vue';
import type {
  EntityBatchActionConfig,
  EntityFormSubmitContext,
  EntityModule,
  EntityTableActionConfig,
} from '@/features/entities/types';
import type { EntityConfig } from '@/types/entity-config';
import type { EntityRowActionsConfig } from './row-actions-types';

/******************************** 类型定义 ********************************/

interface CreateEntityModuleOptions {
  entityKey: string;
  formComponent?: Component;
  formSubmit?: (
    context: EntityFormSubmitContext
  ) => Promise<Record<string, unknown> | void>;
  detailComponent?: Component;
  config?: Omit<EntityConfig, 'entityKey'> & { entityKey?: string };
  rowActions?: EntityRowActionsConfig;
  tableActions?: {
    left?: Array<Component | EntityTableActionConfig>;
    right?: Array<Component | EntityTableActionConfig>;
  };
  batchActions?: Array<Component | EntityBatchActionConfig>;
}

/******************************** 默认值 ********************************/

const defaultActions = {
  showCreate: true,
  showEdit: true,
  showCopy: true,
  showDelete: true,
  showImport: false,
  showExport: false,
};

const defaultTableConfig = {
  pageSize: 20,
  showColumnSettings: true,
};

const defaultDetailConfig = {
  width: '52%',
  visibleCount: 8,
};

/******************************** 工厂方法 ********************************/

// 创建标准实体模块配置
export function createEntityModule(
  options: CreateEntityModuleOptions
): EntityModule {
  const config = options.config;

  return {
    entityKey: options.entityKey,
    form:
      options.formComponent || options.formSubmit
        ? {
            component: options.formComponent,
            submit: options.formSubmit,
          }
        : undefined,
    detail: options.detailComponent
      ? {
          component: options.detailComponent,
        }
      : undefined,
    rowActions: options.rowActions ?? {},
    tableActions: options.tableActions,
    batchActions: options.batchActions,
    config: config
      ? {
          entityKey: config.entityKey || options.entityKey,
          ...config,
          actions: {
            ...defaultActions,
            ...(config.actions ?? {}),
          },
          table: {
            ...defaultTableConfig,
            ...(config.table ?? {}),
          },
          detail: {
            ...defaultDetailConfig,
            ...(config.detail ?? {}),
          },
        }
      : undefined,
  };
}
