import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default [
  // 基础 JavaScript 推荐配置
  js.configs.recommended,

  // TypeScript 推荐配置
  ...tseslint.configs.recommended,

  // Vue 推荐配置
  ...pluginVue.configs['flat/recommended'],

  // Prettier 配置（必须放在最后，用于关闭与 Prettier 冲突的规则）
  eslintPluginPrettier,

  // Vue 文件特殊配置
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },

  // 全局配置
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Vue 相关规则
      'vue/multi-word-component-names': 'off', // 允许单词组件名
      'vue/no-v-html': 'off', // 允许 v-html

      // TypeScript 相关规则
      '@typescript-eslint/no-explicit-any': 'warn', // any 类型警告
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // 通用规则
      'no-console': 'warn',
      'no-debugger': 'warn',
      'no-case-declarations': 'error',
    },
  },

  // 忽略文件
  {
    ignores: ['dist/', 'node_modules/', '*.d.ts', 'components.d.ts'],
  },
];
