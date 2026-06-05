export const useImageUrl = () => {
  const profilePrefix = '/profile/';
  const imageBaseUrl = String(import.meta.env.VITE_BASE_URL || '').replace(
    /\/$/,
    ''
  );
  const apiBaseUrl = String(
    import.meta.env.VITE_APP_BASE_API || '/dev-api'
  ).replace(/\/$/, '');
  const knownProxyPrefixes = [imageBaseUrl, apiBaseUrl, '/prod-api', '/dev-api']
    .map((item) => item.replace(/\/$/, ''))
    .filter(Boolean);

  function withBase(path: string) {
    if (!path) return '';
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    // 上传资源统一走当前域名，避免 HTTPS 页面加载后端 HTTP 资源触发 mixed content
    if (
      normalizedPath === profilePrefix.slice(0, -1) ||
      normalizedPath.startsWith(profilePrefix)
    ) {
      return normalizedPath;
    }
    if (
      knownProxyPrefixes.some(
        (prefix) =>
          normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
      )
    ) {
      return normalizedPath;
    }
    return `${imageBaseUrl || apiBaseUrl}${normalizedPath}`;
  }

  function resolveImageUrl(path?: unknown) {
    const raw = String(path ?? '').trim();
    if (!raw) return '';

    if (/^data:|^blob:/i.test(raw)) {
      return raw;
    }

    if (/^https?:\/\//i.test(raw)) {
      try {
        const url = new URL(raw);
        if (
          url.pathname === profilePrefix.slice(0, -1) ||
          url.pathname.startsWith(profilePrefix)
        ) {
          return `${url.pathname}${url.search}${url.hash}`;
        }
        if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
          return withBase(`${url.pathname}${url.search}${url.hash}`);
        }
      } catch {
        return raw;
      }

      return raw;
    }

    return withBase(raw);
  }

  return {
    ensureImageBaseUrl: (_args?: unknown) => imageBaseUrl || apiBaseUrl,
    resolveImageUrl,
  };
};
