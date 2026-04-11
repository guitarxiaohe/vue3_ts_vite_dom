import { useStorage } from '@vueuse/core';
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const THEME_STORAGE_KEY = 'app_theme';

export type ThemeMode = 'light' | 'dark' | 'auto';

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

watch(
  isDark,
  (dark) => {
    applyTheme(dark);
  },
  { immediate: true }
);

export function useTheme() {
  const { t } = useI18n();

  const themeOptions = computed(() => [
    { label: t('theme.light'), value: 'light' as ThemeMode, icon: 'sun' },
    { label: t('theme.dark'), value: 'dark' as ThemeMode, icon: 'moon' },
    { label: t('theme.auto'), value: 'auto' as ThemeMode, icon: 'monitor' },
  ]);

  const currentTheme = computed({
    get: () => storedThemeMode.value,
    set: (val: ThemeMode) => {
      storedThemeMode.value = val;
    },
  });

  const isDarkMode = computed(() => isDark.value);

  const changeTheme = (mode: ThemeMode) => {
    currentTheme.value = mode;
  };

  const toggleDark = () => {
    currentTheme.value = isDark.value ? 'light' : 'dark';
  };

  return {
    isDark,
    isDarkMode,
    toggleDark,
    currentTheme,
    themeOptions,
    changeTheme,
  };
}

export function initTheme() {
  applyTheme(isDark.value);

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    if (storedThemeMode.value === 'auto') {
      applyTheme(e.matches);
    }
  });
}

export { storedThemeMode };
