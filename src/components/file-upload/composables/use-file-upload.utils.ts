import type { AttachmentData } from '../file-upload.type';

/******************************** 单文件上传状态工具 ********************************/

interface ResolvePendingFileDataOptions {
  incomingValue: string | AttachmentData | undefined;
  pendingFileData: AttachmentData | null;
  isUploading: boolean;
}

function normalizeAttachmentUrl(file?: AttachmentData | null): string {
  return String(file?.url ?? file?.fileUrl ?? '').trim();
}

// 根据外部 v-model 的变化决定是否保留本次上传生成的附件元信息
export function resolvePendingFileData(
  options: ResolvePendingFileDataOptions
): AttachmentData | null {
  const { incomingValue, pendingFileData, isUploading } = options;

  if (!incomingValue) {
    return isUploading ? pendingFileData : null;
  }

  if (typeof incomingValue !== 'string') {
    return null;
  }

  if (!pendingFileData) {
    return null;
  }

  return incomingValue.trim() === normalizeAttachmentUrl(pendingFileData)
    ? pendingFileData
    : null;
}
