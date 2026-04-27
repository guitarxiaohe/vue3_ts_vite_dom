<script setup lang="ts">
/**
 * 文件上传组件
 *
 * 功能：
 * - 支持单文件/多文件上传
 * - 自动调用后端接口获取上传文件名
 * - 上传成功后返回文件 key
 * - 支持预览、下载、删除
 * - 支持文件格式和大小验证
 * - 显示上传进度
 * - 支持错误状态显示
 * - 支持选中状态
 * - 多文件模式下支持并发上传
 */
import { computed, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { Upload } from '@element-plus/icons-vue';
import type {
  FileUploadProps,
  FileUploadEmits,
  AttachmentData,
} from './file-upload.type';
import { useFileUpload } from './composables/use-file-upload';
import { useMultipleFileUpload } from './composables/use-multiple-file-upload';
import FileStatus from './components/file-status.vue';

const props = withDefaults(defineProps<FileUploadProps>(), {
  modelValue: '',
  disabled: false,
  maxSize: 5,
  accept: () => [],
  width: 200,
  height: 40,
  showPreview: true,
  showDownload: true,
  showRemove: true,
  placeholder: undefined,
  selected: false,
  errorMessage: '',
  fileName: undefined,
  maxCount: 1,
});

const emit = defineEmits<FileUploadEmits>();
const { t } = useI18n();

// 将 props 转换为 refs
const { maxSize, accept, fileName, errorMessage, maxCount } = toRefs(props);

// Placeholder 国际化处理
const placeholder = computed(() => {
  return props.placeholder || t('fileUpload.placeholder');
});

// 根据 maxCount 判断是否为多文件模式（maxCount > 1 为多文件模式）
const isMultiple = computed(
  () => props.maxCount !== undefined && props.maxCount > 1
);

// 单文件当前状态，供 FileStatus 子组件内部判断展示（loading | error | success），空时为 null 不渲染 FileStatus
const singleFileStatus = computed<'loading' | 'error' | 'success' | null>(
  () => {
    if (loading.value) return 'loading';
    if (isError.value) return 'error';
    if (!isEmpty.value) return 'success';
    return null;
  }
);

// 单文件上传 Composable
const singleFileUpload = useFileUpload({
  modelValue: computed(() => {
    const value = props.modelValue;
    if (Array.isArray(value)) {
      return value[0] || undefined;
    }
    return typeof value === 'string' ? value : value;
  }),
  maxSize,
  accept,
  fileName,
  errorMessage,
  onUpdate: (value) => {
    emit('update:modelValue', value);
  },
  onUploadSuccess: (file) => {
    emit('upload-success', file);
  },
  onUploadError: (error) => {
    emit('upload-error', error);
  },
  onRemove: (file) => {
    emit('remove', file);
  },
  onPreview: (file) => {
    emit('preview', file);
  },
  onDownload: (file) => {
    emit('download', file);
  },
});

// 多文件上传 Composable
const multipleFileUpload = useMultipleFileUpload({
  modelValue: computed(() => {
    const value = props.modelValue;
    if (Array.isArray(value)) {
      return value;
    }
    if (value && typeof value !== 'string') {
      return [value];
    }
    return undefined;
  }),
  maxSize,
  accept,
  maxCount,
  errorMessage,
  onUpdate: (value) => {
    emit('update:modelValue', value);
  },
  onUploadSuccess: (file) => {
    emit('upload-success', file);
  },
  onUploadError: (error) => {
    emit('upload-error', error);
  },
  onRemove: (file) => {
    emit('remove', file);
  },
  onPreview: (file) => {
    emit('preview', file);
  },
  onDownload: (file) => {
    emit('download', file);
  },
});
const currentUpload = computed(() =>
  isMultiple.value ? multipleFileUpload : singleFileUpload
);

// 状态使用计算属性（模板中需要响应式）
const loading = computed(() => currentUpload.value.loading.value);
const isEmpty = computed(() => currentUpload.value.isEmpty.value);
const isError = computed(() => currentUpload.value.isError.value);

const acceptAttr = computed(() => currentUpload.value.acceptAttr.value);

// 方法
const beforeUpload = (...args: Parameters<NonNullable<typeof singleFileUpload.beforeUpload>>) => {
  return currentUpload.value.beforeUpload?.(...args);
};

const handleUpload = (...args: Parameters<typeof singleFileUpload.handleUpload>) => {
  return currentUpload.value.handleUpload(...args);
};
// 多文件模式下，判断是否还可以继续上传
const canUploadMore = computed(() => {
  if (!isMultiple.value) return false;
  // 计算已上传的文件数量
  const uploadedCount = multipleFileUpload.fileList.value.length;
  // 计算正在上传的文件数量（只计算 uploading 和 pending 状态）
  const uploadingCount = Array.from(
    multipleFileUpload.uploadItems.value.values()
  ).filter(
    (item) => item.status === 'uploading' || item.status === 'pending'
  ).length;
  const currentCount = uploadedCount + uploadingCount;
  if (props.maxCount === undefined) return true; // 没有限制，可以继续上传
  return currentCount < props.maxCount;
});

// 统一的文件名获取
const getCurrentFileName = () => {
  if (isMultiple.value) return '';
  return singleFileUpload.displayFileName.value;
};

// 统一的图标类名获取
const getCurrentFileIconClass = () => {
  if (isMultiple.value) return '';
  return singleFileUpload.getFileIconClass.value;
};

// 统一的图标 SVG 获取
const getCurrentFileIconSvg = () => {
  if (isMultiple.value) return '';
  return singleFileUpload.getFileIconSvg.value;
};

// 将多文件 upload item 状态映射为 FileStatus 组件状态
const getMultiFileStatus = (
  file: AttachmentData
): 'loading' | 'error' | 'success' => {
  const itemStatus = multipleFileUpload.getUploadItem(file)?.status;
  if (itemStatus === 'uploading' || itemStatus === 'pending') return 'loading';
  if (itemStatus === 'error') return 'error';
  return 'success';
};

// 统一的操作方法
const handleFilePreview = (file?: AttachmentData) => {
  if (isMultiple.value && file) {
    multipleFileUpload.handlePreview(file);
  } else {
    singleFileUpload.handlePreview();
  }
};

const handleFileDownload = (file?: AttachmentData) => {
  if (isMultiple.value && file) {
    multipleFileUpload.handleDownload(file);
  } else {
    singleFileUpload.handleDownload();
  }
};

const handleFileRemove = (file?: AttachmentData) => {
  if (isMultiple.value && file) {
    multipleFileUpload.handleRemove(file);
  } else {
    singleFileUpload.handleRemove();
  }
};
</script>

<template>
  <div class="file-upload">
    <!-- 统一的 el-upload 组件（多文件已达上限时不再渲染上传区域） -->
    <el-upload
      v-if="!isMultiple || canUploadMore"
      class="file-uploader"
      :class="{
        'file-uploader--selected': selected && !isEmpty && !isError,
        'file-uploader--error': isError,
      }"
      :show-file-list="false"
      :multiple="isMultiple"
      :before-upload="beforeUpload"
      :http-request="handleUpload"
      :disabled="disabled || loading || (isMultiple && !canUploadMore)"
      :accept="acceptAttr"
    >
      <!-- 多文件模式：只显示占位符 -->
      <template v-if="isMultiple" #trigger>
        <div v-if="canUploadMore" class="upload-placeholder">
          <el-icon class="upload-icon" :size="16">
            <Upload />
          </el-icon>
          <div class="upload-text">{{ placeholder }}</div>
        </div>
      </template>

      <!-- 单文件模式：只传当前状态，由 FileStatus 内部判断展示 loading/error/success -->
      <template v-if="!isMultiple">
        <!-- 加载状态 -->
        <FileStatus
          v-if="singleFileStatus"
          :status="singleFileStatus"
          :disabled="disabled"
          :file="singleFileUpload.fileData.value || undefined"
          :file-name="getCurrentFileName()"
          :icon-class="getCurrentFileIconClass()"
          :icon-svg="getCurrentFileIconSvg()"
          :progress="singleFileUpload.uploadProgress.value"
          :progress-text="singleFileUpload.progressText.value"
          :show-preview="showPreview"
          :show-download="showDownload"
          :show-remove="showRemove"
          :on-preview="handleFilePreview"
          :on-download="handleFileDownload"
          :on-remove="handleFileRemove"
        />

        <!-- 无文件：显示上传占位符 -->
        <div v-else class="upload-placeholder">
          <el-icon class="upload-icon" :size="16">
            <Upload />
          </el-icon>
          <div class="upload-text">{{ placeholder }}</div>
        </div>
      </template>
    </el-upload>

    <!-- 多文件模式：文件列表 -->
    <div v-if="isMultiple && !isEmpty" class="file-list">
      <div
        v-for="(file, index) in multipleFileUpload.fileList.value"
        :key="index"
        class="file-item"
        :class="{
          'file-item--selected': selected && index === 0,
          'file-item--error':
            multipleFileUpload.getUploadItem(file)?.status === 'error',
        }"
      >
        <FileStatus
          :status="getMultiFileStatus(file)"
          :disabled="disabled"
          :file="file"
          :file-name="file.name"
          :icon-class="multipleFileUpload.getFileIconClass(file)"
          :icon-svg="multipleFileUpload.getFileIconSvg(file)"
          :progress="multipleFileUpload.getUploadItem(file)?.progress || 0"
          :progress-text="`${multipleFileUpload.getUploadItem(file)?.progress || 0}%`"
          :error-message="multipleFileUpload.getUploadItem(file)?.error"
          :show-preview="showPreview"
          :show-download="showDownload"
          :show-remove="showRemove"
          :on-preview="handleFilePreview"
          :on-download="handleFileDownload"
          :on-remove="handleFileRemove"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.file-upload {
  display: block;
  width: 100%;
  .file-uploader {
    width: calc(100% - 20px);
    border: 1px solid var(--el-border-color);
    padding: 0 10px;
    border-radius: 6px;
    transition: border-color var(--el-transition-duration-fast);

    &:hover:not(.file-uploader--error) {
      border-color: #1f58e9;
    }

    // 选中状态：蓝色边框
    &--selected {
      border: 2px solid #1f58e9;
      background-color: #fff;
    }

    // 错误状态：红色边框和虚线边框
    &--error {
      border: 1px solid #f56c6c;
      background-color: #fff;
      position: relative;

      // &::before {
      //   content: '';
      //   position: absolute;
      //   top: -2px;
      //   left: -2px;
      //   right: -2px;
      //   bottom: -2px;
      //   border: 1px dashed #f56c6c;
      //   border-radius: 6px;
      //   pointer-events: none;
      // }
    }

    :deep(.el-upload) {
      width: 100%;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: var(--el-transition-duration-fast);
    }
  }

  // 上传占位符
  .upload-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 6px;
    color: var(--el-text-color-secondary);

    .upload-icon {
      color: var(--el-text-color-placeholder);
    }

    .upload-text {
      font-size: 14px;
    }
  }

  // 文件信息（公共样式）
  .file-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  // 文件图标包装器（公共样式）
  .file-icon-wrapper {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    background-color: #fff;

    // 文件类型背景色
    &.file-icon--pdf {
      background-color: #dc3545;
    }
    &.file-icon--word {
      background-color: #2b579a;
    }
    &.file-icon--excel {
      background-color: #1d6f42;
    }
    &.file-icon--powerpoint {
      background-color: #d04423;
    }
    &.file-icon--image {
      background-color: #4caf50;
    }
    &.file-icon--video {
      background-color: #ff5722;
    }
    &.file-icon--audio {
      background-color: #9c27b0;
    }
    &.file-icon--archive {
      background-color: #ff9800;
    }
    &.file-icon--text {
      background-color: #607d8b;
    }
    &.file-icon--code {
      background-color: #2196f3;
    }
    &.file-icon--default {
      background-color: #f0f0f0;
    }

    // 错误状态
    &--error {
      background-color: #fff;
      border: 1px solid #f56c6c;
    }

    .file-icon {
      color: #fff;
    }

    &.file-icon--default .file-icon {
      color: var(--el-text-color-primary);
    }

    &--error .file-icon {
      color: #f56c6c;
    }
  }

  // 文件详情（公共样式）
  .file-details {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;

    .file-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-size {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .file-error-text {
      font-size: 12px;
      color: #f56c6c;
      font-weight: 500;
    }
  }

  // 文件操作按钮（公共样式）
  .file-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
    margin-left: 12px;

    .file-action-icon {
      font-size: 18px;
      color: var(--el-text-color-secondary);
      cursor: pointer;
      transition: color var(--el-transition-duration-fast);

      &:hover {
        color: var(--el-color-primary);
      }
    }
  }

  // 进度条（公共样式）
  .upload-progress-bar {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 3px;
    background-color: #e4e7ed;
    overflow: hidden;
  }

  .upload-progress-fill {
    height: 100%;
    background-color: #1f58e9;
    transition: width 0.3s ease;
  }

  // 加载状态
  .upload-loading {
    width: 100%;
    display: flex;
    flex-direction: column;
    position: relative;

    .file-name {
      height: 25px;
      line-height: 25px;
    }

    .file-size {
      height: 25px;
      line-height: 25px;
    }
  }

  // 文件容器
  .file-container {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #fff;
    min-height: 60px;
    position: relative;

    &--error {
      flex-direction: column;
      align-items: flex-start;

      .file-info {
        width: 100%;
      }

      .file-actions {
        position: absolute;
        right: 16px;
        top: 12px;
      }

      .file-error-message {
        width: 100%;
        font-size: 12px;
        color: #f56c6c;
        padding-left: 44px;
        height: 16px;
        line-height: 16px;
      }
    }
  }

  // 多文件列表
  .file-list {
    margin-top: 8px;
    width: calc(100% - 20px);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  // 多文件列表项
  .file-item {
    @extend .file-container;
    padding: 0 10px;
    border: 1px solid var(--el-border-color);
    transition: border-color var(--el-transition-duration-fast);
    border-radius: 6px;

    &:hover:not(.file-item--error) {
      border-color: #1f58e9;
    }

    &--selected {
      border: 2px solid #1f58e9;
    }

    &--error {
      border: 1px solid #f56c6c;
    }

    .upload-progress-bar {
      border-radius: 0 0 6px 6px;
    }

    .file-error-message {
      position: absolute;
      bottom: -20px;
      left: 44px;
      font-size: 12px;
      color: #f56c6c;
      white-space: nowrap;
    }
  }

  // 禁用状态
  :deep(.is-disabled) {
    cursor: not-allowed;

    .upload-placeholder,
    .file-container,
    .upload-loading,
    .file-list {
      opacity: 0.6;
      pointer-events: none;
    }
  }
}
</style>
