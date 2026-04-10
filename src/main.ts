import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { VueQueryPlugin } from '@tanstack/vue-query';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import './styles/base.scss';
import router from './router';
import App from './App.vue';
import { i18n } from './i18n';

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
        retry: 1, // 失败重试次数
        refetchOnWindowFocus: false, // 窗口聚焦时不自动刷新
        staleTime: 5 * 60 * 1000, // 数据默认 5 分钟内为新鲜数据
        cacheTime: 10 * 60 * 1000, // 缓存保留 10 分钟
        retryDelay: 1000, // 重试延迟
      },
      mutations: {
        retry: 0, // mutations 不重试
      },
    },
  },
});

// Element Plus
app.use(ElementPlus);

app.mount('#app');
