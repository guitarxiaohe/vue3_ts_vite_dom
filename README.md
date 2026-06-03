# XiaoHe Frontend

XiaoHe Frontend 是一个基于 `Vue 3 + TypeScript + Vite` 的配置化后台前端项目。
它和后端的 `entity_config`、`field_config` 元数据表协作，通过一套通用渲染链路完成列表、筛选、表单、详情抽屉和字典展示，目标是减少重复 CRUD 开发。

## 线上演示

- 演示地址：[http://110.42.237.20/](http://110.42.237.20/)

## 核心特点

- 配置化实体页面：`建表 -> 配 entity_config / field_config -> 自动渲染页面`
- 通用多视图页面：统一列表、筛选、行操作、详情抽屉
- 动态字段系统：字段类型、字典、关联实体、审计人、文件信息统一消费
- 三语言国际化：`zh-CN` / `en-US` / `zh-TW`
- 主题切换：基于 CSS 变量支持浅色 / 深色 / 跟随系统
- 字典标签渲染：支持后端颜色字段，前端以 tag/badge 方式展示
- 代码生成器联动：生成器列配置会与 `field_config` 知识库对齐

## 技术栈

- `Vue 3.5` + `<script setup>`
- `TypeScript 5`
- `Vite 8`
- `Pinia`
- `@tanstack/vue-query`
- `Element Plus`
- `vue-i18n`
- `VueUse`
- `axios`
- `lucide-vue-next`

## 目录结构

```text
src/
  api/                       # API 请求封装
  components/                # 全局复用组件
  composables/               # 组合式函数
  constants/                 # 常量定义
  features/
    entities/                # 实体模块注册与表单
    form-shell/              # 通用表单抽屉
    multiview/               # 通用多视图页面
  locales/                   # 国际化语言包
  router/                    # 路由
  stores/                    # Pinia store
  styles/                    # 全局样式与主题变量
  types/                     # 类型定义
  utils/                     # 工具函数
  views/                     # 独立页面
docs/                        # 框架与业务文档
.skills/                     # 仓库内开发规范与技能说明
```

## 本地开发

### 安装依赖

```bash
pnpm install
```

### 启动开发环境

```bash
pnpm dev
```

### 类型检查

```bash
pnpm type-check
```

### 构建

```bash
pnpm build
```

## 环境说明

- 项目通过 `.env.*` 管理接口前缀等运行配置
- 本地开发通常配合后端 `xiaohe-admin` 服务使用
- 动态实体页面、字典、代码生成器都依赖后端元数据接口

## 配置化实体开发流程

### 新增一个实体

1. 在数据库创建业务表
2. 在后端补齐 `entity_config`
3. 在后端补齐 `field_config`
4. 前端按需新增 `src/features/entities/<entityKey>/module.ts`
5. 访问 `/multiview/<entityKey>`

### 字段类型体系

当前项目和前后端对齐的 `field_type` 主要包括：

- `input`
- `number`
- `textarea`
- `select`
- `dict`
- `date`
- `datetime`
- `switch`
- `file`
- `by`
- `user`

其中：

- `dict` 需要 `dict_code`
- `select` 需要 `select_entity_key`
- `by` 用于展示 `createUser` / `updateUser`
- `file` 会自动关联文件信息

## 核心页面

- `/multiview/:entityKey`：通用实体页面
- `/entity`：实体配置管理
- `/fileInfo`：文件管理
- `/tool/gen`：代码生成器
- `/tool/build`：表单构建器
- `/tool/swagger`：接口文档
- `/monitor/*`：监控类页面

## 关键文档

- [docs/framework-overview.md](docs/framework-overview.md) - 框架总览
- [docs/entity-system.md](docs/entity-system.md) - 实体系统说明
- [docs/dict-system.md](docs/dict-system.md) - 字典系统说明
- [AGENTS.md](AGENTS.md) - 仓库开发上下文与约定

## 开发约定

- 所有可见文案都要支持国际化
- 所有主题颜色统一走 CSS 变量
- 新需求优先考虑走动态实体配置，而不是手写一套 CRUD
- 表单字段、表格列、筛选项尽量与 `field_config` 保持一致
- 前后端字段类型、字典编码、关联实体必须严格对齐

## 相关仓库

- 当前仓库：前端 `xiaoheDOM`
- 配套后端：`sprintboot` 多模块 Spring Boot 工程
