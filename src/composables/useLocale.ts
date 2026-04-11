import { useStorage } from '@vueuse/core';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { i18n } from '@/i18n';
import {
  APP_DEFAULT_LOCALE,
  APP_LOCALE_STORAGE_KEY,
  APP_SUPPORTED_LOCALES,
  type AppLocale,
} from '@/constants/locale';

const storedLocale = useStorage<AppLocale>(
  APP_LOCALE_STORAGE_KEY,
  APP_DEFAULT_LOCALE,
  localStorage
);

export function useLocale() {
  const { locale, t } = useI18n();

  const currentLocale = computed({
    get: () => storedLocale.value,
    set: (val: AppLocale) => {
      storedLocale.value = val;
      locale.value = val;
      document.documentElement.setAttribute('lang', val);
      updateCookie(val);
    },
  });

  const localeOptions = computed(() => [
    { label: t('locale.zhCN'), value: 'zh-CN' as AppLocale },
    { label: t('locale.enUS'), value: 'en-US' as AppLocale },
    { label: t('locale.zhTW'), value: 'zh-TW' as AppLocale },
  ]);

  const isSupported = (locale: string): locale is AppLocale => {
    return APP_SUPPORTED_LOCALES.includes(locale as AppLocale);
  };

  const changeLocale = (locale: string) => {
    if (isSupported(locale)) {
      currentLocale.value = locale;
    }
  };

  return {
    currentLocale,
    localeOptions,
    changeLocale,
    isSupported,
  };
}

export function initLocale() {
  const locale = storedLocale.value;
  (i18n.global.locale as any).value = locale;
  document.documentElement.setAttribute('lang', locale);
}

function updateCookie(locale: AppLocale) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `app_locale=${encodeURIComponent(locale)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export { storedLocale };
