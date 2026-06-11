/** WebSocket 消息模型 */
export interface WsMessage {
  type?: string;
  title?: string;
  text?: string;
  path?: string;
  params?: Record<string, string>;
  data?: unknown;
  userIds?: number[];
}

/** 消息日志（后端返回） */
export interface WsMsgLog {
  msgId: number;
  msgType: string;
  title: string;
  content: string;
  path: string;
  queryParams: string;
  targetUserId: number | null;
  sendStatus: string;
  sendTime: string | number | null;
  createBy: string;
  createTime: string | number;
}
