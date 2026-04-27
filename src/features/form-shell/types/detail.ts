import type { FormItemRule } from 'element-plus';
import type {
  AsyncSelectEntityConfig,
  AsyncSelectFetchParams,
  AsyncSelectFetchResult,
} from '@/components/async-select';
import type {
  AsyncCascaderEntityConfig,
  AsyncCascaderFetchParams,
  AsyncCascaderNode,
  CascaderVal,
} from '@/components/async-cascader';
import type { ColumnsItem } from '@/components/table-entity/index.type';

/******************************** 表单字段类型 ********************************/

// 表单字段类型
export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'datetime'
  | 'select'
  | 'async-select'
  | 'async-cascader'
  | 'textarea'
  | 'radio'
  | 'checkbox'
  | 'switch';

// 异步下拉配置
export interface AsyncSelectConfig {
  entityConfig?: AsyncSelectEntityConfig;
  fetcher?: (params: AsyncSelectFetchParams) => Promise<AsyncSelectFetchResult>;
  columns?: ColumnsItem[];
  valueKey?: string;
  labelKey?: string;
  dragKey?: string;
}

// 异步联级下拉配置
export interface AsyncCascaderConfig {
  entityConfig?: AsyncCascaderEntityConfig;
  fetcher?: (
    params: AsyncCascaderFetchParams
  ) => Promise<AsyncCascaderNode[] | Record<string, any>[]>;
  propsMap?: {
    value?: string;
    label?: string;
    children?: string;
    leaf?: string;
  };
  clearable?: boolean;
  checkStrictly?: boolean;
  emitPath?: boolean;
  showAllLevels?: boolean;
}

// 单个表单字段定义
export interface DetailField {
  prop: string;
  label: string;
  type?: FieldType;
  options?: Array<{ label: string; value: any }>;
  asyncSelectConfig?: AsyncSelectConfig;
  asyncCascaderConfig?: AsyncCascaderConfig;
  readonly?: boolean;
  disabled?: boolean;
  disabledOnEdit?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  multiple?: boolean;
  clearable?: boolean;
  rules?: FormItemRule[];
  placeholder?: string;
  defaultValue?: unknown;
  defaultPath?: CascaderVal;
  hideOnCreate?: boolean;
  hideOnEdit?: boolean;
  copyable?: boolean;
}

// 表单记录结构
export type DetailRecord = Record<string, any>;
