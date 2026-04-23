import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

/******************************** vite 配置 ********************************/
// 读取环境变量并返回开发配置
export default defineConfig(({ mode }) => {
  const env: Record<string, string> = loadEnv(mode, process.cwd());

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      proxy: {
        '/dev-api': {
          target: env.VITE_BASE_URL,
          changeOrigin: true,
          // 统一移除本地代理前缀
          rewrite: (p) => p.replace(/^\/dev-api/, ''),
        },
      },
    },
  };
});
