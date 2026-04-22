import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import tailwindcss from 'tailwindcss';
// https://vite.dev/config/

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [vue(), tailwindcss()],
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
          rewrite: (p) => p.replace(/^\/dev-api/, ''),
        },
      },
    },
  };
});
