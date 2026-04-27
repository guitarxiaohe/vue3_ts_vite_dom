/**
 * 多文件上传 Composable
 *
 * 支持多文件并发上传，每个文件独立调用后端接口
 */
import { ref, computed, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import type { UploadProps, UploadRequestOptions } from 'element-plus';
import { uploadFile, toAttachmentData } from '@/services/file-upload';
import type { AttachmentData } from '../file-upload.type';
import { useFileType } from './use-file-type';
import { useImageUrl } from '@/composables/use-image-url';

/**
 * 单个文件上传状态 
 */
export interface FileUploadItem {
  /** 文件对象 */
  file: File;
  /** 上传进度 0-100 */
  progress: number;
  /** 上传状态 */
  status: 'pending' | 'uploading' | 'success' | 'error';
  /** 错误信息 */
  error?: string;
  /** 上传结果 */
  result?: AttachmentData;
}

export interface UseMultipleFileUploadOptions {
  /** 文件数据数组（支持 v-model） */
  modelValue: Ref<AttachmentData[] | undefined>;
  /** 文件大小限制（MB） */
  maxSize: Ref<number>;
  /** 允许的文件类型 */
  accept: Ref<string[]>;
  /** 最大文件数量限制 */
  maxCount?: Ref<number | undefined>;
  /** 错误信息（显示错误状态） */
  errorMessage?: Ref<string>;
  /** 更新文件数据的回调 */
  onUpdate: (value: AttachmentData[] | undefined) => void;
  /** 上传成功回调 */
  onUploadSuccess?: (file: AttachmentData) => void;
  /** 上传错误回调 */
  onUploadError?: (error: Error, file: File) => void;
  /** 删除回调 */
  onRemove?: (file: AttachmentData) => void;
  /** 预览回调 */
  onPreview?: (file: AttachmentData) => void;
  /** 下载回调 */
  onDownload?: (file: AttachmentData) => void;
}

/**
 * 多文件上传 Composable
 */
export const useMultipleFileUpload = (
  options: UseMultipleFileUploadOptions
) => {
  const { t } = useI18n();
  const { ensureImageBaseUrl, resolveImageUrl } = useImageUrl();
  void ensureImageBaseUrl();

  // 上传状态
  const loading = ref(false);
  const uploadItems = ref<Map<string, FileUploadItem>>(new Map());

  /**
   * 获取文件列表
   */
  const fileList = computed(() => {
    return options.modelValue.value || [];
  });

  const isEmpty = computed(() => fileList.value.length === 0);

  /**
   * 是否处于错误状态
   */
  const isError = computed(() => {
    if (options.errorMessage?.value) return true;
    // 检查是否有上传失败的文件
    for (const item of uploadItems.value.values()) {
      if (item.status === 'error') return true;
    }
    return false;
  });

  /**
   * 错误消息显示
   */
  const displayErrorMessage = computed(() => {
    return options.errorMessage?.value || '';
  });

  /**
   * 总上传进度
   */
  const totalProgress = computed(() => {
    const items = Array.from(uploadItems.value.values());
    if (items.length === 0) return 0;
    const total = items.reduce((sum, item) => sum + item.progress, 0);
    return Math.round(total / items.length);
  });

  /**
   * 文件上传前的验证
   */
  const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
    // 检查文件数量限制（仅在 maxCount 大于 1 时生效）
    if (options.maxCount?.value && options.maxCount.value > 1) {
      const currentCount = fileList.value.length + uploadItems.value.size;
      if (currentCount >= options.maxCount.value) {
        ElMessage.error(
          t('fileUpload.maxCountExceeded', {
            count: options.maxCount.value,
            defaultValue: `最多只能上传 ${options.maxCount.value} 个文件`,
          })
        );
        return false;
      }
    }

    // 验证文件类型
    if (options.accept.value.length > 0) {
      const isAccepted = options.accept.value.some((type) => {
        if (type.startsWith('.')) {
          return rawFile.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return rawFile.type
          .toLowerCase()
          .startsWith(type.toLowerCase().replace('*', ''));
      });

      if (!isAccepted) {
        ElMessage.error(
          t('fileUpload.typeNotAllowed', {
            types: options.accept.value.join(', '),
            defaultValue: `只允许上传以下类型的文件: ${options.accept.value.join(', ')}`,
          })
        );
        return false;
      }
    }

    // 验证文件大小
    const sizeMB = rawFile.size / 1024 / 1024;
    if (sizeMB > options.maxSize.value) {
      ElMessage.error(
        t('fileUpload.sizeLimitExceeded', {
          size: options.maxSize.value,
          defaultValue: `文件大小不能超过 ${options.maxSize.value}MB`,
        })
      );
      return false;
    }

    return true;
  };

  /**
   * 单个文件上传
   */
  const uploadSingleFile = async (
    file: File,
    fileId: string
  ): Promise<AttachmentData> => {
    const item = uploadItems.value.get(fileId);
    if (!item) {
      throw new Error(t('fileUpload.uploadItemNotFound'));
    }

    item.status = 'uploading';
    item.progress = 0;

    try {
      const uploadResponse = await uploadFile(file);
      const attachmentData = toAttachmentData(file, uploadResponse);

      item.status = 'success';
      item.progress = 100;
      item.result = attachmentData;

      return attachmentData;
    } catch (error) {
      const err = error as Error;
      item.status = 'error';
      item.error = err.message || t('upload.uploadRetryFailed');
      throw err;
    }
  };

  /**
   * 多文件并发上传
   */
  const handleUpload = async (uploadOptions: UploadRequestOptions) => {
    const file = uploadOptions.file as File;
    const fileId = `${Date.now()}-${Math.random()}`;

    // 创建上传项
    uploadItems.value.set(fileId, {
      file,
      progress: 0,
      status: 'pending',
    });

    loading.value = true;

    try {
      // 上传单个文件
      const attachmentData = await uploadSingleFile(file, fileId);

      // 更新文件列表
      const currentList = [...fileList.value, attachmentData];
      options.onUpdate(currentList);
      options.onUploadSuccess?.(attachmentData);

      ElMessage.success(t('upload.uploadSuccess'));
    } catch (error) {
      const err = error as Error;
      options.onUploadError?.(err, file);
      ElMessage.error(err.message || t('upload.uploadRetryFailed'));
    } finally {
      // 延迟清理上传项，以便显示最终状态
      setTimeout(() => {
        uploadItems.value.delete(fileId);
        if (uploadItems.value.size === 0) {
          loading.value = false;
        }
      }, 1000);
    }
  };

  /**
   * 删除文件
   */
  const handleRemove = (file: AttachmentData) => {
    const currentList = fileList.value.filter(
      (item) => item.url !== file.url && item.name !== file.name
    );
    options.onUpdate(currentList.length > 0 ? currentList : undefined);
    options.onRemove?.(file);
  };

  /**
   * 预览文件
   */
  const handlePreview = (file: AttachmentData) => {
    const url = resolveImageUrl(file.url || file.name || '');
    if (url) {
      window.open(url, '_blank');
      options.onPreview?.(file);
    }
  };

  /**
   * 下载文件
   */
  const handleDownload = (file: AttachmentData) => {
    if (isError.value) {
      ElMessage.error(
        t('fileUpload.fileDownloadError', {
          defaultValue: `文件下载错误，无法下载`,
        })
      );
      return;
    }
    const url = resolveImageUrl(file.url || file.name || '');
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name || 'file';
      link.click();
      options.onDownload?.(file);
    }
  };

  /**
   * 获取文件上传项
   */
  const getUploadItem = (file: AttachmentData): FileUploadItem | undefined => {
    for (const item of uploadItems.value.values()) {
      if (item.result?.url === file.url || item.result?.name === file.name) {
        return item;
      }
    }
    return undefined;
  };

  /**
   * 获取文件类型图标类名
   * 回显时使用后端数据的 type
   */
  const getFileIconClass = (file: AttachmentData) => {
    const fileType = useFileType(file.name || '', file.type);
    return fileType.iconClass.value;
  };

  /**
   * 获取文件类型图标 SVG
   * 回显时使用后端数据的 type
   */
  const getFileIconSvg = (file: AttachmentData) => {
    const fileType = useFileType(file.name || '', file.type);
    return fileType.iconSvg.value;
  };

  const acceptAttr = computed(() => options.accept.value.join(','));

  return {
    // 状态
    loading,
    uploadItems,
    totalProgress,
    // 计算属性
    fileList,
    isEmpty,
    isError,
    displayErrorMessage,
    acceptAttr,
    // 方法
    beforeUpload,
    handleUpload,
    handleRemove,
    handlePreview,
    handleDownload,
    getUploadItem,
    getFileIconClass,
    getFileIconSvg,
  };
};
