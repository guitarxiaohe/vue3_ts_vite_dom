# 🧠 Vue3 Frontend Platform Agent

本 Agent 是 Vue3 前端中台项目的核心智能体。负责生成、维护和优化前端代码，确保系统架构统一、可扩展、易维护。

---

## ✅ 1. 核心技术栈

### **前端核心**

- **Vite** + **Vue 3.4+** (Composition API + `<script setup>`)
- **TypeScript 5+** + **pnpm**
- 状态管理: **Pinia**(客户端状态) + **TanStack Query**(服务端数据)
- UI: **Element Plus** + **SCSS**
- HTTP: **axios**
- 国际化: **vue-i18n**
- 工具库: **VueUse**

### **目录约定**

```
src/
  api/                # API 接口层
    modules/          # 按模块划分的 API
      user.ts
    client.ts         # axios 实例封装
  components/         # 全局复用组件
  composables/        # 全局组合式函数
    useLocale.ts      # 国际化切换
    useTheme.ts       # 主题切换
    useQuery.ts       # TanStack Query 封装
    useThree.ts       # Three.js 场景管理
  constants/          # 常量定义
  i18n/               # i18n 实例配置
  layout/             # 布局组件
  locales/            # 国际化语言包
    zh-CN.ts          # 简体中文
    en-US.ts          # 英文
    zh-TW.ts          # 繁体中文
  router/             # 路由配置
  stores/             # Pinia 状态管理
    modules/          # 按模块划分的 store
  styles/             # 全局样式
    base.scss         # 基础样式
    variables.scss    # CSS 变量定义
  types/              # TypeScript 类型定义
    api/              # API 相关类型
      index.type.ts
    user/             # 用户模块类型
      index.type.ts
  utils/              # 工具函数
  views/              # 页面组件
```

---

## 📁 2. 类型定义规范

### **目录结构**

类型文件统一放置在 `/src/types/` 目录下，按模块划分：

```
src/types/
  api/
    index.type.ts     # API 通用类型（ApiResponse, Pagination 等）
  user/
    index.type.ts     # 用户模块类型
  product/
    index.type.ts     # 产品模块类型
  ...
```

### **命名规范**

- 文件名: `index.type.ts`
- 接口名: PascalCase，以模块名开头
- 导出方式: 使用 `export interface` / `export type`

### **示例**

```typescript
// src/types/user/index.type.ts
export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
```

```typescript
// src/types/api/index.type.ts
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}
```

---

## 🌐 3. 国际化 (i18n) 规范

### **支持语言**

## ！！！所有可见的文字都需要支持多语言切换

| 语言代码 | 说明             |
| -------- | ---------------- |
| `zh-CN`  | 简体中文（默认） |
| `en-US`  | 英文             |
| `zh-TW`  | 繁体中文         |

### **语言切换 (useLocale)**

使用 VueUse 的 `useStorage` 实现语言持久化：

```typescript
// src/composables/useLocale.ts
import { useStorage } from '@vueuse/core';
import { useI18n } from 'vue-i18n';

export function useLocale() {
  const i18n = useI18n();

  const currentLocale = useStorage<AppLocale>(
    'app_locale',
    'zh-CN',
    localStorage
  );

  const changeLocale = (locale: AppLocale) => {
    currentLocale.value = locale;
    i18n.locale.value = locale;
    document.documentElement.setAttribute('lang', locale);
  };

  return { currentLocale, changeLocale };
}
```

### **使用方式**

```vue
<template>
  <el-select v-model="currentLocale" @change="changeLocale">
    <el-option label="简体中文" value="zh-CN" />
    <el-option label="English" value="en-US" />
    <el-option label="繁體中文" value="zh-TW" />
  </el-select>
</template>

<script setup lang="ts">
import { useLocale } from '@/composables/useLocale';

const { currentLocale, changeLocale } = useLocale();
</script>
```

### **语言包结构**

```typescript
// src/locales/zh-CN.ts
export default {
  common: {
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    add: '新增',
    search: '搜索',
    reset: '重置',
    loading: '加载中...',
    success: '操作成功',
    failed: '操作失败',
    required: '此项为必填项',
  },
  user: {
    login: '登录',
    logout: '退出登录',
    username: '用户名',
    password: '密码',
    loginSuccess: '登录成功',
    loginFailed: '登录失败',
  },
  validation: {
    required: '{field}不能为空',
    minLength: '{field}长度不能少于{min}个字符',
    maxLength: '{field}长度不能超过{max}个字符',
    email: '请输入有效的邮箱地址',
    phone: '请输入有效的手机号码',
  },
};
```

---

## 🎨 4. 主题切换规范

### **主题切换 (useTheme)**

## 所有可见的背景颜色和文字颜色都需要支持主题切换

使用 VueUse 的 `useDark` 和 `useToggle` 实现主题切换：

```typescript
// src/composables/useTheme.ts
import { useDark, useToggle, useStorage } from '@vueuse/core';

export type ThemeMode = 'light' | 'dark' | 'auto';

export function useTheme() {
  const isDark = useDark({
    selector: 'html',
    attribute: 'data-theme',
    valueDark: 'dark',
    valueLight: 'light',
  });

  const themeMode = useStorage<ThemeMode>('app_theme', 'auto', localStorage);

  const toggleDark = useToggle(isDark);

  const changeTheme = (mode: ThemeMode) => {
    themeMode.value = mode;
    if (mode === 'auto') {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark.value = mode === 'dark';
    }
  };

  return { isDark, toggleDark, themeMode, changeTheme };
}
```

### **使用方式**

```vue
<template>
  <el-switch
    v-model="isDark"
    @change="toggleDark"
    active-text="深色"
    inactive-text="浅色"
  />
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';

const { isDark, toggleDark } = useTheme();
</script>
```

### **CSS 变量**

```scss
// src/styles/variables.scss

:root {
  --color-primary: #6c3ff5;
  --color-bg-page: #f9fafb;
  --color-bg-card: #ffffff;
  --color-text-primary: #1f2937;
  // ...
}

[data-theme='dark'] {
  --color-bg-page: #111827;
  --color-bg-card: #1f2937;
  --color-text-primary: #f9fafb;
  // ...
}
```

---

## 🔧 5. VueUse 常用工具

### **状态持久化**

```typescript
import { useStorage } from '@vueuse/core';

// 自动同步 localStorage
const token = useStorage('token', '', localStorage);

// 自动同步 sessionStorage
const tempData = useStorage('temp', {}, sessionStorage);
```

### **响应式监听**

```typescript
import { useMutationObserver, useResizeObserver } from '@vueuse/core';

// 监听 DOM 变化
useMutationObserver(element, (mutations) => {
  console.log('DOM changed:', mutations);
});

// 监听元素尺寸变化
useResizeObserver(element, (entries) => {
  console.log('Size changed:', entries);
});
```

### **浏览器 API**

```typescript
import { useDark, useToggle, usePreferredDark } from '@vueuse/core';

// 系统偏好
const prefersDark = usePreferredDark();

// 剪贴板
import { useClipboard } from '@vueuse/core';
const { text, copy, copied } = useClipboard();

// 全屏
import { useFullscreen } from '@vueuse/core';
const { isFullscreen, toggle } = useFullscreen();
```

---

## 📦 6. API 模块规范

### **目录结构**

```
src/api/
  client.ts           # axios 实例，请求/响应拦截器
  modules/
    user.ts           # 用户相关 API
    product.ts        # 产品相关 API
```

### **API 函数定义**

```typescript
// src/api/modules/user.ts
import { httpClient } from '../client';
import type { LoginParams, LoginResponse, User } from '@/types/user';

export const login = (data: LoginParams) => {
  return httpClient.post<LoginResponse>('/login', data);
};

export const getUserInfo = () => {
  return httpClient.get<User>('/user/info');
};

export const logout = () => {
  return httpClient.post('/logout');
};
```

---

## 🏪 7. Store 规范

### **使用 Composition API 风格**

```typescript
// src/stores/modules/user.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useStorage } from '@vueuse/core';
import { login, logout, getUserInfo } from '@/api/modules/user';
import type { User, LoginParams } from '@/types/user';

export const useUserStore = defineStore('user', () => {
  const token = useStorage<string | null>('token', null, localStorage);
  const userInfo = ref<User | null>(null);

  const isLoggedIn = computed(() => !!token.value);

  const loginAction = async (params: LoginParams) => {
    const response = await login(params);
    if (response.code === 200) {
      token.value = response.data.token;
      return true;
    }
    return false;
  };

  const logoutAction = async () => {
    await logout();
    token.value = null;
    userInfo.value = null;
  };

  return {
    token,
    userInfo,
    isLoggedIn,
    loginAction,
    logoutAction,
  };
});
```

---

## 🧩 8. 组件规范

### **组件结构**

```vue
<template>
  <div class="my-component">
    <!-- 模板内容 -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDark, useToggle } from '@vueuse/core';
import type { PropsType } from '@/types/module';

const props = defineProps<PropsType>();

const emit = defineEmits<{
  (e: 'update', value: string): void;
}>();

const { t } = useI18n();
const isDark = useDark();

const loading = ref(false);

const handleClick = () => {
  emit('update', 'new value');
};

onMounted(() => {
  // 初始化逻辑
});
</script>

<style lang="scss" scoped>
.my-component {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-md);
}
</style>
```

---

## 📝 使用说明

将此文档保存为 `AGENTS.md`，放置在项目根目录下。AI Agent 会自动读取并遵循这些规范。

当需要生成新模块时，只需描述需求，例如:

> "生成一个订单管理模块，包含列表、详情、状态流转功能"

Agent 会自动生成所有必要的文件和代码，包括:

- 类型定义 (`/src/types/order/index.type.ts`)
- API 接口 (`/src/api/modules/order.ts`)
- Store 状态管理 (`/src/stores/modules/order.ts`)
- 页面组件 (`/src/views/order/`)
- 国际化文本 (`/src/locales/*.ts`)
