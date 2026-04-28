# 🧠 Vue3 Frontend Platform Agent

本 Agent 是 Vue3 前端中台项目的核心智能体。负责生成、维护和优化前端代码，确保系统架构统一、可扩展、易维护。

**补充规范（注释与分块）**：新增或修改仓库代码时，须同时遵循项目内 [`.skill/SKILL.md`](.skill/SKILL.md)（`comment-rules`）中的约定。

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
- 图标: **lucide-vue-next**

### **目录约定**

```
src/
  api/                # API 接口层
    modules/          # 按模块划分的 API
      user.ts
    client.ts         # axios 实例封装
  components/         # 全局复用组件
    conventional-menu/  # 常规模式菜单
    plate-menu/         # 简洁模式菜单（轮盘）
    settings-panel/     # 设置面板组件
  composables/        # 全局组合式函数
    useLocale.ts      # 国际化切换
    useTheme.ts       # 主题切换
    useMenu.ts        # 菜单数据处理
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
      system.ts       # 系统设置（主题、国际化、界面模式）
      user.ts         # 用户状态
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

组件目录下的组件类型统一放在组件同级 `index.type.ts` 中，例如：

```text
src/components/
  async-select/
    async-select.vue
    index.ts
    index.type.ts
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

### **语言包结构**

```typescript
// src/locales/zh-CN.ts
export default {
  common: {
    confirm: '确认',
    cancel: '取消',
    // ...
  },
  menu: {
    home: '首页',
    threeScene: '3D 场景',
    // ...
  },
  theme: {
    light: '浅色',
    dark: '深色',
    auto: '跟随系统',
    switchTheme: '切换主题',
  },
  locale: {
    zhCN: '简体中文',
    enUS: 'English',
    zhTW: '繁體中文',
    switchLanguage: '切换语言',
  },
  interfaceMode: {
    simple: '简洁模式',
    conventional: '常规模式',
    switchMode: '切换界面模式',
    simpleDesc: '轮盘菜单，主题和语言跟随系统',
    conventionalDesc: '常规菜单，可自定义设置',
  },
  breadcrumb: {
    show: '显示面包屑',
    hide: '隐藏面包屑',
    setting: '面包屑设置',
  },
};
```

---

## 🎨 4. 主题切换规范

### **主题切换**

## 所有可见的背景颜色和文字颜色都需要支持主题切换

使用 CSS 变量实现主题切换：

```scss
// src/styles/variables.scss

:root {
  --color-primary: #6c3ff5;
  --color-bg-page: #f9fafb;
  --color-bg-card: #ffffff;
  --color-text-primary: #1f2937;
}

[data-theme='dark'] {
  --color-bg-page: #111827;
  --color-bg-card: #1f2937;
  --color-text-primary: #f9fafab;
}
```

---

## 🏪 5. Store 规范

### **System Store**

系统设置统一管理，包含主题、国际化、界面模式、面包屑设置：

```typescript
// src/stores/modules/system.ts
import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type InterfaceMode = 'simple' | 'conventional';

export const useSystemStore = defineStore('system', () => {
  // 界面模式
  const interfaceMode = useStorage<InterfaceMode>(
    'app_interface_mode',
    'conventional',
    localStorage
  );
  const isSimpleMode = computed(() => interfaceMode.value === 'simple');
  const isConventionalMode = computed(
    () => interfaceMode.value === 'conventional'
  );

  // 国际化
  const currentLocale = useStorage<AppLocale>(
    'app_locale',
    'zh-CN',
    localStorage
  );

  // 主题
  const currentTheme = useStorage<ThemeMode>('app_theme', 'auto', localStorage);
  const isDark = computed(() => {
    if (currentTheme.value === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return currentTheme.value === 'dark';
  });

  // 面包屑
  const showBreadcrumb = useStorage('app_show_breadcrumb', true, localStorage);

  return {
    interfaceMode,
    isSimpleMode,
    isConventionalMode,
    currentLocale,
    currentTheme,
    isDark,
    showBreadcrumb,
  };
});
```

---

## 🧩 6. 界面模式

### **简洁模式 (Simple Mode)**

- 菜单: `plate-menu` 轮盘菜单
- 主题: 自动跟随系统
- 语言: 自动跟随浏览器
- 设置: 悬浮设置图标，点击打开抽屉

### **常规模式 (Conventional Mode)**

- 菜单: `conventional-menu` 侧边栏菜单（el-menu）
- 主题: 用户手动选择
- 语言: 用户手动选择
- 设置: 菜单底部设置面板

### **切换逻辑**

```typescript
// 切换到简洁模式时自动设置
const applySimpleModeSettings = () => {
  setThemeBySystem();
  setLocaleByBrowser();
};

watch(interfaceMode, (mode) => {
  if (mode === 'simple') {
    applySimpleModeSettings();
  }
});
```

---

## 📦 7. 菜单数据处理 (useMenu)

### **功能**

- 扁平化菜单列表（带 fullPath、level、allParentIds）
- 树形菜单结构
- 面包屑路径获取
- 可见菜单过滤

### **使用示例**

```typescript
import { useMenu } from '@/composables/useMenu';

const menuData = ref([
  {
    menuId: 1,
    menuName: '系统管理',
    parentId: null,
    path: 'system',
    orderNum: 1,
  },
  { menuId: 2, menuName: '用户管理', parentId: 1, path: 'user', orderNum: 1 },
]);

const { flatList, treeList, getBreadcrumb, getVisibleTree } = useMenu(menuData);

// flatList[1].fullPath => '/system/user'
// flatList[1].level => 2
// getBreadcrumb(2) => [系统管理, 用户管理]
```

---

## 🔧 8. VueUse 常用工具

### **状态持久化**

```typescript
import { useStorage } from '@vueuse/core';

const token = useStorage('token', '', localStorage);
```

### **浏览器 API**

```typescript
import { useDark, useToggle, usePreferredDark } from '@vueuse/core';

const prefersDark = usePreferredDark();
```

---

## 🧱 9. 实体模块标准示例

以 [src/features/entities/dict/module.ts](src/features/entities/dict/module.ts) 为参考，实体模块建议统一导出一个 `EntityModule` 配置对象；当实体存在筛选条件、子表关系或详情抽屉时，也统一在模块配置中集中声明。

### **标准示例**

```typescript
import { defineAsyncComponent } from 'vue';
import type { EntityModule } from '@/features/entities/types';

const entityModule: EntityModule = {
  entityKey: 'dict',
  form: {
    component: defineAsyncComponent(
      () => import('@/features/entities/dict/form/index.vue')
    ),
  },
  rowActions: {
    actionColumnWidth: 180,
  },
  config: {
    entityKey: 'dict',
    title: '字典类型',
    actions: {
      showCreate: true,
      showEdit: true,
      showCopy: true,
      showDelete: true,
      showImport: false,
      showExport: true,
    },
    filters: {
      fields: {
        dictName: {
          key: 'dictName',
          label: '字典名称',
          component: 'input',
          placeholder: '请输入字典名称',
          order: 1,
        },
        dictType: {
          key: 'dictType',
          label: '字典类型',
          component: 'input',
          placeholder: '请输入字典类型',
          order: 2,
        },
        status: {
          key: 'status',
          label: '状态',
          component: 'select',
          placeholder: '请选择状态',
          order: 3,
          options: [
            { label: '启用', value: '0' },
            { label: '停用', value: '1' },
          ],
        },
      },
    },
    table: {
      rowKey: 'dictId',
      height: 560,
      pageSize: 20,
      defaultSort: { field: 'createdTime', order: 'desc' },
      showColumnSettings: true,
      children: [
        {
          label: '字典值信息',
          relationField: {
            parentKey: 'dictType',
            childKey: 'dictType',
          },
          entityKey: 'dictData',
          rowKey: 'dictCode',
          hiddenColumnKeys: ['dictType'],
        },
      ],
    },
    detail: {
      title: '字典类型详情',
      width: '70%',
      visibleCount: 10,
    },
  },
};

export default entityModule;
```

### **字段说明**

- `entityKey`：实体唯一标识，需与模块目录、接口配置保持一致
- `form.component`：实体表单组件，统一使用 `defineAsyncComponent`
- `rowActions.actionColumnWidth`：行操作列宽度
- `config.actions`：控制增删改复制导入导出等能力开关
- `config.filters.fields`：列表查询区字段定义，支持输入框、选择器等组件配置
- `config.table`：控制表格主键、分页、排序、高度、列设置等
- `config.table.children`：声明主子表关系，用于详情/联动展示子实体
- `config.detail`：控制详情抽屉标题、宽度、首屏可见字段数

### **推荐约定**

- 模块文件路径统一为 `src/features/entities/<entityKey>/module.ts`
- 默认导出名称统一为 `entityModule`
- 表单组件统一异步加载，降低首屏体积
- `config.entityKey` 与顶层 `entityKey` 保持一致，避免运行时映射错误
- 有筛选需求时优先在 `config.filters.fields` 中声明，不要把查询逻辑散落到页面组件
- 有主子表关系时统一使用 `table.children` 描述父子关联字段和子实体键

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
