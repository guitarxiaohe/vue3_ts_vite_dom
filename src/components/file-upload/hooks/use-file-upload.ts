/**
 * 文件上传 Composable
 *
 * 提供文件上传、状态管理、文件操作等功能
 */
import { ref, computed, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import type { UploadProps, UploadRequestOptions } from 'element-plus';
import { getUploadKey } from '@/services/file-upload';
import type { AttachmentData } from '../file-upload.type';
import { useFileType } from './use-file-type';
import { useImageUrl } from '@/composables/use-image-url';

export interface UseFileUploadOptions {
  /** 文件数据（支持 v-model，可以是字符串 URL/key 或 AttachmentData 对象） */
  modelValue: Ref<string | AttachmentData | undefined>;
  /** 文件大小限制（MB） */
  maxSize: Ref<number>;
  /** 允许的文件类型 */
  accept: Ref<string[]>;
  /** 自定义文件名称显示 */
  fileName?: Ref<string | undefined>;
  /** 错误信息（显示错误状态） */
  errorMessage?: Ref<string>;
  /** 更新文件数据的回调 */
  onUpdate: (value: string | AttachmentData | undefined) => void;
  /** 上传成功回调 */
  onUploadSuccess?: (file: AttachmentData) => void;
  /** 上传错误回调 */
  onUploadError?: (error: Error) => void;
  /** 删除回调 */
  onRemove?: (file: AttachmentData) => void;
  /** 预览回调 */
  onPreview?: (file: AttachmentData) => void;
  /** 下载回调 */
  onDownload?: (file: AttachmentData) => void;
}

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const sizeKB = bytes / 1024;
  if (sizeKB < 1024) {
    return `${sizeKB.toFixed(2)} KB`;
  }
  const sizeMB = sizeKB / 1024;
  return `${sizeMB.toFixed(2)} MB`;
};

/**
 * 带进度追踪的文件上传
 */
export const uploadToQiniuWithProgress = (
  file: File,
  uploadInfo: { name: string; host: string; url: string },
  onProgress: (progress: number) => void,
  t: (key: string, params?: Record<string, unknown>) => string
): Promise<{ hash: string; key: string }> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    // 监听上传进度
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100);
        onProgress(progress);
      }
    });

    // 监听完成
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch {
          reject(new Error(t('fileUpload.parseResponseFailed')));
        }
      } else {
        reject(
          new Error(
            t('fileUpload.uploadFailedWithStatus', {
              status: xhr.statusText,
            })
          )
        );
      }
    });

    // 监听错误
    xhr.addEventListener('error', () => {
      reject(new Error(t('fileUpload.networkError')));
    });

    // 监听取消
    xhr.addEventListener('abort', () => {
      reject(new Error(t('fileUpload.uploadCancelled')));
    });

    // 发送请求
    xhr.open(
      'POST',
      `${uploadInfo.host}?key=${encodeURIComponent(uploadInfo.name)}`
    );
    xhr.send(formData);
  });
};

/**
 * 文件上传 Composable
 */
export const useFileUpload = (options: UseFileUploadOptions) => {
  const { t } = useI18n();
  const { ensureImageBaseUrl, resolveImageUrl } = useImageUrl();
  void ensureImageBaseUrl();

  // 上传状态
  const loading = ref(false);
  const uploadProgress = ref(0); // 上传进度 0-100
  const uploadingFile = ref<File | null>(null); // 正在上传的文件
  const uploadError = ref<string>(''); // 上传错误信息

  /**
   * 获取文件数据
   * 支持字符串 URL/key 或 AttachmentData 对象
   */
  const fileData = computed((): AttachmentData | null => {
    if (!options.modelValue.value) return null;
    if (typeof options.modelValue.value === 'string') {
      return { url: options.modelValue.value };
    }
    return options.modelValue.value;
  });

  const resolvedFileUrl = computed(() =>
    resolveImageUrl(fileData.value?.url || fileData.value?.name || '')
  );

  const isEmpty = computed(() => !fileData.value && !uploadingFile.value);

  /**
   * 是否处于错误状态
   */
  const isError = computed(() => {
    return Boolean(options.errorMessage?.value || '' || uploadError.value);
  });

  /**
   * 错误消息显示
   */
  const displayErrorMessage = computed(() => {
    return options.errorMessage?.value || uploadError.value || '';
  });

  /**
   * 文件名显示
   */
  const displayFileName = computed(() => {
    if (uploadingFile.value) {
      return uploadingFile.value.name;
    }
    if (!fileData.value) return '';
    return (
      options.fileName?.value ||
      fileData.value.name ||
      t('fileUpload.unnamedFile')
    );
  });

  /**
   * 上传进度显示（已上传/总大小）
   */
  const progressText = computed(() => {
    if (!uploadingFile.value) return '';
    const totalSize = uploadingFile.value.size;
    const uploadedSize = Math.round((totalSize * uploadProgress.value) / 100);
    return `${formatFileSize(uploadedSize)} / ${formatFileSize(totalSize)}`;
  });

  /**
   * 文件类型判断
   * 上传时使用前端文件的 type，回显时使用后端数据的 type
   */
  const fileType = useFileType(
    displayFileName,
    computed(() => {
      // 上传中时使用前端文件的 type
      if (uploadingFile.value) {
        return uploadingFile.value.type;
      }
      // 回显时使用后端数据的 type
      return fileData.value?.type;
    })
  );

  /**
   * 获取文件类型图标类名
   */
  const getFileIconClass = fileType.iconClass;

  /**
   * 获取文件类型图标 SVG
   */
  const getFileIconSvg = fileType.iconSvg;

  const acceptAttr = computed(() => options.accept.value.join(','));

  /**
   * 文件上传前的验证
   */
  const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
    // 清除之前的错误状态（重新上传时覆盖错误）
    uploadError.value = '';

    // 验证文件类型
    if (options.accept.value.length > 0) {
      const isAccepted = options.accept.value.some((type) => {
        // 支持通配符，如 image/*, .pdf
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
   * 自定义上传逻辑（带进度追踪）
   */
  const handleUpload = async (uploadOptions: UploadRequestOptions) => {
    const file = uploadOptions.file as File;
    uploadingFile.value = file;
    loading.value = true;
    uploadProgress.value = 0;
    uploadError.value = '';

    try {
      // 1. 获取上传信息（包含文件名、上传地址、访问 URL 前缀）
      // 注意：这个接口直接返回对象，不包装在 ApiResponse 中
      const uploadInfo = await getUploadKey();
      if (!uploadInfo || !uploadInfo.name) {
        throw new Error(t('upload.fetchInfoFailed'));
      }

      // 2. 上传文件到七牛云（使用 XMLHttpRequest 以获取上传进度）
      const uploadRes = await uploadToQiniuWithProgress(
        file,
        uploadInfo,
        (progress) => {
          uploadProgress.value = progress;
        },
        t
      );

      if (!uploadRes || !uploadRes.key) {
        throw new Error(t('upload.uploadFailed'));
      }

      // 4. 构建 AttachmentData 对象（保存文件 key）
      const attachmentData: AttachmentData = {
        name: file.name,
        type: file.type,
        url: uploadRes.key,
        size: file.size,
      };

      // 5. 更新 v-model（保存 AttachmentData 对象）
      options.onUpdate(attachmentData);
      options.onUploadSuccess?.(attachmentData);

      ElMessage.success(t('upload.uploadSuccess'));
    } catch (error) {
      const err = error as Error;
      uploadError.value = err.message || t('upload.uploadRetryFailed');
      options.onUploadError?.(err);
      ElMessage.error(uploadError.value);
    } finally {
      loading.value = false;
      uploadingFile.value = null;
      uploadProgress.value = 0;
    }
  };

  /**
   * 删除文件
   */
  const handleRemove = () => {
    // 清除所有状态（包括错误状态）
    uploadError.value = '';
    uploadingFile.value = null;
    uploadProgress.value = 0;
    loading.value = false;

    options.onUpdate(undefined);
    if (fileData.value) {
      options.onRemove?.(fileData.value);
    }
  };

  /**
   * 预览文件
   */
  const handlePreview = () => {
    const url = resolvedFileUrl.value;
    if (url && fileData.value) {
      window.open(url, '_blank');
      options.onPreview?.(fileData.value);
    }
  };

  /**
   * 下载文件
   */
  const handleDownload = () => {
    if (isError.value) {
      ElMessage.error(
        t('fileUpload.fileDownloadError', {
          defaultValue: `文件下载错误，无法下载`,
        })
      );
      return;
    }
    const url = resolvedFileUrl.value;
    if (url && fileData.value) {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileData.value.name || 'file';
      link.click();
      options.onDownload?.(fileData.value);
    }
  };

  return {
    // 状态
    loading,
    uploadProgress,
    uploadingFile,
    uploadError,
    // 计算属性
    fileData,
    isEmpty,
    isError,
    displayErrorMessage,
    displayFileName,
    progressText,
    getFileIconClass,
    getFileIconSvg,
    acceptAttr,
    // 方法
    beforeUpload,
    handleUpload,
    handleRemove,
    handlePreview,
    handleDownload,
    // 工具函数
    formatFileSize,
  };
};
