---
name: ui-rules
description: 在当前仓库内新增或修改页面、组件、布局时使用。确保 UI 遵循项目约定的组件结构、Element Plus 用法、CSS 变量主题系统、SCSS 样式规范和响应式适配。
metadata:
  short-description: 项目 UI 开发规范
---

# UI Rules

## 适用场景

- 新增页面、组件、弹窗、抽屉、表单等 UI 模块。
- 修改已有组件的样式、布局或交互逻辑。
- 需要在不同界面模式下正确渲染（简洁模式 / 常规模式）。

## 技术栈

| 类别   | 方案                                                                                      |
| ------ | ----------------------------------------------------------------------------------------- |
| 组件库 | Element Plus（`el-*`）                                                                    |
| 图标   | `lucide-vue-next`（首选）、`@element-plus/icons-vue`（Element Plus 内置场景）             |
| 样式   | SCSS + Tailwind CSS v4                                                                    |
| 主题   | CSS 变量（`src/styles/variables.scss`），支持 `light` / `dark`                            |
| 响应式 | Tailwind 断点：`mobile`（<768px）、`tablet`（≥768px）、`pc`（≥1024px）、`wide`（≥1920px） |
| 国际化 | `vue-i18n`，所有可见文本用 `t()` / `$t()`                                                 |

## 组件文件结构

```
src/components/<component-name>/
  index.vue           # 主组件（<script setup lang="ts">）
  index.type.ts       # 组件类型定义
  index.scss          # 组件样式（可选，复杂组件使用）
  index.ts            # 统一导出（可选）
  composables/        # 组件级 composables
  utils/              # 组件级工具函数（可选）
  components/         # 子组件（可选）
```

## CSS 变量与主题

### 必须使用 CSS 变量

所有颜色、背景、边框、阴影、圆角、间距必须引用 `src/styles/variables.scss` 中定义的 CSS 变量，**禁止硬编码颜色值**。

```scss
// ✅ 正确
.element {
  color: var(--color-text-primary);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

// ❌ 错误
.element {
  color: #333;
  background: #fff;
}
```

### 主题切换

- 亮色/暗色主题由 `useSystemStore` 管理，通过 `html.dark` 或 `[data-theme='dark']` 切换
- 新增 UI 时确保在暗色模式下视觉效果正常
- 使用 Element Plus 组件时通过 `el-config-provider` 注入 Element Plus 语言/主题

### 可用 CSS 变量速览

- 主色：`--color-primary`、`--color-primary-light`、`--color-primary-dark`、`--color-primary-bg`
- 功能色：`--color-success`、`--color-warning`、`--color-danger`、`--color-info`（及对应 `-light`、`-bg` 变体）
- 文字：`--color-text-primary`、`--color-text-secondary`、`--color-text-placeholder`、`--color-text-disabled`
- 背景：`--color-bg-page`、`--color-bg-card`、`--color-bg-hover`、`--color-bg-active`
- 边框：`--color-border`、`--color-border-light`、`--color-border-dark`
- 阴影：`--shadow-sm` / `--shadow-md` / `--shadow-lg` / `--shadow-xl`
- 圆角：`--radius-sm` / `--radius-md` / `--radius-lg` / `--radius-xl` / `--radius-full`
- 间距：`--spacing-xs` / `--spacing-sm` / `--spacing-md` / `--spacing-lg` / `--spacing-xl`
- 字体：`--font-size-xs` ~ `--font-size-3xl`
- 过渡：`--transition-fast` / `--transition-normal` / `--transition-slow`
- 层级：`--z-dropdown` / `--z-modal` / `--z-toast` / `--z-tooltip`

## Element Plus 使用约定

- 全局配置通过 `<el-config-provider>` 注入（参见 `App.vue`）
- 表格优先使用 `ElTableV2`（虚拟滚动），避免大数据量下性能问题
- 表单使用 `el-form` + `el-form-item`，结合项目自定义表单组件
- 弹窗/抽屉：详情用 `el-drawer`，确认操作用 `ElMessageBox`，提示用 `ElMessage`
- Element Plus 组件的主色通过 `--el-color-primary` 等变量统一控制

## SCSS 样式规范

- 组件样式放在同级 `index.scss` 中
- 类名使用 BEM 风格：`.component-name__element--modifier`
- 嵌套层级不超过 3 层
- 所有样式写在组件命名空间下，避免全局污染

```scss
/******************************** component-name 样式 ********************************/

.component-name {
  // 根元素
}

.component-name__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.component-name__content {
  // ...
}
```

## Tailwind CSS 使用

- 布局、间距、简单颜色可用 Tailwind 工具类
- 复杂样式、主题相关样式使用 SCSS + CSS 变量
- 响应式断点使用 Tailwind 工具类：`mobile:*`、`tablet:*`、`pc:*`、`wide:*`

## 模板分块注释

模板中不同功能区使用统一分隔符：

```html
<!-------------------------- 顶部工具区 -------------------------->
<!-------------------------- 表格区域 -------------------------->
<!-------------------------- 分页 -------------------------->
<!-------------------------- 弹窗/抽屉 -------------------------->
```

## Script 分块注释

```ts
/******************************** 组件入参 ********************************/
/******************************** 状态与计算属性 ********************************/
/******************************** 生命周期与监听 ********************************/
/******************************** 方法 ********************************/
```

## 界面模式适配

- 简洁模式（`systemStore.isSimpleMode`）：轮盘菜单 `PlateMenu` + 浮动设置图标
- 常规模式（`systemStore.isConventionalMode`）：侧边栏 `ConventionalMenu` + 菜单底部设置面板
- 新增 UI 组件需要同时考虑两种模式下的展示效果
- 面包屑在简洁模式下默认隐藏

## 执行提醒

- **所有可见文本必须国际化**（参见 `i18n-rules` skill）
- **所有颜色必须用 CSS 变量**，不动原始色值
- 新增组件遵循上述文件结构
- 保持最小改动，不顺手重构无关组件样式
