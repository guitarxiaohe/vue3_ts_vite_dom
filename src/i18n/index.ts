import { createI18n } from 'vue-i18n';
import {
  getStoredLocale,
  normalizeLocale,
  setLocaleCookie,
} from '@/utils/locale';
import zhCN from '@/locales/zh-CN';
import enUS from '@/locales/en-US';
import zhTW from '@/locales/zh-TW';

/**
 * 全局 i18n 实例
 */
export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: getStoredLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
    'zh-TW': zhTW,
  },
});

/**
 * 同步全局语言（用于非组件上下文）
 */
export const setI18nLocale = (locale: string) => {
  const normalized = normalizeLocale(locale);
  i18n.global.locale.value = normalized;
  setLocaleCookie(normalized);
};
