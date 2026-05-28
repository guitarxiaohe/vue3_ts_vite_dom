# 🧠 XiaoHe Frontend — AI Agent 上下文

本文件为 AI 编码助手提供项目的完整上下文。架构细节见 `docs/` 目录。

> 📖 **核心文档：**
>
> - [docs/framework-overview.md](docs/framework-overview.md) — 框架架构总览、字段类型体系、字典系统、独立页面
> - [docs/entity-system.md](docs/entity-system.md) — EntityModule 注册、表单开发、筛选/表格配置、现有实体清单
> - [docs/dict-system.md](docs/dict-system.md) — 字典数据系统、缓存机制、颜色渲染
>
> 📖 **技能文件：**
>
> - [`.skills/entity-framework/SKILL.md`](.skills/entity-framework/SKILL.md) — 配置化实体框架开发指南
> - [`.skills/I18N/SKILL.md`](.skills/I18N/SKILL.md) — 国际化规范 (zh-CN/en-US/zh-TW)
> - [`.skills/UI/SKILL.md`](.skills/UI/SKILL.md) — UI 开发规范 (CSS变量/Element Plus/SCSS)
> - [`.skills/SKILL.md`](.skills/SKILL.md) — 代码注释规范

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
      notification.ts # WebSocket 通知消息
      presence.ts     # 实时在线用户快照
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

## 📡 5.1 WebSocket 与实时在线状态

### **当前实现约定**

- WebSocket 统一入口：`/ws/notify`
- 在线定义：只有当前用户 WebSocket 活跃时，才视为“实时在线”
- 消息分流：
  - 普通通知 -> `notification store`
  - `presence_snapshot` -> `presence store`
- 在线头像组件：统一复用 `src/components/user-avatar-info/index.vue`

### **关键文件**

| 职责                     | 路径                                        |
| ------------------------ | ------------------------------------------- |
| WebSocket URL 生成       | `src/composables/use-websocket.utils.ts`    |
| WebSocket 建连/断线/重连 | `src/composables/use-websocket.ts`          |
| WebSocket 消息分流       | `src/composables/use-websocket.message.ts`  |
| 通知消息存储             | `src/stores/modules/notification.ts`        |
| 在线用户快照存储         | `src/stores/modules/presence.ts`            |
| 在线头像组件             | `src/components/user-avatar-info/index.vue` |

### **开发规则**

- 需要显示用户在线状态时，优先传 `userId` 给 `user-avatar-info`，不要在页面里重复维护在线/离线布尔值
- 不要把在线状态混进 `notification store`；在线快照统一由 `presence store` 管理
- 开发环境默认走当前页面域名下的 `/dev-api/ws/notify` 代理；只有显式配置 `VITE_WS_URL` 时才允许直连后端
- 生产环境默认走同域名 `/prod-api/ws/notify` 反向代理；不要在组件中硬编码 `ws://` 或 `wss://`

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

## 📝 快速参考

### 新增实体 — 最小步骤

```
1. features/entities/<entityKey>/module.ts   → createEntityModule({...})
2. features/entities/<entityKey>/form/index.vue  → GenericEntityForm 包装 (可选)
3. 后端 entity_config + field_config 已配好
4. 访问 /multiview/<entityKey>
```

### 独立页面路由

| 路由              | 页面           |
| ----------------- | -------------- |
| `/entity`         | 字段配置管理   |
| `/fileInfo`       | 文件管理       |
| `/monitor/server` | 服务监控仪表盘 |
| `/monitor/cache`  | 缓存监控       |
| `/monitor/online` | 在线用户       |
| `/monitor/druid`  | Druid 连接池   |
| `/tool/gen`       | 代码生成器     |
| `/tool/build`     | 表单构建器     |
| `/tool/swagger`   | API 文档       |

### 在线状态接入

```
1. 页面或表格只传 userId 给 user-avatar-info
2. use-websocket 接收 presence_snapshot 并更新 presence store
3. user-avatar-info 自助判断是否在线并渲染状态圆点
```

### 新增独立页面

1. `src/views/<path>/index.vue` — 页面组件
2. `src/router/index.ts` — 添加路由
3. `src/locales/*.ts` — 三语翻译
4. `src/components/conventional-menu/index.vue` — 添加 normalizeMenuIndex 路径前缀
5. 数据库 `sys_menu` — 更新 path 字段

### 核心原则

1. **新需求优先走动态实体 API** — 建表 + 配 entity_config + field_config
2. **表单优先用 GenericEntityForm** — 从 field_config 自动渲染
3. **新增字段类型需同步**:
   - `types/entity-config.ts` — EntityFormField.type 联合类型
   - `use-table-columns.ts` — 表格 cellRenderer 分支
   - `form-drawer-form.vue` — 表单渲染分支
   - 后端 `field_config.field_type` 约定
4. **字典字段** — field_type='dict', dict_code 指向字典类型
5. **关联实体下拉** — field_type='select', select_entity_key 指向目标实体
6. **所有可见文字国际化** — 三语 (zh-CN/en-US/zh-TW)
7. **所有颜色用 CSS 变量** — 支持亮色/暗色主题切换
