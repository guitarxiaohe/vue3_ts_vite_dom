/**
 * RTC Token 响应
 */
export interface MeetingRtcTokenResponse {
  /** LiveKit 服务器地址 */
  serverUrl: string;
  /** 房间名称 */
  roomName: string;
  /** 参与者 Token */
  participantToken: string;
  /** 参与者身份标识 */
  participantIdentity: string;
  /** 用户 ID */
  userId: string;
  /** 显示名称 */
  displayName: string;
  /** 是否主持人 */
  host: boolean;
}

/**
 * RTC 状态枚举
 */
export enum RtcStatus {
  /** 初始状态 */
  INIT = 'INIT',
  /** 运行中 */
  RUNNING = 'RUNNING',
  /** 已停止 */
  STOPPED = 'STOPPED',
  /** 失败 */
  FAILED = 'FAILED',
}

/**
 * 音频片段上传请求
 */
export interface AudioChunkUploadRequest {
  /** 音频文件 */
  file: File;
  /** 参与者身份标识 */
  participantIdentity: string;
  /** 发言人用户 ID */
  speakerUserId?: string;
  /** 发言人显示名称 */
  speakerDisplayName: string;
  /** RTC 轨道 ID */
  rtcTrackId?: string;
  /** 音频开始时间（毫秒） */
  audioStartedAtMs: number;
  /** 音频结束时间（毫秒） */
  audioEndedAtMs: number;
  /** 序列号 */
  sequenceNo: number;
}
