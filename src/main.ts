import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { VueQueryPlugin } from '@tanstack/vue-query';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import './styles/variables.scss';
import './styles/base.scss';
import router from './router';
import App from './App.vue';
import { i18n } from './i18n';
import { initLocale } from './composables/useLocale';
import { initTheme } from './composables/useTheme';

const app = createApp(App);

// Pinia
app.use(createPinia());

// Vue Router
app.use(router);
app.use(i18n);

// TanStack Query
app.use(VueQueryPlugin, {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retryDelay: 1000,
      },
      mutations: {
        retry: 0,
      },
    },
  },
});

// Element Plus
app.use(ElementPlus);

app.mount('#app');

// 初始化语言和主题
initLocale();
initTheme();
