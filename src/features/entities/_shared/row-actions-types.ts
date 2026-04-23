import type { Component } from 'vue';

/******************************** 行内按钮类型 ********************************/

export type BuiltinRowActionKey = 'view' | 'edit' | 'copy' | 'delete';

export interface RowActionRuntimeActions {
  view: (row?: Record<string, any>) => void;
  edit: (row?: Record<string, any>) => void;
  copy: (row?: Record<string, any>) => void;
  delete: (row?: Record<string, any>) => Promise<void> | void;
  refresh: () => void;
}

// 行内操作按钮组件配置
export interface RowActionComponentConfig {
  key: string;
  component: Component;
  label?: string;
  labelKey?: string;
  visible?: (
    row: Record<string, any>,
    actions: RowActionRuntimeActions
  ) => boolean;
  order?: number;
  permissionId?: string;
  permissionCode?: string;
}

// 行内操作列渲染项
export interface RowActionRenderConfig {
  key: string;
  label?: string;
  component?: Component;
  actionKey?: BuiltinRowActionKey;
  order?: number;
  danger?: boolean;
}

// 实体行内操作配置
export interface EntityRowActionsConfig {
  showView?: boolean;
  showEdit?: boolean;
  showCopy?: boolean;
  showDelete?: boolean;
  customButtons?: RowActionComponentConfig[];
  actionColumnWidth?: number;
  maxPrimaryActions?: number;
}
