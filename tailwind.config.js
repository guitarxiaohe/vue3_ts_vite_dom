/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './error.vue',
  ],
  theme: {
    screens: {
      // 保留 Tailwind 默认断点，补齐项目约定的响应式语义断点
      mobile: { max: '767px' },
      tablet: '768px',
      pc: '1024px',
      wide: '1920px',
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ffc320',
          dark: '#eab308',
        },
      },
    },
  },
  plugins: [],
};
