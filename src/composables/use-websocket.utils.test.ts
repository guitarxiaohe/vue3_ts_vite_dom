import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNotifyWebSocketUrl } from './use-websocket.utils.ts';

/******************************** WebSocket URL 工具测试 ********************************/

test('buildNotifyWebSocketUrl should prefer current origin proxy when VITE_WS_URL is empty', () => {
  const result = buildNotifyWebSocketUrl({
    token: 'plain-token',
    wsBaseUrl: '',
    httpBaseUrl: 'http://localhost:8002',
    apiBaseUrl: '/dev-api',
    pageUrl: 'http://192.168.0.84:5173/dashboard',
  });

  assert.equal(
    result,
    'ws://192.168.0.84:5173/dev-api/ws/notify?token=plain-token'
  );
});

test('buildNotifyWebSocketUrl should use direct ws origin when VITE_WS_URL is provided', () => {
  const result = buildNotifyWebSocketUrl({
    token: 'plain-token',
    wsBaseUrl: 'http://localhost:8002',
    httpBaseUrl: 'http://localhost:8002',
    apiBaseUrl: '/dev-api',
    pageUrl: 'http://192.168.0.84:5173/dashboard',
  });

  assert.equal(result, 'ws://192.168.0.84:8002/ws/notify?token=plain-token');
});
