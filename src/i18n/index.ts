import { createI18n } from 'vue-i18n';
import { APP_DEFAULT_LOCALE } from '@/constants/locale';
import zhCN from '@/locales/zh-CN';
import enUS from '@/locales/en-US';
import zhTW from '@/locales/zh-TW';

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: APP_DEFAULT_LOCALE,
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
    'zh-TW': zhTW,
  },
});
