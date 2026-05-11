---
name: entity-framework
description: 在当前仓库中新增实体模块、配置筛选字段、注册行操作按钮、编写自定义表单或理解配置化渲染链路时使用。本技能涵盖 EntityModule 注册、TableEntity 通用表格、MultiviewShell 通用页面、FormDrawer 表单抽屉等核心架构组件。
metadata:
  short-description: 配置化实体框架开发指南
---

# xiaoheDOM 配置化实体框架

本 Skill 指导在本项目中进行有效的代码编写。请先阅读根目录的 `AGENTS.md` 获取整体框架，再参照此文件进行具体开发。

---

## 1. 核心理念：配置化快速开发

本框架最核心的设计是：**无需为每个业务模块手写表格列定义和数据接口**，所有列表页共用一套通用渲染链路。

### 核心渲染链路

```
后端 field_config 表
  ↓ GET /system/fieldConfig/listByEntityKey/{entityKey}
前端 MultiviewShell
  ↓ 接收 fieldConfigRows （字段配置列表）
    ↓
  mapFieldConfigRowsToColumns() → 转成 ColumnsItem[]
    ↓
  TableEntity 根据配置自动渲染表格
    ↓
  所有数据通过通用接口 getListByEntityKeyApi() 获取
    ↓
  筛选条件从 field_config.field_type + isFuzzySearch 自动推断
    ↓
  详情 drawer 也由同一份 field_config 驱动
```

**这意味着：** 新增一个业务模块，前端几乎不需要写代码，只需在后端配好 `entity_config` + `field_config`，然后注册一个 `EntityModule`（有时连表单都能自动生成）。

### TableEntity 包装了哪些配置

| 配置项 | 说明 | 来源 |
|--------|------|------|
| 表格列 | 字段名/类型/宽度的列定义 | `field_config` 自动转 `ColumnsItem[]` |
| 筛选条件 | 根据 field_type 推断渲染 input/select/date/dict 等 | `resolveBackendFilterFields()` |
| 翻页 | pageNum/pageSize 自动管理和同步 | `TableEntity` 内置 |
| 排序 | 时间字段默认可排序、列拖拽排序持久化 | 后端 `fieldConfig/sort` |
| 列显隐 | 工具栏控制列显隐 + 设置持久化 | `TableEntity` 内置 |
| 数据接口 | 统一走 `getListByEntityKeyApi` | `MultiviewShell` 的 `fetchTableData` |
| 操作人填充 | 通过 `field_role` 识别 createUser/updateUser | 后端 `enrichDynamicRows` |
| 文件信息 | 自动关联 SysFileInfo 填充 `{fieldKey}Info` | 后端 `attachFileInfos` |
| 行操作 | 查看/编辑/复制/删除 + 自定义按钮 | `EntityModule.rowActions` |

**这就是你所说的本质上这个框架后端就是做了一层数据字段描述（field_config），前端做了一层消费渲染（MultiviewShell + TableEntity），两端通过一套通用接口把所有实体的列表页统一掉。新增实体根本不用写前端 CRUD 代码。**

## 2. 目录结构速查

```
src/
  api/modules/                       # API 接口模块
  features/
    entities/                        # 实体模块（核心！）
      <entityKey>/
        module.ts                    # 实体注册配置
        form/index.vue               # 自定义表单组件
        row-actions/*.vue            # 行内自定义操作按钮
    multiview/                       # 通用多视图页面
      components/
        multiview-shell.vue          # 核心的通用页面壳
        multiview-fuzzy-filter.vue   # 动态筛选组件
      composables/
        use-multiview-actions.ts      # 行操作按钮逻辑
    form-shell/                      # 通用表单抽屉
      components/
        form-drawer.vue              # 表单抽屉
        form-drawer-form.vue         # 自动渲染的表单
    entities/_shared/
      create-entity-module.ts        # 实体模块工厂
      resolve-entity-filters.ts      # 筛选解析
      types.ts                       # EntityModule 类型
  components/
    table-entity/                    # 通用表格组件（ElTableV2 封装）
      index.vue                      # 虚拟表格主体
      table-toolbar.vue              # 列设置工具栏
      row-detail-drawer.vue          # 行详情抽屉
      row-detail-child-table.vue     # 详情子表
      composables/
        use-table-columns.ts         # 列配置（转换 field_config → columns）
        use-table-data.ts            # 数据拉取
        use-table-selection.ts       # 选择态
        use-entity-delete.ts         # 删除逻辑
  views/
    multiview/multiview-page.vue     # 动态路由：/:entityKey → 通用页面
  utils/
    entity-config.ts                 # 实体配置读取工具
  types/
    entity-config.ts                 # EntityConfig 类型定义
```

---

## 3. 实体模块注册（核心 API）

### 3.1 使用工厂函数（推荐）

```typescript
// src/features/entities/<entityKey>/module.ts
import { defineAsyncComponent } from 'vue';
import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

const entityModule = createEntityModule({
  entityKey: 'dict',
  formComponent: defineAsyncComponent(() => import('./form/index.vue')),
  config: {
    title: '字典类型',
    actions: { showCreate: true, showImport: false },
    table: {
      rowKey: 'dictId',
      height: 560,
      defaultSort: { field: 'createdTime', order: 'desc' },
    },
    detail: { width: '70%', visibleCount: 10 },
  },
});

export default entityModule;
```

### 3.2 直接写 EntityModule（更灵活）

```typescript
import type { EntityModule } from '@/features/entities/types';

const entityModule: EntityModule = {
  entityKey: 'user',
  form: {
    component: defineAsyncComponent(() => import('./form/index.vue')),
  },
  rowActions: {
    actionColumnWidth: 220,
    customButtons: [
      {
        key: 'resetPassword',
        label: '重置密码',
        order: 40,
        component: defineAsyncComponent(() => import('./row-actions/reset-button.vue')),
      },
    ],
  },
  config: {
    entityKey: 'user',
    title: '用户管理',
    actions: { showCreate: true, showEdit: true },
    filters: {
      fields: {
        userName: {
          key: 'userName', label: '用户名', component: 'input',
          placeholder: '请输入用户名', order: 1,
        },
        status: {
          key: 'status', label: '状态', component: 'select',
          options: [{ label: '启用', value: '0' }, { label: '停用', value: '1' }],
          order: 2,
        },
      },
    },
    table: {
      rowKey: 'userId', height: 520, pageSize: 20,
      defaultSort: { field: 'userId', order: 'asc' },
      showColumnSettings: true,
    },
    detail: { title: '用户详情', width: '42%', visibleCount: 8 },
  },
};

export default entityModule;
```

### 3.3 自动注册机制

`src/features/entities/registry.ts` 通过 Vite 的 `import.meta.glob` 自动扫描所有 `features/entities/<key>/module.ts` 文件并注册。**新增实体只需按约定路径加文件**，不需要手动注册。

---

## 4. TableEntity 通用表格组件

封装了 `ElTableV2`（虚拟表格），核心能力：

| 功能 | 说明 |
|------|------|
| **数据源** | 支持 `:data`（静态数组）或 `:data`（异步函数） |
| **异步数据** | `:data="fetchFn"` 自动处理分页参数 |
| **列自动适配** | `autoFitBusinessColumns` 根据内容动态计算列宽 |
| **列设置** | 工具栏可显隐/排序/拖拽列 |
| **选择态** | 支持单选/多选，`v-model:selected-keys` 双向绑定 |
| **行操作** | `row-action-column` 注入操作列 |
| **分页** | `show-pagination` 控制显隐 |
| **详情抽屉** | `openDetail(row)` 打开行详情 |

**Props：**
```
data          — 静态数组 或 异步函数 (query: TableListQuery) => { total, rows }
dataParams    — 固定查询参数（筛选条件之外）
columns       — ColumnsItem[]（当无 field_config 时使用）
fieldConfigRows — 后端字段配置（优先）
entityKey     — 用于列排序持久化
selectable    — 是否可选
rowKey        — 行主键字段名
height        — 表格高度
showPagination — 是否显示分页
pageSize      — 每页条数
sortableColumnKeys — 可排序列
detailDrawerTitle/Width/HiddenKeys — 详情抽屉配置
detailChildren — 详情子表配置
```

---

## 5. 筛选组件（MultiviewFuzzyFilter）

筛选字段由 `EntityConfig.filters.fields` 配置驱动，支持以下类型：

| component | 渲染组件 | 说明 |
|-----------|----------|------|
| `input` | el-input | 文本输入 |
| `select` | el-select | 下拉选择（静态 options） |
| `async-select` | AsyncSelect | 异步数据源下拉 |
| `date-range` | el-date-picker | 日期范围 |
| `datetime-range` | el-date-picker type=datetimerange | 日期时间范围 |

**筛选字段配置：**
```typescript
filters: {
  fields: {
    userName: {
      key: 'userName',
      label: '用户名',
      component: 'input',
      placeholder: '请输入',
      order: 1,
      defaultValue: '',
    },
    status: {
      key: 'status',
      label: '状态',
      component: 'select',
      options: [{ label: '启用', value: '0' }],
      defaultValue: '',
    },
  },
}
```

---

## 6. Store（Pinia）规范

| Store | 文件 | 用途 |
|-------|------|------|
| system | `stores/modules/system.ts` | 主题/语言/界面模式/面包屑 |
| user | `stores/modules/user.ts` | 用户登录态/Token/权限 |
| app | `stores/modules/app.ts` | 应用全局状态（sidebar/菜单展开等） |

新增 store 的规则：
- 统一使用 `defineStore` + Composition API 风格
- 持久化用 `useStorage`（VueUse）
- 不要直接在组件内通过 `localStorage` 读写

---

## 7. API 层规范

```typescript
// src/api/modules/user.ts
import client from '@/api/client';

// 列表查询
export function listUser(query: Record<string, any>) {
  return client.get('/system/user/list', { params: query });
}

// 动态实体列表
export function getListByEntityKeyApi(entityKey: string, params: Record<string, any>) {
  return client.get(`/system/fieldConfig/listByEntityKey/${entityKey}`, { params });
}

// 动态实体字段配置
export function getByEntityKeyAndFieldKeyApi(entityKey: string) {
  return client.get(`/system/fieldConfig/getByEntityKeyAndFieldKey/${entityKey}`);
}
```

---

## 8. 表单（FormDrawer）规范

`form-drawer.vue` 是统一的表单抽屉组件，被 `multiview-page.vue` 调用。

支持的模式：
- **自动渲染表单：** 无自定义 slot 时，由 `FormDrawerForm` 根据 `fields` 配置自动渲染
- **自定义表单：** 通过 `slot name="content"` 完全自定义内容
- **子表：** 通过 `childTables` 配置在表单底部渲染关联子表
- **导航：** `showNavigation` 控制多条记录间的上一条/下一条切换

---

## 9. 行操作按钮配置

```typescript
rowActions: {
  showView?: boolean;       // 查看详情
  showEdit?: boolean;       // 编辑
  showCopy?: boolean;       // 复制
  actionColumnWidth: 180,   // 操作列宽度
  customButtons?: [
    {
      key: 'resetPassword',
      label: '重置密码',
      order: 40,  // 排序
      component: defineAsyncComponent(...),
    },
  ],
}
```

---

## 10. 国际化（i18n）

所有用户可见的文字必须支持 i18n：
```typescript
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
t('common.save');
t('dict.type.dictName');
```

语言包位置：`src/locales/{zh-CN,en-US,zh-TW}.ts`

---

## 11. 常见操作模式

### 新增实体模块的完整步骤

```
1. 建后端 entity_config + field_config（或标准 API）
2. 前端建目录：features/entities/<entityKey>/
3. 写 module.ts（注册 EntityConfig）
4. 写 form/index.vue（如需自定义表单）
5. 如有行内特殊操作：写 row-actions/xxx.vue
6. 如有筛选组件特殊渲染：注册 filter 组件
7. 添加到路由（如需要独立路由而非 /multiview/:entityKey）
8. 添加 i18n 翻译文本
9. 添加菜单数据（如果后端没有动态返回）
```

### 添加自定义 fetcher 替换默认通用查询

```typescript
config: {
  table: {
    fetcher: async (query: TableListQuery) => {
      const res = await customApi(query);
      return { total: res.data.total, rows: res.data.rows };
    },
  },
}
```

### 关闭后端字段配置（使用硬编码列）

```typescript
config: {
  table: {
    useFieldConfig: false,  // 不请求后端 field_config
    columns: [...]          // 使用硬编码的 ColumnsItem[]
  },
}
```

---

## 12. 开发注意事项

- 所有新页面/组件优先判断能不能用 `EntityModule` 方案
- 异步组件统一用 `defineAsyncComponent` 而不是直接 import
- CSS 变量 + SCSS，不要硬编码颜色值
- 新增字段类型时需同步更新：
  - `types/entity-config.ts` 中的 `EntityFormField.type` 联合类型
  - `features/form-shell/components/form-drawer-form.vue` 中的渲染分支
  - 后端 FieldConfig 的 field_type 映射
- 不要直接操作 DOM，用 VueUse
- 修改 `TableEntity` 和 `MultiviewShell` 时要测试所有实体是否正常工作
