import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { VueQueryPlugin } from '@tanstack/vue-query';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import './styles/tailwind.css';
import './styles/variables.scss';
import './styles/base.scss';
import router from './router';
import App from './App.vue';
import { i18n } from './i18n';
import { initSystem } from './stores';
import { queryClient } from '@/api/query-client';

const app = createApp(App);

// Pinia
app.use(createPinia());

// Vue Router
app.use(router);
app.use(i18n);

// TanStack Query
app.use(VueQueryPlugin, { queryClient });

// Element Plus
app.use(ElementPlus);

app.mount('#app');

// 初始化系统设置（语言、主题、界面模式）
initSystem();
