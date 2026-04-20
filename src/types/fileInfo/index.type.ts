/** 与后端 SysFileInfo 对齐（若依） */
export interface SysFileInfo {
  fileId?: number;
  fileOriginName?: string;
  fileSuffix?: string;
  fileSizeInfo?: string;
  fileObjectName?: string;
  filePath?: string;
  /** Y-已删除，N-未删除 */
  delFlag?: string;
  createBy?: string;
}
