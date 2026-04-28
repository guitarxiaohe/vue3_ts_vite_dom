<script setup lang="ts">
import { computed } from 'vue';
import { useFileType } from '@/components/file-upload/composables/use-file-type';
import type { AttachmentData } from '@/components/file-upload/file-upload.type';
import PictureCell from './picture-cell.vue';
import { useImageUrl } from '@/composables/use-image-url';

/**
 * 附件 / 文件类型单元格组件
 *
 * 功能：
 * - 显示文件类型图标（视觉风格对齐 file-upload）
 * - 支持点击图标直接下载文件
 * - 支持多个文件，只展示前 N 个，超出显示「+X」
 *
 * 接收数据结构（与后端一致）：
 * {
 *   "fileOriginName": "temp_xxx.pdf",
 *   "fileSuffix": "application/pdf",
 *   "fileUrl": "temp_xxx.pdf", // key 或完整地址
 *   "size": null
 * }
 */

interface Props {
  /**
   * 附件数据
   * - 支持单个对象或数组
   */
  attachments?: AttachmentData | AttachmentData[] | null;
  /** 最多展示的文件图标数量 */
  maxPreviewCount?: number;
}

interface FileItem {
  fileUrl: string;
  fileOriginName: string;
  iconClass: string;
  iconSvg: string;
}

const props = withDefaults(defineProps<Props>(), {
  attachments: null,
  maxPreviewCount: 3,
});

const { ensureImageBaseUrl, resolveImageUrl } = useImageUrl();
void ensureImageBaseUrl();

/**
 * 将附件 URL/key 解析为可访问地址
 */
const buildFullUrl = (fileUrl: string | undefined): string =>
  resolveImageUrl(fileUrl || '');

/**
 * 从 URL 中提取文件名（用于判断文件类型与下载文件名）
 */
const getFileNameFromUrl = (fileUrl: string): string => {
  try {
    const cleanUrl = fileUrl.split('?')[0].split('#')[0];
    const segments = cleanUrl.split('/');
    const last = segments[segments.length - 1] || '';
    return decodeURIComponent(last || 'file');
  } catch {
    return 'file';
  }
};

/**
 * 判断附件是否为图片类型
 * - 优先根据 MIME type 判断
 * - 其次根据副档名判断
 */
const isImageAttachment = (attachment: AttachmentData): boolean => {
  const mime = (attachment.fileSuffix || '').toLowerCase();
  if (mime.startsWith('image/')) return true;

  const raw = (
    attachment.fileUrl ||
    attachment.fileOriginName ||
    ''
  ).toLowerCase();
  return (
    raw.endsWith('.jpg') ||
    raw.endsWith('.jpeg') ||
    raw.endsWith('.png') ||
    raw.endsWith('.gif') ||
    raw.endsWith('.bmp') ||
    raw.endsWith('.webp') ||
    raw.endsWith('.svg') ||
    raw.endsWith('.ico')
  );
};

const attachmentList = computed<AttachmentData[]>(() =>
  props.attachments
    ? Array.isArray(props.attachments)
      ? props.attachments
      : [props.attachments]
    : []
);
/**
 * 图片附件 URL 列表（给 PictureCell 用）
 */
const imageUrls = computed(() =>
  attachmentList.value
    .filter((item) => item && isImageAttachment(item))
    .map((item) => buildFullUrl(item.fileUrl || item.fileOriginName || ''))
    .filter((fileUrl) => !!fileUrl)
);

/**
 * 非图片附件，转为带图标信息的文件对象
 */
const allFiles = computed<FileItem[]>(() =>
  attachmentList.value
    .filter(
      (item) =>
        item &&
        !isImageAttachment(item) &&
        (item.fileUrl || item.fileOriginName)
    )
    .map((item) => {
      const rawUrl = item.fileUrl || item.fileOriginName || '';
      const fileUrl = buildFullUrl(rawUrl);
      const fileOriginName = item.fileOriginName || getFileNameFromUrl(rawUrl);
      // 复用 file-upload 中的文件类型判断逻辑（带上 MIME type 更精准）
      const fileType = useFileType(fileOriginName, item.fileSuffix);
      return {
        fileUrl,
        fileOriginName,
        iconClass: fileType.iconClass.value,
        iconSvg: fileType.iconSvg.value,
      };
    })
);

// 控制列表密度，只展示前 N 个图标
const displayFiles = computed(() =>
  allFiles.value.slice(0, props.maxPreviewCount)
);
const extraCount = computed(() =>
  Math.max(0, allFiles.value.length - displayFiles.value.length)
);

/**
 * !!!!点击下载文件 目前弃用下载改为预览
 *
 * 保持与 file-upload 组件一致的下载行为：
 * - 使用 a 标签触发浏览器下载
 * - download 属性使用文件名
 */
const handleDownload = (file: FileItem) => {
  if (!file.fileUrl) return;

  window.open(file.fileUrl, '_blank');
  // const link = document.createElement('a');
  // link.href = file.fileUrl;
  // link.download = file.fileOriginName || 'file';
  // link.click();
};
</script>

<template>
  <div class="file-cell">
    <template v-if="imageUrls.length > 0 || displayFiles.length > 0">
      <div class="file-cell__list">
        <!-- 图片附件：使用 PictureCell 显示缩略图 -->
        <PictureCell
          v-if="imageUrls.length > 0"
          :urls="imageUrls"
          :max-preview-count="maxPreviewCount"
        />

        <!-- 非图片附件：显示文件图标 + 点击下载 -->
        <div
          v-for="file in displayFiles"
          :key="file.fileUrl"
          class="file-cell__item"
          @click.stop="handleDownload(file)"
        >
          <div class="file-icon-wrapper" :class="file.iconClass">
            <img
              v-if="file.iconSvg"
              :src="file.iconSvg"
              alt=""
              class="file-icon"
            />
          </div>
        </div>

        <span v-if="extraCount > 0" class="file-cell__extra">
          +{{ extraCount }}
        </span>
      </div>
    </template>
    <span v-else>-</span>
  </div>
</template>

<style scoped lang="scss">
.file-cell {
  display: flex;
  align-items: center;
  height: 100%;
}

.file-cell__list {
  display: flex;
  align-items: center;
  gap: 4px;
}

.file-cell__item {
  width: 28px;
  height: 28px;
  cursor: pointer;
}

.file-cell__extra {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  background-color: #f2f3f5;
  color: #606266;
  font-size: 12px;
}

/* 复用 file-upload 的图标样式，仅保留必要部分以保证一致视觉 */
.file-icon-wrapper {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background-color: #f0f0f0;

  &.file-icon--pdf {
    background-color: #c25705;
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
}

.file-icon {
  width: 18px;
  height: 18px;
}
</style>
