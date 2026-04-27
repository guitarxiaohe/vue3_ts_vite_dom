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
  return await httpClient.postUpload<UploadFileResponse>('/common/upload', formData);
};

export const toAttachmentData = (
  file: File,
  response: UploadFileResponse
): AttachmentData => {
  return {
    name: response.fileOriginName || file.name,
    type: file.type || response.fileSuffix,
    url: response.url || response.fileName,
    size: file.size,
  };
};
