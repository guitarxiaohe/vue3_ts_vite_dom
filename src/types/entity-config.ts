import type { Component } from 'vue';
import type { ColumnsItem } from '@/components/table-entity/index.type';
import type {
  ExternalFilterDefinition,
  MultiviewFilterComponent,
  MultiviewFilterField,
} from '@/features/multiview/types';
import type { TableListQuery } from '@/components/table-entity/index.type';
import type { FieldConfig } from '@/types/user';

/******************************** 操作配置 ********************************/

// 页面操作按钮配置
export interface EntityActionsConfig {
  showCreate?: boolean;
  createName?: string;
  showEdit?: boolean;
  showCopy?: boolean;
  showDelete?: boolean;
  showImport?: boolean;
  showExport?: boolean;
}

/******************************** 表格配置 ********************************/

// 表格默认排序
export interface EntityTableSortConfig {
  field: string;
  order?: 'asc' | 'desc';
}

// 子表关联字段映射
export interface EntityTableChildRelationFieldConfig {
  parentKey: string;
  childKey: string;
}

// 详情子表配置
export interface EntityTableChildConfig {
  entityKey: string;
  label?: string;
  labelKey?: string;
  relationField:
    | EntityTableChildRelationFieldConfig
    | EntityTableChildRelationFieldConfig[];
  columns?: ColumnsItem[];
  rowKey?: string;
  height?: number;
  pageSize?: number;
  showPagination?: boolean;
  hiddenColumnKeys?: string[];
  dataParams?: Record<string, string | number | boolean | undefined>;
  fetcher?: (
    query: TableListQuery
  ) => Promise<{ total: number; rows: Record<string, any>[] }>;
}

// 表格展示配置
export interface EntityTableConfig {
  columns?: ColumnsItem[];
  rowKey?: string;
  width?: number;
  height?: number;
  pageSize?: number;
  selectable?: boolean;
  multiple?: boolean;
  freezeLeftKeys?: string[];
  defaultSort?: EntityTableSortConfig;
  showColumnSettings?: boolean;
  useFieldConfig?: boolean;
  fetcher?: (
    query: TableListQuery
  ) => Promise<{ total: number; rows: Record<string, any>[] }>;
  children?: EntityTableChildConfig[];
}

/******************************** 筛选配置 ********************************/

// 实体筛选项配置
export interface EntityFilterFieldConfig extends MultiviewFilterField {}

// 实体筛选组件注册上下文
export interface EntityFilterComponentContext {
  entityKey: string;
  field: FieldConfig;
  t: (key: string, params?: Record<string, unknown>) => string;
}

// 实体筛选组件注册
export interface EntityFilterComponentRegistration {
  key: string;
  component: MultiviewFilterComponent | Component;
  fieldKeys?: string[];
  fieldTypes?: string[];
  matcher?: (context: EntityFilterComponentContext) => boolean;
  mapField?: (
    context: EntityFilterComponentContext
  ) => Partial<EntityFilterFieldConfig>;
  props?: (
    context: EntityFilterComponentContext
  ) => Record<string, unknown> | undefined;
}

// 实体筛选配置
export interface EntityFiltersConfig {
  fields?: Record<string, EntityFilterFieldConfig>;
  externalFilters?: ExternalFilterDefinition[];
  components?: EntityFilterComponentRegistration[];
}

/******************************** 详情配置 ********************************/

// 详情抽屉配置
export interface EntityDetailConfig {
  title?: string;
  width?: string | number;
  visibleCount?: number;
  hiddenKeys?: string[];
}

/******************************** 实体配置 ********************************/

// 多视图实体完整配置
export interface EntityConfig {
  entityKey: string;
  title?: string;
  actions?: EntityActionsConfig;
  filters?: EntityFiltersConfig | EntityFilterComponentRegistration[];
  table?: EntityTableConfig;
  detail?: EntityDetailConfig;
}
