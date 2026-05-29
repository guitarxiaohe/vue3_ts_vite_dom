import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePendingFileData } from './use-file-upload.utils.ts';
import type { AttachmentData } from '../file-upload.type';

/******************************** 单文件上传状态测试 ********************************/

test('resolvePendingFileData should keep uploaded metadata when parent stores the same url string', () => {
  const pendingFileData: AttachmentData = {
    name: '合同.pdf',
    fileOriginName: '合同.pdf',
    fileSuffix: 'pdf',
    type: 'application/pdf',
    url: '/profile/upload/contract.pdf',
    fileUrl: '/profile/upload/contract.pdf',
    size: 1024,
    fileSizeInfo: 1024,
  };

  const result = resolvePendingFileData({
    incomingValue: '/profile/upload/contract.pdf',
    pendingFileData,
    isUploading: false,
  });

  assert.deepEqual(result, pendingFileData);
});

test('resolvePendingFileData should clear pending metadata when parent provides a new object value', () => {
  const pendingFileData: AttachmentData = {
    name: '旧文件.pdf',
    url: '/profile/upload/old.pdf',
  };

  const result = resolvePendingFileData({
    incomingValue: {
      name: '新文件.pdf',
      url: '/profile/upload/new.pdf',
    },
    pendingFileData,
    isUploading: false,
  });

  assert.equal(result, null);
});
