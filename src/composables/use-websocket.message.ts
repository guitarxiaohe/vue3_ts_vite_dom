import type { WsMessage } from '@/types/ws';

/******************************** WebSocket 消息分流 ********************************/

export interface ApplyIncomingWsPayloadOptions {
  payload: string;
  setOnlineUserIds: (userIds: number[]) => void;
  pushNotification: (message: WsMessage) => void;
}

export type ApplyIncomingWsPayloadResult =
  | { kind: 'presence'; message: WsMessage }
  | { kind: 'notification'; message: WsMessage }
  | { kind: 'invalid' };

export function applyIncomingWsPayload(
  options: ApplyIncomingWsPayloadOptions
): ApplyIncomingWsPayloadResult {
  let message: WsMessage;
  try {
    message = JSON.parse(options.payload) as WsMessage;
  } catch {
    return { kind: 'invalid' };
  }

  if (message.type === 'presence_snapshot') {
    const normalizedUserIds = Array.isArray(message.userIds)
      ? message.userIds
          .map((userId) => Number(userId))
          .filter((userId) => !Number.isNaN(userId))
      : [];
    options.setOnlineUserIds(normalizedUserIds);
    return { kind: 'presence', message };
  }

  options.pushNotification(message);
  return { kind: 'notification', message };
}
