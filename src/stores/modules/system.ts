import { defineStore } from 'pinia';
import { computed, watch } from 'vue';
import { useStorage } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import { i18n } from '@/i18n';
import {
  APP_DEFAULT_LOCALE,
  APP_LOCALE_STORAGE_KEY,
  APP_SUPPORTED_LOCALES,
  type AppLocale,
} from '@/constants/locale';
import { getUserSettings, saveUserSettings } from '@/api/modules/user-settings';

export type ThemeMode = 'light' | 'dark' | 'auto';

export type InterfaceMode = 'simple' | 'conventional';

export type NavigationMode = 'side' | 'top';

export type PageTransition = 'fade' | 'slide' | 'zoom' | 'none';

export type AnimationSpeed = 'slow' | 'normal' | 'fast';

const THEME_STORAGE_KEY = 'app_theme';
const INTERFACE_MODE_STORAGE_KEY = 'app_interface_mode';
const THEME_COLOR_STORAGE_KEY = 'app_theme_color';
const NAVIGATION_MODE_STORAGE_KEY = 'app_navigation_mode';
const FIXED_HEADER_STORAGE_KEY = 'app_fixed_header';
const PAGE_TRANSITION_STORAGE_KEY = 'app_page_transition';
const ANIMATION_SPEED_STORAGE_KEY = 'app_animation_speed';
const DEFAULT_THEME_COLOR = '#5E6AD2';

/** localStorage key → 数据库 setting_key 映射 */
const SETTINGS_KEY_MAP: Record<string, string> = {
  [INTERFACE_MODE_STORAGE_KEY]: 'interfaceMode',
  [APP_LOCALE_STORAGE_KEY]: 'locale',
  [THEME_STORAGE_KEY]: 'theme',
  [THEME_COLOR_STORAGE_KEY]: 'themeColor',
  [NAVIGATION_MODE_STORAGE_KEY]: 'navigationMode',
  [FIXED_HEADER_STORAGE_KEY]: 'fixedHeader',
  [PAGE_TRANSITION_STORAGE_KEY]: 'pageTransition',
  [ANIMATION_SPEED_STORAGE_KEY]: 'animationSpeed',
  app_show_breadcrumb: 'showBreadcrumb',
  app_show_notice_bar: 'showNoticeBar',
};

/** 防抖定时器 */
let syncTimer: ReturnType<typeof setTimeout> | null = null;

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

  const themeColor = useStorage(
    THEME_COLOR_STORAGE_KEY,
    DEFAULT_THEME_COLOR,
    localStorage
  );

  const changeThemeColor = (color: string) => {
    themeColor.value = color;
  };

  const applyThemeColor = (color: string) => {
    const rgb = hexToRgb(color);
    const html = document.documentElement;

    html.style.setProperty('--color-primary', color);
    html.style.setProperty(
      '--color-primary-light',
      mixColor(color, '#ffffff', 0.2)
    );
    html.style.setProperty(
      '--color-primary-dark',
      mixColor(color, '#000000', 0.16)
    );
    html.style.setProperty(
      '--color-primary-bg',
      `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`
    );
    html.style.setProperty('--el-color-primary', color);
    html.style.setProperty(
      '--el-color-primary-light-3',
      mixColor(color, '#ffffff', 0.3)
    );
    html.style.setProperty(
      '--el-color-primary-light-5',
      mixColor(color, '#ffffff', 0.5)
    );
    html.style.setProperty(
      '--el-color-primary-light-7',
      mixColor(color, '#ffffff', 0.7)
    );
    html.style.setProperty(
      '--el-color-primary-light-8',
      mixColor(color, '#ffffff', 0.8)
    );
    html.style.setProperty(
      '--el-color-primary-light-9',
      mixColor(color, '#ffffff', 0.9)
    );
    html.style.setProperty(
      '--el-color-primary-dark-2',
      mixColor(color, '#000000', 0.16)
    );
  };

  watch(
    themeColor,
    (color) => {
      applyThemeColor(color);
    },
    { immediate: true }
  );

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

  // ═══════════════════════════════════════════════════════════════════════════
  // 滚动播报设置
  // ═══════════════════════════════════════════════════════════════════════════
  const showNoticeBar = useStorage('app_show_notice_bar', true, localStorage);

  // ═══════════════════════════════════════════════════════════════════════════
  // 导航与动画设置
  // ═══════════════════════════════════════════════════════════════════════════
  const navigationMode = useStorage<NavigationMode>(
    NAVIGATION_MODE_STORAGE_KEY,
    'side',
    localStorage
  );
  const fixedHeader = useStorage(FIXED_HEADER_STORAGE_KEY, true, localStorage);
  const pageTransition = useStorage<PageTransition>(
    PAGE_TRANSITION_STORAGE_KEY,
    'fade',
    localStorage
  );
  const animationSpeed = useStorage<AnimationSpeed>(
    ANIMATION_SPEED_STORAGE_KEY,
    'normal',
    localStorage
  );

  const changeNavigationMode = (mode: NavigationMode) => {
    navigationMode.value = mode;
    interfaceMode.value = 'conventional';
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 数据库同步
  // ═══════════════════════════════════════════════════════════════════════════

  /** 从服务器加载时跳过 watcher，避免循环同步 */
  let isLoadingFromServer = false;

  /** 统一监听所有设置变更，自动防抖同步到数据库 */
  watch(
    [
      interfaceMode,
      storedLocale,
      storedThemeMode,
      themeColor,
      navigationMode,
      fixedHeader,
      showBreadcrumb,
      showNoticeBar,
      pageTransition,
      animationSpeed,
    ],
    () => {
      if (!isLoadingFromServer) {
        syncToServer();
      }
    }
  );

  /** 收集当前所有设置为 key-value Map（setting_key → value） */
  const collectSettings = (): Record<string, string> => {
    return {
      interfaceMode: interfaceMode.value,
      locale: storedLocale.value,
      theme: storedThemeMode.value,
      themeColor: themeColor.value,
      navigationMode: navigationMode.value,
      fixedHeader: String(fixedHeader.value),
      showBreadcrumb: String(showBreadcrumb.value),
      showNoticeBar: String(showNoticeBar.value),
      pageTransition: pageTransition.value,
      animationSpeed: animationSpeed.value,
    };
  };

  /** 防抖写入数据库 */
  const syncToServer = () => {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      const settings = collectSettings();
      saveUserSettings(settings).catch(() => {
        // 静默失败，不影响用户体验
      });
    }, 500);
  };

  const saveSettingsNow = async () => {
    if (syncTimer) {
      clearTimeout(syncTimer);
      syncTimer = null;
    }
    await saveUserSettings(collectSettings());
  };

  /** 从数据库加载设置并覆盖本地 */
  const loadFromServer = async () => {
    isLoadingFromServer = true;
    try {
      const res = (await getUserSettings()) as any;
      if (res.code === 200 && res.data) {
        const serverSettings = res.data as Record<string, string>;
        // 用数据库值覆盖 localStorage
        if (serverSettings.interfaceMode !== undefined) {
          interfaceMode.value = serverSettings.interfaceMode as InterfaceMode;
        }
        if (
          serverSettings.locale !== undefined &&
          isSupportedLocale(serverSettings.locale)
        ) {
          storedLocale.value = serverSettings.locale as AppLocale;
        }
        if (serverSettings.theme !== undefined) {
          storedThemeMode.value = serverSettings.theme as ThemeMode;
        }
        if (serverSettings.themeColor !== undefined) {
          themeColor.value = serverSettings.themeColor;
        }
        if (serverSettings.navigationMode !== undefined) {
          navigationMode.value =
            serverSettings.navigationMode as NavigationMode;
        }
        if (serverSettings.fixedHeader !== undefined) {
          fixedHeader.value = serverSettings.fixedHeader === 'true';
        }
        if (serverSettings.showBreadcrumb !== undefined) {
          showBreadcrumb.value = serverSettings.showBreadcrumb === 'true';
        }
        if (serverSettings.showNoticeBar !== undefined) {
          showNoticeBar.value = serverSettings.showNoticeBar === 'true';
        }
        if (serverSettings.pageTransition !== undefined) {
          pageTransition.value =
            serverSettings.pageTransition as PageTransition;
        }
        if (serverSettings.animationSpeed !== undefined) {
          animationSpeed.value =
            serverSettings.animationSpeed as AnimationSpeed;
        }
      }
    } catch {
      // 静默失败，使用 localStorage 缓存值
    } finally {
      isLoadingFromServer = false;
    }
  };

  /** 登出时清除用户相关 localStorage */
  const clearUserSettings = () => {
    for (const lsKey of Object.keys(SETTINGS_KEY_MAP)) {
      localStorage.removeItem(lsKey);
    }
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
    themeColor,
    themeOptions,
    changeTheme,
    changeThemeColor,
    toggleDark,
    setThemeBySystem,

    // 面包屑
    showBreadcrumb,
    toggleBreadcrumb,

    // 滚动播报
    showNoticeBar,

    // 导航与动画
    navigationMode,
    fixedHeader,
    pageTransition,
    animationSpeed,
    changeNavigationMode,

    // 简洁模式自动设置
    applySimpleModeSettings,

    // 数据库同步
    loadFromServer,
    saveSettingsNow,
    clearUserSettings,
  };
});

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const bigint = Number.parseInt(normalized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function mixColor(color: string, mix: string, weight: number) {
  const source = hexToRgb(color);
  const target = hexToRgb(mix);
  const r = Math.round(source.r * (1 - weight) + target.r * weight);
  const g = Math.round(source.g * (1 - weight) + target.g * weight);
  const b = Math.round(source.b * (1 - weight) + target.b * weight);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function toHex(value: number) {
  return value.toString(16).padStart(2, '0');
}

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
