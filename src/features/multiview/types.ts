import type { Component } from 'vue';
import type { AsyncSelectEntityConfig } from '@/components/async-select';

/******************************** 筛选类型 ********************************/

// 筛选表单值
export type FilterFormValue =
  | string
  | number
  | boolean
  | Date
  | undefined
  | null
  | FilterFormValue[];

// 外部筛选定义
export interface ExternalFilterDefinition {
  key: string;
  label: string;
  value?: FilterFormValue;
}

// 筛选控件类型
export type MultiviewFilterComponent =
  | 'input'
  | 'select'
  | 'async-select'
  | 'date'
  | 'custom';

// 筛选选项
export interface MultiviewFilterOption {
  label: string;
  value: string | number | boolean;
}

// 筛选项定义
export interface MultiviewFilterField {
  key: string;
  label: string;
  component?: MultiviewFilterComponent;
  placeholder?: string;
  defaultValue?: FilterFormValue;
  hidden?: boolean;
  order?: number;
  options?: MultiviewFilterOption[];
  valueKey?: string;
  labelKey?: string;
  dragKey?: string;
  entityConfig?: AsyncSelectEntityConfig;
  renderComponent?: Component;
  componentProps?: Record<string, unknown>;
}
