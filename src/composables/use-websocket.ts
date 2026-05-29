import { h, ref } from 'vue';
import { ElNotification } from 'element-plus';
import { useNotificationStore, usePresenceStore } from '@/stores';
import type { WsMessage } from '@/types/ws';
import SocketMsg from '@/components/socket-msg/index.vue';

/******************************** WebSocket URL 构建 ********************************/

interface BuildNotifyWebSocketUrlOptions {
  token: string;
  wsBaseUrl?: string;
  httpBaseUrl?: string;
  apiBaseUrl?: string;
  pageUrl?: string;
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function buildNotifyWebSocketUrl(options: BuildNotifyWebSocketUrlOptions) {
  const pageUrl = options.pageUrl || window.location.href;
  const page = new URL(pageUrl);
  const directOrigin = resolveDirectWebSocketOrigin(options.wsBaseUrl, page);

  if (directOrigin) {
    return `${directOrigin}/ws/notify?token=${encodeURIComponent(options.token)}`;
  }

  const baseApi = options.apiBaseUrl || '/dev-api';
  const protocol = page.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${page.host}${baseApi}/ws/notify?token=${encodeURIComponent(options.token)}`;
}

function resolveDirectWebSocketOrigin(
  rawBaseUrl: string | undefined,
  page: URL
) {
  const normalized = String(rawBaseUrl || '')
    .trim()
    .replace(/\/$/, '');
  if (!/^(https?|wss?):\/\//i.test(normalized)) {
    return '';
  }

  const directUrl = new URL(
    normalized.replace(/^http:\/\//i, 'ws://').replace(/^https:\/\//i, 'wss://')
  );
  const hostname = shouldReplaceLocalHostname(directUrl.hostname, page.hostname)
    ? page.hostname
    : directUrl.hostname;
  return `${directUrl.protocol}//${hostname}${directUrl.port ? `:${directUrl.port}` : ''}`;
}

function shouldReplaceLocalHostname(
  targetHostname: string,
  pageHostname: string
) {
  return LOCAL_HOSTS.has(targetHostname) && !LOCAL_HOSTS.has(pageHostname);
}

/******************************** WebSocket 消息分流 ********************************/

interface ApplyIncomingWsPayloadOptions {
  payload: string;
  setOnlineUserIds: (userIds: number[]) => void;
  pushNotification: (message: WsMessage) => void;
}

type ApplyIncomingWsPayloadResult =
  | { kind: 'presence'; message: WsMessage }
  | { kind: 'notification'; message: WsMessage }
  | { kind: 'invalid' };

function applyIncomingWsPayload(
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

export function useWebSocket() {
  const ws = ref<WebSocket | null>(null);
  const isConnected = ref(false);
  const reconnectAttempts = ref(0);
  const MAX_RECONNECT = 10;
  const BASE_DELAY = 1000;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  const HEARTBEAT_TIMEOUT = 45000; // 45s 未收到 ping 判定断线

  const notificationStore = useNotificationStore();
  const presenceStore = usePresenceStore();

  function connect() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const url = buildNotifyWebSocketUrl({
      token,
      wsBaseUrl: String(import.meta.env.VITE_WS_URL || ''),
      httpBaseUrl: String(import.meta.env.VITE_BASE_URL || ''),
      apiBaseUrl: String(import.meta.env.VITE_APP_BASE_API || '/dev-api'),
      pageUrl: location.href,
    });
    try {
      ws.value = new WebSocket(url);
    } catch (err) {
      console.log('err ==>', err);
      scheduleReconnect();
      return;
    }

    ws.value.onopen = () => {
      isConnected.value = true;
      reconnectAttempts.value = 0;
      startHeartbeatCheck();
    };

    ws.value.onmessage = (e: MessageEvent) => {
      if (e.data === 'ping') {
        ws.value?.send('pong');
        resetHeartbeatCheck();
        return;
      }
      const result = applyIncomingWsPayload({
        payload: String(e.data),
        setOnlineUserIds: (userIds) => presenceStore.setOnlineUserIds(userIds),
        pushNotification: (message) => notificationStore.push(message),
      });
      if (result.kind !== 'notification') {
        return;
      }
      const msg: WsMessage = result.message;

      ElNotification({
        title: msg.title || '新消息',
        message: h(SocketMsg, { msgInfo: msg }),
        type: msgTypeToElType(msg.type),
        duration: 5000,
      });
    };

    ws.value.onclose = () => {
      isConnected.value = false;
      presenceStore.setOnlineUserIds([]);
      stopHeartbeatCheck();
      scheduleReconnect();
    };

    ws.value.onerror = () => {
      ws.value?.close();
    };
  }

  function scheduleReconnect() {
    if (reconnectAttempts.value >= MAX_RECONNECT) return;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    const delay = Math.min(BASE_DELAY * 2 ** reconnectAttempts.value, 30000);
    reconnectAttempts.value++;
    reconnectTimer = setTimeout(connect, delay);
  }

  let heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;

  function startHeartbeatCheck() {
    resetHeartbeatCheck();
  }

  function resetHeartbeatCheck() {
    if (heartbeatTimeout) clearTimeout(heartbeatTimeout);
    heartbeatTimeout = setTimeout(() => {
      // 超时未收到 ping，判定断线
      ws.value?.close();
    }, HEARTBEAT_TIMEOUT);
  }

  function stopHeartbeatCheck() {
    if (heartbeatTimeout) clearTimeout(heartbeatTimeout);
  }

  function disconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    stopHeartbeatCheck();
    reconnectAttempts.value = MAX_RECONNECT; // 阻止自动重连
    presenceStore.setOnlineUserIds([]);
    ws.value?.close();
    ws.value = null;
    isConnected.value = false;
  }

  function msgTypeToElType(
    type?: string
  ): 'success' | 'warning' | 'info' | 'error' {
    switch (type) {
      case 'notice':
        return 'info';
      case 'alert':
        return 'warning';
      case 'system':
        return 'success';
      default:
        return 'info';
    }
  }

  return { isConnected, connect, disconnect };
}
