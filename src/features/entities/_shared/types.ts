/** Element Plus 表单校验规则类型 */
import type { FormItemRule } from 'element-plus';
/** 表格实体相关类型：列配置项、表格列表查询参数 */
import type {
  ColumnsItem,
  TableListQuery,
} from '@/components/table-entity/index.type';

/******************************** 表单字段配置 ********************************/

// 选项来源类型
export type OptionSource = 'static' | 'api';

// 实体表单字段配置
export interface EntityFormField {
  /** 字段名（对应表单数据对象的 key） */
  prop: string;
  /** 字段标签（表单项前面显示的名称） */
  label: string;
  /** 字段类型（决定渲染为什么表单控件） */
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
    | 'checkbox'
    | 'articleEditor';
  /** 是否必填 */
  required?: boolean;
  /** 最小值/最小长度（数值类型为最小值，文本类型为最小长度） */
  min?: number;
  /** 最大值/最大长度 */
  max?: number;
  /** 是否只读 */
  readonly?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 编辑模式下是否禁用 */
  disabledOnEdit?: boolean;
  /** 新建时是否隐藏该字段 */
  hideOnCreate?: boolean;
  /** 编辑时是否隐藏该字段 */
  hideOnEdit?: boolean;
  /** 选项来源：'static' 静态数据 | 'api' 远程接口 */
  optionSource?: OptionSource;
  /** 是否多选 */
  multiple?: boolean;
  /** 是否可清空 */
  clearable?: boolean;
  /** 静态选项列表 */
  options?: Array<{ label: string; value: string | number | boolean }>;
  /** 远程选项配置（当 optionSource='api' 时生效） */
  apiOptions?: {
    /** Vue Query 缓存 key，用于数据请求的缓存标识 */
    queryKey?: string | string[];
    /** 实体标识，对应后端实体资源路径 */
    entityKey?: string;
    /** 字典类型代码，设置后将使用字典缓存数据而非实体 API */
    dictCode?: string;
    /** 返回数据中作为选项 value 的字段名 */
    valueKey?: string;
    /** 返回数据中作为选项 label 的字段名 */
    labelKey?: string;
    /** 返回数据中作为选项副标题的字段名 */
    subtitleKey?: string;
    /** 弹窗选择时的表格列配置 */
    columns?: ColumnsItem[];
    /** 额外请求参数 */
    dataParams?: Record<string, string | number | boolean | undefined>;
    /** 自定义数据请求函数（覆盖默认的实体列表请求） */
    fetcher?: (
      query: TableListQuery & { keyword?: string }
    ) => Promise<{ rows: Record<string, any>[]; total: number }>;
    /** 级联选择器的数据请求函数 */
    cascaderFetcher?: (query: TableListQuery) => Promise<{
      rows: Record<string, any>[];
    }>;
    /** 父节点字段名（用于树形结构） */
    parentKey?: string;
    /** 子节点字段名（用于树形结构） */
    childrenKey?: string;
    /** 叶子节点字段名（用于树形结构） */
    leafKey?: string;
    /** 根节点的父级值（用于树形结构的顶层判断） */
    rootParentValue?: string | number | null;
  };
  /** 自定义校验规则 */
  rules?: FormItemRule[];
  /** 占位符文本 */
  placeholder?: string;
  /** 默认值 */
  defaultValue?: unknown;
  /** 是否显示复制按钮 */
  copyable?: boolean;
  /** 条件可见性：根据表单数据动态控制字段是否显示 */
  visibleWhen?: (formData: Record<string, any>) => boolean;

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
  /** 文本编辑器配置（仅 type='articleEditor' 时有效） */
  articleEditorConfig?: {};
}

/******************************** 表单组件协议 ********************************/

/** 实体表单组件的 Props 类型定义 */
export interface EntityFormProps {
  /** 实体标识（如 'user'、'order' 等） */
  entityKey?: string;
  /** 控制表单弹窗是否可见 */
  visible: boolean;
  /** 是否为新建模式（true=新建，false=编辑） */
  isCreate: boolean;
  /** 编辑时的当前记录数据 */
  record?: Record<string, unknown>;
  /** 批量编辑时的记录列表 */
  recordList?: Record<string, unknown>[];
  /** 批量编辑时的初始索引（默认从第一条开始） */
  initialIndex?: number;
}

/** 实体表单组件的 Emits 类型定义 */
export interface EntityFormEmits {
  /** 更新弹窗可见状态（支持 v-model:visible 双向绑定） */
  (e: 'update:visible', value: boolean): void;
  /** 保存成功后触发，携带保存的数据 */
  (e: 'save', data?: Record<string, unknown>): void;
  /** 取消/关闭表单时触发 */
  (e: 'cancel'): void;
}
