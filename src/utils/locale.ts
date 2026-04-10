import {
  APP_DEFAULT_LOCALE,
  APP_LOCALE_COOKIE_KEY,
  APP_LOCALE_STORAGE_KEY,
  APP_SUPPORTED_LOCALES,
  type AppLocale,
} from '@/constants/locale';

/**
 * 规范化语言标识（仅保留系统支持的语言）
 */
export const normalizeLocale = (input?: string | null): AppLocale => {
  if (!input || typeof input !== 'string') {
    return APP_DEFAULT_LOCALE;
  }

  const normalized = input.replace('_', '-').trim();
  const matched = APP_SUPPORTED_LOCALES.find(
    (locale) => locale.toLowerCase() === normalized.toLowerCase()
  );
  return matched ?? APP_DEFAULT_LOCALE;
};

/**
 * 从本地存储读取语言设置
 */
export const getStoredLocale = (): AppLocale => {
  if (typeof window === 'undefined') {
    return APP_DEFAULT_LOCALE;
  }

  try {
    const stored = localStorage.getItem(APP_LOCALE_STORAGE_KEY);
    const normalized = normalizeLocale(stored);
    setLocaleCookie(normalized);
    return normalized;
  } catch (error) {
    void error;
    setLocaleCookie(APP_DEFAULT_LOCALE);
    return APP_DEFAULT_LOCALE;
  }
};

/**
 * 同步语言 Cookie，保证后端可读取当前语言
 */
export const setLocaleCookie = (locale: AppLocale) => {
  if (typeof window === 'undefined') return;

  try {
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${APP_LOCALE_COOKIE_KEY}=${encodeURIComponent(
      locale
    )}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch (error) {
    void error;
  }
};

/**
 * 持久化语言设置
 */
export const setStoredLocale = (locale: string) => {
  if (typeof window === 'undefined') return;

  try {
    const normalized = normalizeLocale(locale);
    localStorage.setItem(APP_LOCALE_STORAGE_KEY, normalized);
    setLocaleCookie(normalized);
  } catch (error) {
    void error;
  }
};
