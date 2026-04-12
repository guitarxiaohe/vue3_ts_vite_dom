import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useStorage } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import { i18n } from '@/i18n';
import {
  APP_DEFAULT_LOCALE,
  APP_LOCALE_STORAGE_KEY,
  APP_SUPPORTED_LOCALES,
  type AppLocale,
} from '@/constants/locale';

export type ThemeMode = 'light' | 'dark' | 'auto';

export type InterfaceMode = 'simple' | 'conventional';

const THEME_STORAGE_KEY = 'app_theme';
const INTERFACE_MODE_STORAGE_KEY = 'app_interface_mode';

export const useSystemStore = defineStore('system', () => {
  const { locale, t } = useI18n();

  // ═══════════════════════════════════════════════════════════════════════════
  // 界面模式
  // ═══════════════════════════════════════════════════════════════════════════
  const interfaceMode = useStorage<InterfaceMode>(
    INTERFACE_MODE_STORAGE_KEY,
    'simple',
    localStorage
  );

  const isSimpleMode = computed(() => interfaceMode.value === 'simple');
  const isConventionalMode = computed(
    () => interfaceMode.value === 'conventional'
  );

  const changeInterfaceMode = (mode: InterfaceMode) => {
    interfaceMode.value = mode;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 国际化设置
  // ═══════════════════════════════════════════════════════════════════════════
  const storedLocale = useStorage<AppLocale>(
    APP_LOCALE_STORAGE_KEY,
    APP_DEFAULT_LOCALE,
    localStorage
  );

  const currentLocale = computed({
    get: () => storedLocale.value,
    set: (val: AppLocale) => {
      storedLocale.value = val;
      locale.value = val;
      document.documentElement.setAttribute('lang', val);
      updateLocaleCookie(val);
    },
  });

  const localeOptions = computed(() => [
    { label: t('locale.zhCN'), value: 'zh-CN' as AppLocale },
    { label: t('locale.enUS'), value: 'en-US' as AppLocale },
    { label: t('locale.zhTW'), value: 'zh-TW' as AppLocale },
  ]);

  const isSupportedLocale = (loc: string): loc is AppLocale => {
    return APP_SUPPORTED_LOCALES.includes(loc as AppLocale);
  };

  const changeLocale = (loc: string) => {
    if (isSupportedLocale(loc)) {
      currentLocale.value = loc;
    }
  };

  const getBrowserLocale = (): AppLocale => {
    const browserLang = navigator.language || navigator.languages?.[0] || '';
    const lang = browserLang.toLowerCase();
    if (lang.startsWith('zh')) {
      if (lang.includes('tw') || lang.includes('hk') || lang.includes('hant')) {
        return 'zh-TW';
      }
      return 'zh-CN';
    }
    if (lang.startsWith('en')) {
      return 'en-US';
    }
    return APP_DEFAULT_LOCALE;
  };

  const setLocaleByBrowser = () => {
    const browserLocale = getBrowserLocale();
    currentLocale.value = browserLocale;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 主题设置
  // ═══════════════════════════════════════════════════════════════════════════
  const storedThemeMode = useStorage<ThemeMode>(
    THEME_STORAGE_KEY,
    'auto',
    localStorage
  );

  const isDark = computed(() => {
    if (storedThemeMode.value === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return storedThemeMode.value === 'dark';
  });

  const currentTheme = computed({
    get: () => storedThemeMode.value,
    set: (val: ThemeMode) => {
      storedThemeMode.value = val;
    },
  });

  const themeOptions = computed(() => [
    { label: t('theme.light'), value: 'light' as ThemeMode, icon: 'sun' },
    { label: t('theme.dark'), value: 'dark' as ThemeMode, icon: 'moon' },
    { label: t('theme.auto'), value: 'auto' as ThemeMode, icon: 'monitor' },
  ]);

  const changeTheme = (mode: ThemeMode) => {
    currentTheme.value = mode;
  };

  const toggleDark = () => {
    currentTheme.value = isDark.value ? 'light' : 'dark';
  };

  const applyTheme = (dark: boolean) => {
    const html = document.documentElement;
    if (dark) {
      html.classList.add('dark');
      html.setAttribute('data-theme', 'dark');
    } else {
      html.classList.remove('dark');
      html.setAttribute('data-theme', 'light');
    }
  };

  const setThemeBySystem = () => {
    currentTheme.value = 'auto';
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 简洁模式自动设置
  // ═══════════════════════════════════════════════════════════════════════════
  const applySimpleModeSettings = () => {
    setThemeBySystem();
    setLocaleByBrowser();
  };

  watch(interfaceMode, (mode) => {
    if (mode === 'simple') {
      applySimpleModeSettings();
    }
  });

  watch(
    isDark,
    (dark) => {
      applyTheme(dark);
    },
    { immediate: true }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 面包屑设置
  // ═══════════════════════════════════════════════════════════════════════════
  const showBreadcrumb = useStorage('app_show_breadcrumb', true, localStorage);

  const toggleBreadcrumb = () => {
    showBreadcrumb.value = !showBreadcrumb.value;
  };

  return {
    // 界面模式
    interfaceMode,
    isSimpleMode,
    isConventionalMode,
    changeInterfaceMode,

    // 国际化
    currentLocale,
    localeOptions,
    changeLocale,
    isSupportedLocale,
    getBrowserLocale,
    setLocaleByBrowser,

    // 主题
    isDark,
    currentTheme,
    themeOptions,
    changeTheme,
    toggleDark,
    setThemeBySystem,

    // 面包屑
    showBreadcrumb,
    toggleBreadcrumb,

    // 简洁模式自动设置
    applySimpleModeSettings,
  };
});

function updateLocaleCookie(locale: AppLocale) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `app_locale=${encodeURIComponent(locale)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function initSystem() {
  const systemStore = useSystemStore();

  (i18n.global.locale as any).value = systemStore.currentLocale;
  document.documentElement.setAttribute('lang', systemStore.currentLocale);

  const html = document.documentElement;
  if (systemStore.isDark) {
    html.classList.add('dark');
    html.setAttribute('data-theme', 'dark');
  } else {
    html.classList.remove('dark');
    html.setAttribute('data-theme', 'light');
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    if (systemStore.currentTheme === 'auto') {
      const html = document.documentElement;
      if (e.matches) {
        html.classList.add('dark');
        html.setAttribute('data-theme', 'dark');
      } else {
        html.classList.remove('dark');
        html.setAttribute('data-theme', 'light');
      }
    }
  });
}
