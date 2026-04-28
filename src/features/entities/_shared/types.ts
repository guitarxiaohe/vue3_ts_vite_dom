import type { FormItemRule } from 'element-plus';
import type {
  ColumnsItem,
  TableListQuery,
} from '@/components/table-entity/index.type';

/******************************** 表单字段配置 ********************************/

// 选项来源类型
export type OptionSource = 'static' | 'api';

// 实体表单字段配置
export interface EntityFormField {
  prop: string;
  label: string;
  type:
    | 'picture'
    | 'fileUpload'
    | 'text'
    | 'number'
    | 'select'
    | 'async-select'
    | 'async-cascader'
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
    cascaderFetcher?: (query: TableListQuery) => Promise<{
      rows: Record<string, any>[];
    }>;
    parentKey?: string;
    childrenKey?: string;
    leafKey?: string;
    rootParentValue?: string | number | null;
  };
  rules?: FormItemRule[];
  placeholder?: string;
  defaultValue?: unknown;
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

/******************************** 表单组件协议 ********************************/

// 实体表单组件 Props
export interface EntityFormProps {
  entityKey?: string;
  visible: boolean;
  isCreate: boolean;
  record?: Record<string, unknown>;
  recordList?: Record<string, unknown>[];
  initialIndex?: number;
}

// 实体表单组件 Emits
export interface EntityFormEmits {
  (e: 'update:visible', value: boolean): void;
  (e: 'save', data?: Record<string, unknown>): void;
  (e: 'cancel'): void;
}
