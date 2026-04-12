import { useSystemStore } from '@/stores';

export function useTheme() {
  const systemStore = useSystemStore();

  return {
    isDark: systemStore.isDark,
    isDarkMode: systemStore.isDark,
    toggleDark: systemStore.toggleDark,
    currentTheme: systemStore.currentTheme,
    themeOptions: systemStore.themeOptions,
    changeTheme: systemStore.changeTheme,
    setThemeBySystem: systemStore.setThemeBySystem,
  };
}

export function initTheme() {
  const systemStore = useSystemStore();
  const html = document.documentElement;
  if (systemStore.isDark) {
    html.classList.add('dark');
    html.setAttribute('data-theme', 'dark');
  } else {
    html.classList.remove('dark');
    html.setAttribute('data-theme', 'light');
  }
}
