import type { Component } from 'vue';
import type { EntityConfig } from '@/types/entity-config';
import type { EntityRowActionsConfig } from './_shared/row-actions-types';

/******************************** 实体模块 ********************************/

// 实体表头按钮配置
export interface EntityTableActionConfig {
  component: Component;
  permissionId?: string;
  permissionCode?: string;
}

// 实体批量按钮配置
export interface EntityBatchActionConfig {
  component: Component;
  permissionId?: string;
  permissionCode?: string;
}

// 实体模块定义
export interface EntityModule {
  entityKey: string;
  form?: {
    component?: Component;
  };
  detail?: {
    component?: Component;
  };
  config?: EntityConfig;
  rowActions?: EntityRowActionsConfig;
  tableActions?: {
    left?: Array<Component | EntityTableActionConfig>;
    right?: Array<Component | EntityTableActionConfig>;
  };
  batchActions?: Array<Component | EntityBatchActionConfig>;
}
