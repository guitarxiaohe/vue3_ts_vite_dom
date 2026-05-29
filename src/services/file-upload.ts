import { httpClient } from '@/api/client';
import type { AttachmentData } from '@/components/file-upload/file-upload.type';

export interface UploadFileResponse {
  msg: string;
  code: number;
  fileName: string;
  fileOriginName: string;
  fileSize: string;
  fileSuffix: string;
  url: string;
  fileId: string;
}

export const uploadFile = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadFileResponse> => {
  const formData = new FormData();
  formData.append('file', file, file.name);
  return await httpClient.postUpload<UploadFileResponse>(
    '/common/upload',
    formData,
    onProgress
  );
};

/**
 * 上传单个分片
 */
export const uploadChunk = async (
  fileId: string,
  chunkIndex: number,
  totalChunks: number,
  chunk: Blob,
  fileName: string,
  onProgress?: (percent: number) => void
): Promise<{ chunkIndex: number }> => {
  const formData = new FormData();
  formData.append('file', chunk, fileName);
  formData.append('fileId', fileId);
  formData.append('chunkIndex', String(chunkIndex));
  formData.append('totalChunks', String(totalChunks));
  formData.append('fileName', fileName);
  return await httpClient.postUpload<{ chunkIndex: number }>(
    '/common/upload/chunk',
    formData,
    onProgress
  );
};

/**
 * 通知后端合并所有分片
 */
export const mergeChunks = async (
  fileId: string,
  totalChunks: number,
  fileName: string,
  fileSize: number
): Promise<UploadFileResponse> => {
  const formData = new FormData();
  formData.append('fileId', fileId);
  formData.append('totalChunks', String(totalChunks));
  formData.append('fileName', fileName);
  formData.append('fileSize', String(fileSize));
  return await httpClient.postUpload<UploadFileResponse>(
    '/common/upload/merge',
    formData
  );
};

/**
 * 从文件名提取扩展名（带点，如 ".mp4"）
 */
const getExtension = (name: string): string => {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.substring(dot).toLowerCase() : '';
};

/**
 * 扩展名 → MIME 类型映射（useFileType 优先匹配 MIME）
 */
const EXT_TO_MIME: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.avi': 'video/avi',
  '.mov': 'video/quicktime',
  '.wmv': 'video/x-ms-wmv',
  '.flv': 'video/x-flv',
  '.mkv': 'video/x-matroska',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
  '.aac': 'audio/aac',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx':
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx':
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.7z': 'application/x-7z-compressed',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.md': 'text/markdown',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.xml': 'application/xml',
};

export const toAttachmentData = (
  file: File,
  response: UploadFileResponse
): AttachmentData => {
  const suffix =
    response.fileSuffix || getExtension(file.name).replace('.', '');
  const ext = suffix ? `.${suffix}` : getExtension(file.name);

  // type: 用真实 MIME 类型（useFileType 优先匹配 MIME），从 file.type 或扩展名推导
  const type =
    (file.type && file.type !== 'application/octet-stream'
      ? file.type
      : EXT_TO_MIME[ext]) || ext;

  return {
    fileOriginName: response.fileOriginName || file.name,
    name: response.fileOriginName || file.name,
    fileSuffix: suffix,
    type,
    fileUrl: response.url || response.fileName,
    url: response.url || response.fileName,
    fileSizeInfo: file.size,
    size: file.size,
  };
};
