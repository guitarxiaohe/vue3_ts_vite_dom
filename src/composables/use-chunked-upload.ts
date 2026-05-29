import { ref } from 'vue';
import {
  uploadChunk,
  mergeChunks,
  toAttachmentData,
  type UploadFileResponse,
} from '@/services/file-upload';
import type { AttachmentData } from '@/components/file-upload/file-upload.type';

const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_CONCURRENT = 5;
const MAX_RETRIES = 3;

interface ChunkMeta {
  index: number;
  start: number;
  end: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  retryCount: number;
}

/**
 * 增量计算文件 SHA-256 hash（每 1MB 读一次，避免大文件 OOM）
 */
export async function computeFileHash(file: File): Promise<string> {
  const reader = file.stream().getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLength += value.length;
  }

  const buffer = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 分片上传 composable
 *
 * - 大于 20MB 自动分片（2MB/片）
 * - 最多 5 片并发，队列取片
 * - 单片重试 3 次
 * - 暴露 queue 供 UI 显示分片状态
 */
export function useChunkedUpload() {
  const queue = ref<Map<number, ChunkMeta>>(new Map());
  let aborted = false;

  /**
   * 启动分片上传
   * @returns 最终的 AttachmentData（与整文件上传返回格式一致）
   */
  async function startUpload(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<AttachmentData> {
    aborted = false;
    queue.value = new Map();

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const fileName = file.name;

    // 计算文件 hash 作为 uploadId
    const fileId = await computeFileHash(file);

    // 初始化所有分片
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      queue.value.set(i, {
        index: i,
        start,
        end,
        status: 'pending',
        progress: 0,
        retryCount: 0,
      });
    }

    // 并发上传
    await uploadWithPool(file, fileId, totalChunks, fileName, onProgress);

    // 所有分片上传完成，通知后端合并
    const response = await mergeChunks(
      fileId,
      totalChunks,
      fileName,
      file.size
    );
    return toAttachmentData(file, response as unknown as UploadFileResponse);
  }

  /**
   * 并发上传池：启动 MAX_CONCURRENT 个 worker，每个循环从队列取片上传
   */
  function uploadWithPool(
    file: File,
    fileId: string,
    totalChunks: number,
    fileName: string,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    let completedChunks = 0;
    let rejected = false;
    let rejectFn!: (reason?: unknown) => void;

    return new Promise<void>((resolve, reject) => {
      rejectFn = reject;

      // 从 pending 队列取一片并上传
      async function processNext(): Promise<boolean> {
        if (aborted || rejected) return false;

        let nextChunk: ChunkMeta | undefined;
        for (const chunk of queue.value.values()) {
          if (chunk.status === 'pending') {
            nextChunk = chunk;
            break;
          }
        }
        if (!nextChunk) return false;

        const chunkMeta = nextChunk;
        chunkMeta.status = 'uploading';
        queue.value = new Map(queue.value); // 触发响应式

        const chunkBlob = file.slice(chunkMeta.start, chunkMeta.end);

        try {
          await uploadChunk(
            fileId,
            chunkMeta.index,
            totalChunks,
            chunkBlob,
            fileName,
            (chunkPercent) => {
              chunkMeta.progress = chunkPercent;
              // 聚合进度：已完成的片 100% + 当前片进度
              const totalProgress =
                (completedChunks * 100 + chunkPercent) / totalChunks;
              onProgress?.(Math.round(totalProgress));
            }
          );

          chunkMeta.status = 'success';
          chunkMeta.progress = 100;
          completedChunks++;
          queue.value = new Map(queue.value);
          return true;
        } catch (error) {
          chunkMeta.retryCount++;
          if (chunkMeta.retryCount < MAX_RETRIES) {
            chunkMeta.status = 'pending';
            chunkMeta.progress = 0;
            queue.value = new Map(queue.value);
            return true; // 重试
          }

          // 超过重试次数，标记失败
          chunkMeta.status = 'error';
          queue.value = new Map(queue.value);

          if (!rejected) {
            rejected = true;
            rejectFn(
              new Error(
                `分片 ${chunkMeta.index} 上传失败: ${(error as Error).message}`
              )
            );
          }
          return false;
        }
      }

      // 启动 worker
      let activeWorkers = 0;
      let allDone = false;

      function startWorker() {
        activeWorkers++;
        (async () => {
          while (!aborted && !rejected) {
            const hasMore = await processNext();
            if (!hasMore) break;
          }
          activeWorkers--;
          if (activeWorkers === 0 && !rejected && !allDone) {
            allDone = true;
            resolve();
          }
        })();
      }

      const workerCount = Math.min(MAX_CONCURRENT, totalChunks);
      for (let i = 0; i < workerCount; i++) {
        startWorker();
      }
    });
  }

  function abort() {
    aborted = true;
  }

  return {
    queue,
    startUpload,
    abort,
  };
}
