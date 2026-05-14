import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

/******************************** vite 配置 ********************************/
// 读取环境变量并返回开发配置
export default defineConfig(({ mode }) => {
  const env: Record<string, string> = loadEnv(mode, process.cwd());
  const proxyPrefix = env.VITE_APP_BASE_API || '/dev-api';

  return {
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      host: '0.0.0.0', // 监听所有地址，包括局域网
      proxy: {
        [proxyPrefix]: {
          target: env.VITE_BASE_URL,
          changeOrigin: true,
          ws: true,
          // 统一移除本地代理前缀
          rewrite: (p) => p.replace(new RegExp(`^${proxyPrefix}`), ''),
        },
      },
    },
  };
});
