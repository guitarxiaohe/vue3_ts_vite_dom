import test from 'node:test';
import assert from 'node:assert/strict';
import { applyIncomingWsPayload } from './use-websocket.message.ts';
import type { WsMessage } from '@/types/ws';

/******************************** WebSocket 消息分流测试 ********************************/

test('applyIncomingWsPayload should route presence snapshot to online store', () => {
  const onlineSnapshots: number[][] = [];
  const notificationMessages: WsMessage[] = [];

  const result = applyIncomingWsPayload({
    payload: JSON.stringify({
      type: 'presence_snapshot',
      userIds: [7, 9, 12],
    }),
    setOnlineUserIds: (userIds) => onlineSnapshots.push(userIds),
    pushNotification: (message) => notificationMessages.push(message),
  });

  assert.deepEqual(onlineSnapshots, [[7, 9, 12]]);
  assert.deepEqual(notificationMessages, []);
  assert.equal(result.kind, 'presence');
});

test('applyIncomingWsPayload should keep notification messages on notification store', () => {
  const onlineSnapshots: number[][] = [];
  const notificationMessages: WsMessage[] = [];

  const result = applyIncomingWsPayload({
    payload: JSON.stringify({
      type: 'notice',
      title: '系统通知',
      text: 'hello',
    }),
    setOnlineUserIds: (userIds) => onlineSnapshots.push(userIds),
    pushNotification: (message) => notificationMessages.push(message),
  });

  assert.deepEqual(onlineSnapshots, []);
  assert.deepEqual(notificationMessages, [
    {
      type: 'notice',
      title: '系统通知',
      text: 'hello',
    },
  ]);
  assert.equal(result.kind, 'notification');
});
