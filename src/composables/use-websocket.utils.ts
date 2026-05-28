export interface BuildNotifyWebSocketUrlOptions {
  token: string;
  wsBaseUrl?: string;
  httpBaseUrl?: string;
  apiBaseUrl?: string;
  pageUrl?: string;
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function buildNotifyWebSocketUrl(
  options: BuildNotifyWebSocketUrlOptions
) {
  const pageUrl = options.pageUrl || window.location.href;
  const page = new URL(pageUrl);
  const directOrigin = resolveDirectWebSocketOrigin(options.wsBaseUrl, page);

  if (directOrigin) {
    return `${directOrigin}/ws/notify?token=${encodeURIComponent(
      options.token
    )}`;
  }

  const baseApi = options.apiBaseUrl || '/dev-api';
  const protocol = page.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${page.host}${baseApi}/ws/notify?token=${encodeURIComponent(
    options.token
  )}`;
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
