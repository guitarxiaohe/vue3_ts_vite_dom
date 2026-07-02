# XiaoHe Frontend

XiaoHe Frontend 是一个基于 `Vue 3 + TypeScript + Vite` 的配置化后台前端项目。
它和后端的 `entity_config`、`field_config` 元数据表协作，通过一套通用渲染链路完成列表、筛选、表单、详情抽屉和字典展示，目标是减少重复 CRUD 开发。

## 线上演示

- 演示地址：[http://110.42.237.20/](http://110.42.237.20/)

## 核心特点

- **配置化实体页面**：`建表 → 配 entity_config / field_config → 自动渲染页面`，零代码完成 CRUD
- **通用多视图页面**：统一列表、筛选、行操作、批量操作、详情抽屉
- **实体模块系统**：通过 `createEntityModule` 工厂函数声明式注册实体，支持表单、行操作、表头按钮、批量操作
- **动态字段系统**：字段类型、字典、关联实体、审计人、文件信息统一消费
- **表单条件可见性**：字段支持 `visibleWhen` 根据表单数据动态显示/隐藏
- **三语言国际化**：`zh-CN` / `en-US` / `zh-TW`
- **主题切换**：基于 CSS 变量支持浅色 / 深色 / 跟随系统
- **字典标签渲染**：支持后端颜色字段，前端以 `DictTag` 组件展示
- **代码生成器联动**：生成器列配置会与 `field_config` 知识库对齐

## 技术栈

| 分类     | 技术                                          |
| -------- | --------------------------------------------- |
| 框架     | `Vue 3.5` + `<script setup>` + `TypeScript 5` |
| 构建     | `Vite 8`                                      |
| 状态管理 | `Pinia`                                       |
| 数据请求 | `@tanstack/vue-query` + `axios`               |
| UI 组件  | `Element Plus`                                |
| 国际化   | `vue-i18n`                                    |
| 工具库   | `VueUse`                                      |
| 图标     | `lucide-vue-next`                             |
| 动画     | `GSAP` + `ScrollTrigger`                      |
| 三维     | `Three.js`                                    |

## 目录结构

```text
src/
  api/                           # API 请求封装（按模块拆分）
    modules/                     #   各业务模块 API
    query-client.ts              #   vue-query 客户端实例
  components/                    # 全局复用组件
    ai-chat/                     #   AI 客服对话面板
    async-select/                #   异步下拉选择器（支持实体/字典数据源）
    async-cascader/              #   异步级联选择器
    conventional-menu/           #   通用侧边栏菜单
    dict-tag/                    #   字典标签渲染组件
    file-upload/                 #   文件上传组件
    picture-upload/              #   图片上传组件
    rich-text-editor/            #   富文本编辑器
    table-entity/                #   通用实体表格（核心渲染引擎）
    user-avatar-info/            #   用户头像信息展示
    ...
  composables/                   # 组合式函数
    use-chunked-upload.ts        #   分片上传
    use-dict-data.ts             #   字典数据加载
    use-image-url.ts             #   图片地址解析
    use-livekit-room.ts          #   LiveKit 音视频会议
    use-websocket.ts             #   WebSocket 连接
    useTheme.ts                  #   主题切换
    useLocale.ts                 #   语言切换
    ...
  constants/                     # 常量定义（字段类型、语言等）
  features/
    entities/                    # 实体模块（见下方「实体模块清单」）
      _shared/                   #   公共工具：类型定义、字段适配器、表单组件
      registry.ts                #   实体模块自动注册（import.meta.glob）
      types.ts                   #   EntityModule 类型定义
    form-shell/                  # 通用表单抽屉壳
      components/                #   form-drawer / form-drawer-form
      composables/               #   表单校验 composable
      types/                     #   DetailField / DetailRecord 类型
    multiview/                   # 通用多视图页面
      components/                #   筛选栏、操作列、导入导出等
      composables/               #   多视图状态管理
  i18n/                          # vue-i18n 初始化
  locales/                       # 国际化语言包（zh-CN / en-US / zh-TW）
  layout/                        # 全局布局壳（侧边栏 + 顶栏 + 内容区）
  router/                        # 路由定义与权限守卫
  stores/                        # Pinia store（user / system / meeting 等）
  styles/                        # 全局样式、CSS 变量、Tailwind
  types/                         # 全局类型定义（API / dict / entity-config 等）
  utils/                         # 工具函数（权限、下载、校验、字典等）
  views/                         # 独立页面
    login/                       #   登录页（入场动画 + 注册/登录切换）
    external-meeting/            #   外部会议（LiveKit 音视频 + 屏幕共享）
    meeting-assistant/           #   会议助手
    fileInfo/                    #   文件管理
    entity/                      #   实体配置管理
    monitor/                     #   监控（缓存/Druid/在线用户/服务器）
    tool/                        #   工具（代码生成器/表单构建器/Swagger）
    multiview/                   #   通用实体多视图入口
    three/                       #   Three.js 3D 示例
    components/                  #   首页组件（TimeCard 时间轴、Header 等）
docs/                            # 框架与业务文档
.skills/                         # 仓库内开发规范与技能说明
deploy/                          # 部署配置（Docker / Nginx）
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

### 代码格式检查

```bash
pnpm format:check
```

### 构建

```bash
pnpm build
```

## 环境配置

项目通过 `.env.*` 管理运行配置：

| 变量                | 说明                             |
| ------------------- | -------------------------------- |
| `VITE_APP_BASE_API` | 接口前缀                         |
| `VITE_BASE_URL`     | 文件/图片资源基础地址            |
| `VITE_WS_URL`       | WebSocket 地址（留空走当前域名） |
| `VITE_IS_MOCK`      | 是否启用 Mock                    |
| `VITE_PAGE_SIZES`   | 分页可选每页条数                 |

## 配置化实体开发流程

### 新增一个实体

1. 在数据库创建业务表
2. 在后端补齐 `entity_config`（实体元数据）
3. 在后端补齐 `field_config`（字段元数据）
4. 前端新增 `src/features/entities/<entityKey>/module.ts`（可选，仅需自定义时）
5. 访问 `/multiview/<entityKey>`

### 实体模块结构

每个实体模块位于 `src/features/entities/<entityKey>/`，典型结构：

```text
<entityKey>/
  module.ts              # 实体模块注册（createEntityModule）
  form/
    index.vue            # 自定义表单组件（可选）
    constants.ts         # 表单字段配置（getEntityFormFields）
  services/
    index.ts             # 实体专属 API（可选）
  batch-actions/
    *.vue                # 表头批量操作按钮（可选）
  row-actions/
    *.vue                # 行级操作按钮（可选）
```

### module.ts 示例

```ts
import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

export default createEntityModule({
  entityKey: 'chatRule',
  formComponent: defineAsyncComponent(() => import('./form/index.vue')),
  rowActions: { actionColumnWidth: 180 },
  tableActions: {
    right: [
      {
        component: defineAsyncComponent(
          () => import('./batch-actions/rule.vue')
        ),
      },
    ],
  },
  config: {
    title,
    actions: { showImport: true, showExport: true },
    table: { rowKey: 'ruleId', height: 560 },
    detail: { title, width: '56%', visibleCount: 10 },
  },
});
```

### 表单字段配置

表单字段通过 `getEntityFormFields(t)` 函数返回 `EntityFormField[]`，支持：

- **字段类型**：`text` / `number` / `select` / `async-select` / `async-cascader` / `textarea` / `radio` / `checkbox` / `switch` / `date` / `datetime` / `picture` / `fileUpload` / `articleEditor`
- **数据源**：`optionSource: 'static'` 静态选项 / `optionSource: 'api'` 远程数据（支持 `dictCode` 字典和 `entityKey` 实体）
- **条件可见**：`visibleWhen: (formData) => formData.xxx === 'value'`
- **校验规则**：`required` / `min` / `max` / `rules: FormItemRule[]`
- **显示控制**：`hideOnCreate` / `hideOnEdit` / `readonly` / `disabled` / `disabledOnEdit`

### 字段类型与后端对齐

| field_type | 说明     | 特殊配置                     |
| ---------- | -------- | ---------------------------- |
| `input`    | 文本输入 | —                            |
| `number`   | 数值     | `min` / `max`                |
| `textarea` | 多行文本 | —                            |
| `select`   | 下拉选择 | `select_entity_key`          |
| `dict`     | 字典选择 | `dict_code`                  |
| `date`     | 日期     | —                            |
| `datetime` | 日期时间 | —                            |
| `switch`   | 开关     | —                            |
| `file`     | 文件     | 自动关联 fileInfo            |
| `by`       | 审计人   | 展示 createUser / updateUser |
| `user`     | 用户选择 | —                            |

## 实体模块清单

当前已注册的实体模块（位于 `src/features/entities/`）：

| 模块                            | 说明          |
| ------------------------------- | ------------- |
| `chatRule`                      | AI 聊天规则   |
| `chatCategory`                  | AI 聊天分类   |
| `chatPrompt`                    | AI 聊天提示词 |
| `chatKnowledge`                 | AI 知识库     |
| `chatQuestion`                  | AI 聊天问题   |
| `chatConversationLog`           | AI 对话日志   |
| `meetingSession`                | 会议会话      |
| `meetingParticipant`            | 会议参与者    |
| `meetingSummary`                | 会议摘要      |
| `meetingTranscript`             | 会议转录      |
| `user`                          | 用户管理      |
| `role`                          | 角色管理      |
| `dept`                          | 部门管理      |
| `post`                          | 岗位管理      |
| `menu`                          | 菜单管理      |
| `dict` / `dictData`             | 字典管理      |
| `config`                        | 系统配置      |
| `notice`                        | 通知公告      |
| `fileInfo`                      | 文件管理      |
| `job` / `jobLog`                | 定时任务      |
| `operLog` / `loginLog`          | 操作/登录日志 |
| `fieldConfig`                   | 字段配置      |
| `projectConfig` / `projectType` | 项目配置      |
| `print-config`                  | 打印配置      |
| `wx-*`                          | 微信相关实体  |

## 核心页面

| 路由                    | 说明                               |
| ----------------------- | ---------------------------------- |
| `/`                     | 首页（Hero + 时间轴）              |
| `/login`                | 登录/注册（入场动画）              |
| `/multiview/:entityKey` | 通用实体页面                       |
| `/entity`               | 实体配置管理                       |
| `/fileInfo`             | 文件管理                           |
| `/external-meeting`     | 外部会议（LiveKit 音视频）         |
| `/meeting-assistant`    | 会议助手                           |
| `/tool/gen`             | 代码生成器                         |
| `/tool/build`           | 表单构建器                         |
| `/tool/swagger`         | 接口文档                           |
| `/monitor/*`            | 监控（缓存/Druid/在线用户/服务器） |

## 关键文档

- [docs/framework-overview.md](docs/framework-overview.md) — 框架总览
- [docs/entity-system.md](docs/entity-system.md) — 实体系统说明
- [docs/dict-system.md](docs/dict-system.md) — 字典系统说明
- [docs/entity-module-template.md](docs/entity-module-template.md) — 实体模块模板
- [AGENTS.md](AGENTS.md) — 仓库开发上下文与约定

## 开发约定

- 所有可见文案都要支持国际化（`zh-CN` / `en-US` / `zh-TW`）
- 所有主题颜色统一走 CSS 变量（`--color-*`）
- 新需求优先考虑走动态实体配置，而不是手写一套 CRUD
- 表单字段、表格列、筛选项尽量与 `field_config` 保持一致
- 前后端字段类型、字典编码、关联实体必须严格对齐
- 实体模块通过 `createEntityModule` 工厂函数创建，由 `registry.ts` 自动收集
- 表单提交前统一走 `useFormValidation` 校验
- 组件命名采用 `kebab-case`，文件夹与组件同名

## 相关仓库

- 当前仓库：前端 `xiaoheDOM`
- 配套后端：`sprintboot` 多模块 Spring Boot 工程
