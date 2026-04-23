import type { ColumnsItem } from '@/components/table-entity/index.type';
import type {
  ExternalFilterDefinition,
  MultiviewFilterField,
} from '@/features/multiview/types';

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
}

/******************************** 筛选配置 ********************************/

// 实体筛选项配置
export interface EntityFilterFieldConfig extends MultiviewFilterField {}

// 实体筛选配置
export interface EntityFiltersConfig {
  fields?: Record<string, EntityFilterFieldConfig>;
  externalFilters?: ExternalFilterDefinition[];
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
  filters?: EntityFiltersConfig;
  table?: EntityTableConfig;
  detail?: EntityDetailConfig;
}
