import { useSystemStore } from '@/stores';

export function useLocale() {
  const systemStore = useSystemStore();

  return {
    currentLocale: systemStore.currentLocale,
    localeOptions: systemStore.localeOptions,
    changeLocale: systemStore.changeLocale,
    isSupported: systemStore.isSupportedLocale,
    getBrowserLocale: systemStore.getBrowserLocale,
    setLocaleByBrowser: systemStore.setLocaleByBrowser,
  };
}

export function initLocale() {
  const systemStore = useSystemStore();
  return systemStore.currentLocale;
}
