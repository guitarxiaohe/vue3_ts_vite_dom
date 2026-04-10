/**
 * 附件数据结构（与后端接口保持一致）
 */
export interface AttachmentData {
  /** 文件名称 */
  name?: string;
  /** 文件类型 */
  type?: string;
  /** 文件URL 或 key */
  url?: string;
  /** 文件大小 */
  size?: number;
}

/**
 * 文件上传组件 Props
 */
export interface FileUploadProps {
  /** 文件数据（支持 v-model，可以是字符串 URL、AttachmentData 对象或数组） */
  modelValue?: string | AttachmentData | AttachmentData[];

  /** 是否禁用 */
  disabled?: boolean;

  /** 文件大小限制（MB），默认 5MB */
  maxSize?: number;

  /** 允许的文件类型 */
  accept?: string[];

  /** 文件显示宽度（px） */
  width?: number;

  /** 文件显示高度（px） */
  height?: number;

  /** 是否显示文件预览 */
  showPreview?: boolean;

  /** 是否显示下载按钮 */
  showDownload?: boolean;

  /** 是否显示删除按钮 */
  showRemove?: boolean;

  /** 自定义文件名称显示 */
  fileName?: string;

  /** 占位符文本 */
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
}

/**
 * 文件上传组件 Emits
 */
export interface FileUploadEmits {
  (
    e: 'update:modelValue',
    value: string | AttachmentData | AttachmentData[] | undefined
  ): void;
  (e: 'upload-success', file: AttachmentData): void;
  (e: 'upload-error', error: Error): void;
  (e: 'remove', file: AttachmentData): void;
  (e: 'preview', file: AttachmentData): void;
  (e: 'download', file: AttachmentData): void;
}
