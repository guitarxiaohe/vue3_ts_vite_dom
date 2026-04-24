import type { FormItemRule } from 'element-plus';
import type { ColumnsItem, TableListQuery } from '@/components/table-entity/index.type';

/******************************** 表单字段配置 ********************************/

// 选项来源类型
export type OptionSource = 'static' | 'api';

// 实体表单字段配置
export interface EntityFormField {
  prop: string;
  label: string;
  type:
    | 'text'
    | 'number'
    | 'select'
    | 'async-select'
    | 'date'
    | 'datetime'
    | 'textarea'
    | 'switch'
    | 'radio'
    | 'checkbox';
  required?: boolean;
  min?: number;
  max?: number;
  readonly?: boolean;
  disabled?: boolean;
  disabledOnEdit?: boolean;
  hideOnCreate?: boolean;
  hideOnEdit?: boolean;
  optionSource?: OptionSource;
  multiple?: boolean;
  clearable?: boolean;
  options?: Array<{ label: string; value: string | number | boolean }>;
  apiOptions?: {
    queryKey?: string | string[];
    entityKey?: string;
    valueKey?: string;
    labelKey?: string;
    dragKey?: string;
    columns?: ColumnsItem[];
    dataParams?: Record<string, string | number | boolean | undefined>;
    fetcher?: (
      query: TableListQuery & { keyword?: string }
    ) => Promise<{ rows: Record<string, any>[]; total: number }>;
  };
  rules?: FormItemRule[];
  placeholder?: string;
  defaultValue?: unknown;
  copyable?: boolean;
}

/******************************** 表单组件协议 ********************************/

// 实体表单组件 Props
export interface EntityFormProps {
  visible: boolean;
  isCreate: boolean;
  record?: Record<string, unknown>;
  recordList?: Record<string, unknown>[];
  initialIndex?: number;
}

// 实体表单组件 Emits
export interface EntityFormEmits {
  (e: 'update:visible', value: boolean): void;
  (e: 'save', data: Record<string, unknown>): void;
  (e: 'cancel'): void;
}
