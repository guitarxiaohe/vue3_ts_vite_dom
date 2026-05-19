import { h, ref } from 'vue';
import { ElNotification } from 'element-plus';
import { useNotificationStore } from '@/stores';
import type { WsMessage } from '@/types/ws';
import SocketMsg from '@/components/socket-msg/index.vue';
const wsBaseUrl = String(import.meta.env.VITE_WS_URL || '').replace(/\/$/, '');

export function useWebSocket() {
  const ws = ref<WebSocket | null>(null);
  const isConnected = ref(false);
  const reconnectAttempts = ref(0);
  const MAX_RECONNECT = 10;
  const BASE_DELAY = 1000;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  const HEARTBEAT_TIMEOUT = 45000; // 45s 未收到 ping 判定断线

  const notificationStore = useNotificationStore();

  function connect() {
    const token = localStorage.getItem('token');
    if (!token) return;

    // 拼接 WS URL，通过 Vite 代理或直连
    let url: string;
    if (wsBaseUrl) {
      const normalizedBaseUrl = wsBaseUrl
        .replace(/^http:\/\//, 'ws://')
        .replace(/^https:\/\//, 'wss://');
      url = `${normalizedBaseUrl}/ws/notify?token=${encodeURIComponent(token)}`;
    } else {
      // 走 Vite 代理：同域 + 代理前缀
      const baseApi = import.meta.env.VITE_APP_BASE_API || '/dev-api';
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      url = `${protocol}//${location.host}${baseApi}/ws/notify?token=${encodeURIComponent(token)}`;
    }

    try {
      ws.value = new WebSocket(url);
    } catch {
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
      try {
        const msg: WsMessage = JSON.parse(e.data);
        notificationStore.push(msg);

        ElNotification({
          title: msg.title || '新消息',
          message: h(SocketMsg, { msgInfo: msg }),
          type: msgTypeToElType(msg.type),
          duration: 5000,
        });
      } catch {
        // 忽略非 JSON 消息
      }
    };

    ws.value.onclose = () => {
      isConnected.value = false;
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
