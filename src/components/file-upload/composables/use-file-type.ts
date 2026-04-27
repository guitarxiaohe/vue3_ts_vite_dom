/**
 * 文件类型判断 Composable
 *
 * 根据文件扩展名或 MIME 类型判断文件类型，返回对应的图标类名和样式
 */
import { computed, type Ref } from 'vue';
import wordIcon from '@/assets/svg/icons/word.svg';
import excelIcon from '@/assets/svg/icons/excel.svg';
import pptxIcon from '@/assets/svg/icons/pptx.svg';
import imagesIcon from '@/assets/svg/icons/images.svg';
import videoIcon from '@/assets/svg/icons/video.svg';
import audioIcon from '@/assets/svg/icons/audio.svg';
import zipIcon from '@/assets/svg/icons/zip.svg';
import textIcon from '@/assets/svg/icons/text.svg';
import codeIcon from '@/assets/svg/icons/code.svg';
import unknownIcon from '@/assets/svg/icons/unknown.svg';
import pdfIcon from '@/assets/svg/icons/pdf.svg';
/**
 * 文件类型枚举
 */
export enum FileType {
  PDF = 'pdf',
  WORD = 'word',
  EXCEL = 'excel',
  POWERPOINT = 'powerpoint',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  ARCHIVE = 'archive',
  TEXT = 'text',
  CODE = 'code',
  DEFAULT = 'default',
}

/**
 * 文件类型配置
 */
interface FileTypeConfig {
  extensions: string[];
  mimeTypes: string[];
  iconClass: string;
  color: string;
  icon: string; // SVG 图标路径
}

/**
 * 文件类型配置映射
 */
const FILE_TYPE_CONFIG: Record<FileType, FileTypeConfig> = {
  [FileType.PDF]: {
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf'],
    iconClass: 'file-icon--pdf',
    color: '#c25705',
    icon: pdfIcon, // ✅ 改成專用 pdf 圖標
  },
  [FileType.WORD]: {
    extensions: ['.doc', '.docx'],
    mimeTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    iconClass: 'file-icon--word',
    color: '#2b579a',
    icon: wordIcon,
  },
  [FileType.EXCEL]: {
    extensions: ['.xls', '.xlsx'],
    mimeTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    iconClass: 'file-icon--excel',
    color: '#1d6f42',
    icon: excelIcon,
  },
  [FileType.POWERPOINT]: {
    extensions: ['.ppt', '.pptx'],
    mimeTypes: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    iconClass: 'file-icon--powerpoint',
    color: '#d04423',
    icon: pptxIcon,
  },
  [FileType.IMAGE]: {
    extensions: [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.bmp',
      '.webp',
      '.svg',
      '.ico',
    ],
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ],
    iconClass: 'file-icon--image',
    color: '#4caf50',
    icon: imagesIcon,
  },
  [FileType.VIDEO]: {
    extensions: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'],
    mimeTypes: ['video/mp4', 'video/avi', 'video/quicktime'],
    iconClass: 'file-icon--video',
    color: '#ff5722',
    icon: videoIcon,
  },
  [FileType.AUDIO]: {
    extensions: ['.mp3', '.wav', '.flac', '.aac', '.ogg'],
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    iconClass: 'file-icon--audio',
    color: '#9c27b0',
    icon: audioIcon,
  },
  [FileType.ARCHIVE]: {
    extensions: ['.zip', '.rar', '.7z', '.tar', '.gz'],
    mimeTypes: [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
    ],
    iconClass: 'file-icon--archive',
    color: '#ff9800',
    icon: zipIcon,
  },
  [FileType.TEXT]: {
    extensions: ['.txt', '.md', '.log', '.csv'],
    mimeTypes: ['text/plain', 'text/markdown', 'text/csv'],
    iconClass: 'file-icon--text',
    color: '#607d8b',
    icon: textIcon,
  },
  [FileType.CODE]: {
    extensions: [
      '.js',
      '.ts',
      '.jsx',
      '.tsx',
      '.vue',
      '.html',
      '.css',
      '.scss',
      '.json',
      '.xml',
      '.yaml',
      '.yml',
    ],
    mimeTypes: ['text/javascript', 'application/json', 'text/html', 'text/css'],
    iconClass: 'file-icon--code',
    color: '#2196f3',
    icon: codeIcon,
  },
  [FileType.DEFAULT]: {
    extensions: [],
    mimeTypes: [],
    iconClass: 'file-icon--default',
    color: '#9e9e9e',
    icon: unknownIcon,
  },
};

/**
 * 根据文件名获取文件扩展名
 */
const getFileExtension = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) return '';
  return fileName.substring(lastDotIndex).toLowerCase();
};

/**
 * 根据文件扩展名判断文件类型
 */
const getFileTypeByExtension = (extension: string): FileType => {
  for (const [type, config] of Object.entries(FILE_TYPE_CONFIG)) {
    if (config.extensions.includes(extension)) {
      return type as FileType;
    }
  }
  return FileType.DEFAULT;
};

/**
 * 根据 MIME 类型判断文件类型
 */
const getFileTypeByMimeType = (mimeType: string): FileType => {
  const normalizedMimeType = mimeType.toLowerCase();
  for (const [type, config] of Object.entries(FILE_TYPE_CONFIG)) {
    if (config.mimeTypes.some((mt) => normalizedMimeType.includes(mt))) {
      return type as FileType;
    }
  }
  return FileType.DEFAULT;
};

/**
 * 文件类型判断 Composable
 *
 * @param fileName - 文件名（Ref 或字符串）
 * @param fileType - 文件 MIME 类型（可选，Ref 或字符串）
 */
export const useFileType = (
  fileName: Ref<string> | string,
  fileType?: Ref<string | undefined> | string | undefined
) => {
  /**
   * 获取文件类型
   */
  const fileTypeEnum = computed(() => {
    const name = typeof fileName === 'string' ? fileName : fileName.value;
    const type =
      fileType === undefined
        ? undefined
        : typeof fileType === 'string'
          ? fileType
          : fileType.value;

    // 优先使用 MIME 类型判断
    if (type) {
      const typeByMime = getFileTypeByMimeType(type);
      if (typeByMime !== FileType.DEFAULT) {
        return typeByMime;
      }
    }

    // 使用文件扩展名判断
    if (name) {
      const extension = getFileExtension(name);
      return getFileTypeByExtension(extension);
    }

    return FileType.DEFAULT;
  });

  /**
   * 获取文件图标类名
   */
  const iconClass = computed(() => {
    const type = fileTypeEnum.value;
    return FILE_TYPE_CONFIG[type].iconClass;
  });

  /**
   * 获取文件图标 SVG 路径
   */
  const iconSvg = computed(() => {
    const type = fileTypeEnum.value;
    return FILE_TYPE_CONFIG[type].icon;
  });

  /**
   * 获取文件图标颜色
   */
  const iconColor = computed(() => {
    const type = fileTypeEnum.value;
    return FILE_TYPE_CONFIG[type].color;
  });

  /**
   * 获取文件类型配置
   */
  const typeConfig = computed(() => {
    const type = fileTypeEnum.value;
    return FILE_TYPE_CONFIG[type];
  });

  return {
    fileType: fileTypeEnum,
    iconClass,
    iconSvg,
    iconColor,
    typeConfig,
  };
};
