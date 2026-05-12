# 实体系统 — EntityModule + field_config 快速开发指南

## 概述

实体系统是框架的核心，通过后端 `entity_config` + `field_config` 两张元数据表驱动前端通用页面渲染，实现"配置即页面"。

---

## 1. EntityModule 注册

### 最小配置

```typescript
// features/entities/dept/module.ts
import { defineAsyncComponent } from 'vue';
import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

const entityModule = createEntityModule({
  entityKey: 'dept',
  formComponent: defineAsyncComponent(() => import('./form/index.vue')),
  config: {
    title: '部门管理',
    table: { rowKey: 'deptId', height: 560 },
  },
});

export default entityModule;
```

### 完整配置

```typescript
const entityModule = createEntityModule({
  entityKey: 'user',

  // 表单组件 (可选，不提供则无新增/编辑)
  formComponent: defineAsyncComponent(() => import('./form/index.vue')),

  // 行内操作
  rowActions: {
    actionColumnWidth: 220,
    customButtons: [
      {
        key: 'resetPassword',
        label: '重置密码',
        order: 40,
        component: defineAsyncComponent(
          () => import('./row-actions/reset-button.vue')
        ),
      },
    ],
  },

  config: {
    title: '用户管理',
    // 按钮开关
    actions: {
      showCreate: true,
      showEdit: true,
      showCopy: true,
      showDelete: true,
    },
    // 筛选字段
    filters: {
      fields: {
        userName: {
          key: 'userName',
          label: '用户名',
          component: 'input',
          placeholder: '请输入用户名',
          order: 1,
        },
        status: {
          key: 'status',
          label: '状态',
          component: 'select',
          options: [
            { label: '启用', value: '0' },
            { label: '停用', value: '1' },
          ],
          order: 2,
        },
      },
    },
    // 表格配置
    table: {
      rowKey: 'userId',
      height: 520,
      pageSize: 20,
      defaultSort: { field: 'userId', order: 'asc' },
      showColumnSettings: true,
      // 子表 (主子表关系)
      children: [
        {
          label: '关联数据',
          entityKey: 'childEntity',
          relationField: { parentKey: 'userId', childKey: 'userId' },
          rowKey: 'childId',
        },
      ],
    },
    // 详情抽屉
    detail: { title: '用户详情', width: '42%', visibleCount: 8 },
  },
});
```

---

## 2. 自动注册机制

`src/features/entities/registry.ts` 通过 Vite 的 `import.meta.glob` 自动扫描：

```
import.meta.glob('./**/module.ts', { eager: true })
```

**约定：** 目录名 = entityKey，文件路径为 `features/entities/<entityKey>/module.ts`。

**无需手动注册路由** — 新增实体模块文件后，访问 `/multiview/<entityKey>` 即可。

---

## 3. 表单开发

### 方式 A: GenericEntityForm (推荐，零代码)

```vue
<script setup lang="ts">
import GenericEntityForm from '@/features/entities/_shared/generic-entity-form.vue';
import type {
  EntityFormProps,
  EntityFormEmits,
} from '@/features/entities/_shared/types';

const props = defineProps<EntityFormProps>();
const emit = defineEmits<EntityFormEmits>();
</script>

<template>
  <GenericEntityForm
    :visible="props.visible"
    :is-create="props.isCreate"
    :record="props.record"
    entity-key="dept"
    @update:visible="emit('update:visible', $event)"
    @save="emit('save')"
    @cancel="emit('cancel')"
  />
</template>
```

GenericEntityForm 自动：

- 读取 `/system/fieldConfig/listByEntityKey/{entityKey}` 获取字段定义
- 根据 `field_type` 渲染对应的表单控件 (input/select/switch/date/...)
- 校验必填字段
- 提交到通用 API

### 方式 B: 自定义表单 (dict 表单示例)

见 `features/entities/dict/form/index.vue` — 主表+子表 bundle 表单模式。

---

## 4. 筛选字段配置

### 后端 field_config 驱动的筛选

筛选字段由 `resolveBackendFilterFields()` 自动从 `field_config` 解析：

- `is_fuzzy_search = 1` 的字段自动出现在筛选区
- `field_type='dict'` + `dict_code` → AsyncSelect (字典数据)
- `field_type='select'` + `select_entity_key` → AsyncSelect (关联实体)
- `field_type='date'/'datetime'` → 日期选择器

### 静态筛选配置 (EntityModule 中硬编码)

```typescript
filters: {
  fields: {
    userName: { key: 'userName', label: '用户名', component: 'input', order: 1 },
    status:   { key: 'status', label: '状态', component: 'select', options: [...], order: 2 },
  },
}
```

### 组件类型

| component           | 渲染             | 使用场景     |
| ------------------- | ---------------- | ------------ |
| `input`             | el-input         | 文本搜索     |
| `select`            | el-select (静态) | 固定选项     |
| `async-select`      | AsyncSelect      | 关联实体数据 |
| `date` / `datetime` | el-date-picker   | 日期范围     |
| `custom`            | 自定义组件       | 特殊渲染     |

---

## 5. 表格列配置

### field_config 自动列

`mapFieldConfigRowsToColumns()` 将后端 `field_config` 行转换为 `ColumnsItem[]`：

| field_type          | 表格渲染                        |
| ------------------- | ------------------------------- |
| `input/text/number` | 文本 (datetime 自动格式化)      |
| `dict`              | 字典标签 + tag_color 彩色 badge |
| `select`            | 选项标签 (options / dictCode)   |
| `date`              | 日期格式化 (YYYY-MM-DD)         |
| `datetime`          | 日期时间格式化                  |
| `switch`            | 文本 ('0'/'1')                  |
| `by`                | 用户头像+姓名 (UserCell)        |
| `file`              | 文件信息 (FileCell)             |

### 硬编码列

```typescript
table: {
  useFieldConfig: false,  // 不使用后端 field_config
  columns: [
    { key: 'id', dataKey: 'id', title: 'ID', width: 80 },
    { key: 'name', dataKey: 'name', title: '名称', width: 200 },
  ],
}
```

---

## 6. 现有实体清单

| entityKey   | 标题       | 表单 | 说明                |
| ----------- | ---------- | :--: | ------------------- |
| user        | 用户管理   |  ✓   | 自定义表单+重置密码 |
| dept        | 部门管理   |  ✓   | GenericEntityForm   |
| role        | 角色管理   |  ✓   | GenericEntityForm   |
| menu        | 菜单管理   |  ✓   | 自定义表单          |
| dict        | 字典类型   |  ✓   | 自定义表单+子表     |
| dictData    | 字典值管理 |  ✓   | GenericEntityForm   |
| config      | 参数配置   |  ✓   | GenericEntityForm   |
| job         | 定时任务   |  ✓   | GenericEntityForm   |
| notice      | 通知公告   |  ✓   | GenericEntityForm   |
| post        | 岗位管理   |  ✓   | GenericEntityForm   |
| fieldConfig | 字段配置   |  ✓   | 自定义表单          |
| fileInfo    | 文件管理   |  ✓   | 自定义表单+下载按钮 |
| operLog     | 操作日志   |  ✗   | 只读列表            |
| loginLog    | 登录日志   |  ✗   | 只读列表            |
| jobLog      | 任务日志   |  ✗   | 只读列表            |
