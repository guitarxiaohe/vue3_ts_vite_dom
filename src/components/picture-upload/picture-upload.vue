<script setup lang="ts">
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { CircleClose, Download, Plus, ZoomIn } from '@element-plus/icons-vue';
import type { UploadRequestOptions } from 'element-plus';
import { useFileUpload } from '@/components/file-upload/composables/use-file-upload';
import type { AttachmentData } from '@/components/file-upload/file-upload.type';
import { useImageUrl } from '@/composables/use-image-url';

/******************************** 类型定义 ********************************/

interface PictureUploadProps {
  modelValue?: string | AttachmentData;
  disabled?: boolean;
  maxSize?: number;
  accept?: string[];
  width?: number;
  height?: number;
  showPreview?: boolean;
  showDownload?: boolean;
  showRemove?: boolean;
  selected?: boolean;
  errorMessage?: string;
}

interface PictureUploadEmits {
  (e: 'update:modelValue', value: string | AttachmentData | undefined): void;
  (e: 'upload-success', file: AttachmentData): void;
  (e: 'upload-error', error: Error): void;
  (e: 'remove', file: AttachmentData): void;
  (e: 'preview', file: AttachmentData): void;
  (e: 'download', file: AttachmentData): void;
}

/******************************** 组件入参 ********************************/

const props = withDefaults(defineProps<PictureUploadProps>(), {
  modelValue: '',
  disabled: false,
  maxSize: 5,
  accept: () => ['image/*'],
  width: 96,
  height: 96,
  showPreview: true,
  showDownload: true,
  showRemove: true,
  selected: false,
  errorMessage: '',
});

const emit = defineEmits<PictureUploadEmits>();

const { t } = useI18n();
const { resolveImageUrl } = useImageUrl();
const { maxSize, accept, errorMessage } = toRefs(props);

/******************************** 上传状态 ********************************/

const previewVisible = ref<boolean>(false);

const upload = useFileUpload({
  modelValue: computed(() => props.modelValue || undefined),
  maxSize,
  accept,
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

const containerStyle = computed(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
}));

const imageUrl = computed(() =>
  resolveImageUrl(
    upload.fileUrl.value ||
      upload.fileData.value?.fileUrl ||
      upload.fileData.value?.url ||
      ''
  )
);
const isEmpty = computed(() => !imageUrl.value && !upload.loading.value);

const acceptAttr = computed(() => upload.acceptAttr.value);

const uploaderClass = computed(() => ({
  'picture-upload__uploader--selected':
    props.selected && !isEmpty.value && !upload.isError.value,
  'picture-upload__uploader--error': upload.isError.value,
  'is-disabled': props.disabled,
}));

/******************************** 事件方法 ********************************/

// 上传图片
function handleUpload(options: UploadRequestOptions) {
  return upload.handleUpload(options);
}

// 预览图片
function handlePreview() {
  if (!imageUrl.value || !props.showPreview) return;
  previewVisible.value = true;
  if (upload.fileData.value) {
    emit('preview', upload.fileData.value);
  }
}

// 下载图片
function handleDownload() {
  if (!props.showDownload) return;
  if (!imageUrl.value || !upload.fileData.value) {
    ElMessage.error(t('fileUpload.fileDownloadError'));
    return;
  }
  upload.handleDownload();
}

// 删除图片
function handleRemove() {
  if (!props.showRemove || props.disabled) return;
  upload.handleRemove();
}
</script>

<template>
  <div class="picture-upload">
    <el-upload
      class="picture-upload__uploader"
      :class="uploaderClass"
      :show-file-list="false"
      :before-upload="upload.beforeUpload"
      :http-request="handleUpload"
      :disabled="props.disabled || upload.loading.value"
      :accept="acceptAttr"
    >
      <!-------------------------- 上传中 -------------------------->
      <div
        v-if="upload.loading.value"
        class="picture-upload__loading"
        :style="containerStyle"
      >
        <el-progress
          type="circle"
          :width="Math.min(props.width, props.height, 72)"
          :percentage="upload.uploadProgress.value"
        />
      </div>

      <!-------------------------- 图片内容 -------------------------->
      <div
        v-else-if="!isEmpty"
        class="picture-upload__image-wrap"
        :style="containerStyle"
      >
        <img
          class="picture-upload__image"
          :src="imageUrl"
          :alt="upload.displayFileName.value || t('fileUpload.placeholder')"
        />

        <button
          v-if="props.showRemove && !props.disabled"
          type="button"
          class="picture-upload__remove"
          :aria-label="t('fileUpload.remove')"
          @click.stop.prevent="handleRemove"
        >
          <el-icon :size="14">
            <CircleClose />
          </el-icon>
        </button>

        <div class="picture-upload__actions">
          <button
            v-if="props.showPreview"
            type="button"
            class="picture-upload__action"
            :aria-label="t('fileUpload.preview')"
            @click.stop.prevent="handlePreview"
          >
            <el-icon :size="20">
              <ZoomIn />
            </el-icon>
          </button>
          <button
            v-if="props.showDownload"
            type="button"
            class="picture-upload__action"
            :aria-label="t('fileUpload.download')"
            @click.stop.prevent="handleDownload"
          >
            <el-icon :size="20">
              <Download />
            </el-icon>
          </button>
        </div>
      </div>

      <!-------------------------- 空状态 -------------------------->
      <div v-else class="picture-upload__placeholder" :style="containerStyle">
        <el-icon class="picture-upload__placeholder-icon" :size="28">
          <Plus />
        </el-icon>
      </div>
    </el-upload>

    <!-------------------------- 图片预览 -------------------------->
    <el-image-viewer
      v-if="previewVisible"
      :url-list="[imageUrl]"
      :initial-index="0"
      @close="previewVisible = false"
    />
  </div>
</template>

<style scoped lang="scss">
.picture-upload {
  display: inline-block;
}

.picture-upload__uploader {
  display: inline-block;

  :deep(.el-upload) {
    display: block;
    border-radius: var(--radius-md);
    overflow: hidden;
    cursor: pointer;
  }

  &.is-disabled :deep(.el-upload) {
    cursor: not-allowed;
  }
}

.picture-upload__uploader--selected :deep(.el-upload) {
  box-shadow: 0 0 0 2px var(--color-primary-bg);
}

.picture-upload__uploader--error :deep(.el-upload) {
  box-shadow: 0 0 0 1px var(--color-danger);
}

.picture-upload__placeholder,
.picture-upload__loading,
.picture-upload__image-wrap {
  border-radius: var(--radius-md);
}

.picture-upload__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--color-border);
  background: var(--color-bg-card);
  transition:
    border-color var(--transition-fast),
    color var(--transition-fast);

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}

.picture-upload__placeholder-icon {
  color: var(--color-text-secondary);
}

.picture-upload__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  background: var(--color-bg-hover);
}

.picture-upload__image-wrap {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
}

.picture-upload__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.picture-upload__remove,
.picture-upload__action {
  border: 0;
  padding: 0;
  color: var(--color-bg-card);
  cursor: pointer;
}

.picture-upload__remove {
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  background: rgba(17, 24, 39, 0.72);

  &:hover {
    background: var(--color-danger);
  }
}

.picture-upload__actions {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  background: rgba(17, 24, 39, 0.55);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.picture-upload__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: transparent;
  transition:
    background-color var(--transition-fast),
    transform var(--transition-fast);

  &:hover {
    background: rgba(255, 255, 255, 0.16);
    transform: scale(1.08);
  }
}

.picture-upload__image-wrap:hover .picture-upload__actions {
  opacity: 1;
}

.picture-upload__uploader.is-disabled {
  .picture-upload__placeholder,
  .picture-upload__image-wrap {
    opacity: 0.6;
    pointer-events: none;
  }
}
</style>
