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

export const uploadFile = async (file: File): Promise<UploadFileResponse> => {
  const formData = new FormData();
  formData.append('file', file, file.name);
  return await httpClient.postUpload<UploadFileResponse>(
    '/common/upload',
    formData
  );
};

export const toAttachmentData = (
  file: File,
  response: UploadFileResponse
): AttachmentData => {
  return {
    fileOriginName: response.fileOriginName || file.name,
    name: response.fileOriginName || file.name,
    fileSuffix: file.type || response.fileSuffix,
    type: file.type || response.fileSuffix,
    fileUrl: response.url || response.fileName,
    url: response.url || response.fileName,
    fileSizeInfo: file.size,
    size: file.size,
  };
};
