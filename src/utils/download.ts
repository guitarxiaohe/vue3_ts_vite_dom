import { i18n } from '@/i18n';
import { handleBusinessError } from '@/services/request';

/**
 * 下载配置
 */
export interface DownloadRequestOptions {
  /** 下载 URL */
  url: string;
  /** 指定文件名 */
  fileName: string;
}

/**
 * 下载文件结果
 */
export interface DownloadResult {
  /** 文件二进制数据 */
  blob: Blob;
  /** 文件名 */
  fileName: string;
}

/**
 * 获取文件二进制，不触发浏览器保存
 *
 * @param options - 下载配置
 * @returns Promise<DownloadResult> - 文件二进制数据和文件名
 *
 * @example
 * await fetchDownloadFile({ url: '/api/file/download', params: { id: '123' } });
 */
async function fetchDownloadFile(
  options: DownloadRequestOptions
): Promise<DownloadResult> {
  const { url, fileName } = options;

  // 发送请求
  const response = await fetch(url);

  // 如果没有发生重定向，说明后端校验失败或直接返回了 JSON 错误信息
  // 此时需要解析 JSON 并抛出业务错误
  if (!response.ok || !response.redirected) {
    const data = await response.json();
    return handleBusinessError(data, url);
  }

  // 获取 blob 数据
  const blob = await response.blob();

  // 使用指定的文件名，或从响应头解析文件名
  const finalFileName = fileName || i18n.global.t('download.defaultFileName');

  return {
    blob,
    fileName: finalFileName,
  };
}

/**
 * 下载文件并触发浏览器保存
 *
 * @param options - 下载配置
 * @returns Promise<void>
 */
export async function downloadFile(
  options: DownloadRequestOptions
): Promise<void> {
  const { blob, fileName } = await fetchDownloadFile(options);
  saveBlob(blob, fileName);
}
/**
 * 保存 Blob 文件到本地
 *
 * @param blob - 文件 Blob 对象
 * @param fileName - 文件名
 */
export function saveBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
