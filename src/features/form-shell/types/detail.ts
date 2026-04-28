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
  | 'picture'
  | 'fileUpload'
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
  /** 图片上传配置（仅 type='picture' 时有效） */
  pictureConfig?: {
    /** 文件大小限制（MB），默认 5 */
    maxSize?: number;
    /** 允许的文件类型 */
    accept?: string[];
    /** 图片宽度（px），默认 148 */
    width?: number;
    /** 图片高度（px），默认 148 */
    height?: number;
  };

  /** 文件上传配置（仅 type='file-upload' 时有效） */
  fileConfig?: {
    /** 文件大小限制（MB），默认 5 */
    maxSize?: number;
    /** 允许的文件类型 */
    accept?: string[];
    /** 文件显示宽度（px），默认 200 */
    width?: number;
    /** 文件显示高度（px），默认 40 */
    height?: number;
    /** 是否显示文件预览，默认 true */
    showPreview?: boolean;
    /** 是否显示下载按钮，默认 true */
    showDownload?: boolean;
    /** 是否显示删除按钮，默认 true */
    showRemove?: boolean;
    /** 自定义文件名称显示 */
    fileName?: string;
    /** 占位符文本，默认 '请选择文件' */
    placeholder?: string;
    /** 是否选中（显示蓝色边框） */
    selected?: boolean;
    /** 错误信息（显示错误状态） */
    errorMessage?: string;
    /** 最大文件数量限制，用于区分单文件/多文件模式：
     * - 未设置或为 1：单文件模式
     * - 大于 1：多文件模式，限制最大文件数量
     */
    maxCount?: number;
  };
}

// 表单记录结构
export type DetailRecord = Record<string, any>;
