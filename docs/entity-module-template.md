# Entity Module Template

本文档用于约定“根据数据库表生成前端实体模块”的统一模板。目标是让后续每张表都遵循相同的目录结构、模块注册方式、列表筛选、表单抽屉和详情展示协议。

## 1. 统一目标

每个数据库表默认都先落成一个 `EntityModule`，由以下五部分组成：

1. `module.ts`
2. `form/index.vue`
3. `types/<entity>/index.type.ts`
4. `api/modules/<entity>.ts`
5. `locales/*` 对应文案

如果表结构简单，优先使用“标准 CRUD 模板”；只有在出现树形结构、主子表、复合表单时，才进入扩展模板。

## 2. 查询项原则

查询项默认不再由模块里静态声明一套 `filters.fields` 来主导，而是遵循下面这套规则：

1. 后端字段配置返回原始查询字段
2. 前端根据字段配置生成基础筛选项
3. `filters` 用来注册多个组件替换规则，而不是直接硬编码整套查询表单
4. 当字段类型是 `select` / `dict` 且存在 `selectEntityKey` 时，默认替换为 `AsyncSelect`
5. 当字段类型是 `select` / `dict` 但只带静态 `options` 时，使用普通 `Select`

推荐理解方式：

- 后端负责“有哪些可查字段”
- 前端负责“这些字段该用什么组件显示”
- `filters` 负责“把某些字段替换成更合适的组件”

## 3. 标准 CRUD 模板

适用场景：

- 单表增删改查
- 列表筛选字段和表单字段基本一致
- 不需要自定义联动区域
- 不需要子表页签

推荐目录：

```text
src/features/entities/<entityKey>/
  form/
    constants.ts
    index.vue
  module.ts
```

推荐模块写法：

```ts
import { defineAsyncComponent } from 'vue';
import { createEntityModule } from '@/features/entities/_shared/create-entity-module';

const entityModule = createEntityModule({
  entityKey: 'order',
  formComponent: defineAsyncComponent(() => import('./form/index.vue')),
  rowActions: {
    actionColumnWidth: 180,
  },
  config: {
    title: '订单管理',
    actions: {
      showExport: true,
    },
    filters: [
      {
        key: 'user-select-replacer',
        fieldTypes: ['select'],
        fieldKeys: ['userId', 'deptId'],
        component: 'async-select',
        mapField: ({ field, t }) => ({
          placeholder: t('common.pleaseSelect'),
          entityConfig: {
            entityKey: String(field.selectEntityKey ?? '').trim(),
          },
        }),
      },
    ],
    table: {
      rowKey: 'orderId',
      height: 560,
      defaultSort: {
        field: 'createdTime',
        order: 'desc',
      },
    },
    detail: {
      title: '订单详情',
    },
  },
});

export default entityModule;
```

如果某个实体没有后端字段配置，才使用 `filters.fields` 作为静态兜底。

## 4. 扩展模板分类

### 4.1 树形模板

适用表：

- 菜单表
- 部门表
- 分类表

额外约定：

- 列表接口优先返回树形结构
- 表单增加父节点选择器
- `table.fetcher` 可自定义平铺数据转换
- `rowActions.showCopy` 默认关闭

现有参考：

- `src/features/entities/menu/module.ts`

### 4.2 主子表模板

适用表：

- 字典类型 + 字典值
- 主订单 + 订单明细
- 方案主表 + 配置明细

额外约定：

- 在 `config.table.children` 中声明子表
- 表单抽屉允许 `extra` 或自定义内容
- 子表通过 `relationField.parentKey/childKey` 关联

现有参考：

- `src/features/entities/dict/module.ts`
- `src/features/entities/dict/form/index.vue`

### 4.3 复合表单模板

适用表：

- 表单区域不止标准字段
- 需要自定义校验
- 需要多个卡片区块或联动表格

额外约定：

- 单独实现 `form/index.vue`
- 通过 `DetailDrawer` 的 `content` / `extra` 插槽扩展
- 自定义提交逻辑集中放在 `composables` 或 `service.ts`

现有参考：

- `src/features/entities/dict/form/index.vue`
- `src/features/entities/menu/form/index.vue`

### 4.4 文件/上传模板

适用表：

- 带图片上传
- 带附件字段
- 带下载、预览动作

额外约定：

- 字段类型走 `picture` / `fileUpload`
- 行操作增加 `download`、`preview` 等自定义按钮

现有参考：

- `src/features/entities/fileInfo/module.ts`

## 5. 表到前端模块的映射规则

当拿到数据库表结构后，按下面规则转换：

1. 表名映射 `entityKey`
2. 主键映射 `config.table.rowKey`
3. 字段注释映射列表标题、详情标题、表单标签
4. 枚举/状态字段映射筛选组件和表单 `select`/`switch`
5. 时间字段默认进入详情和列表，不默认放入新增表单
6. `createBy/createTime/updateBy/updateTime` 归类为系统字段
7. 外键字段优先通过 `filters` 组件注册替换成 `async-select` 或 `async-cascader`
8. 一对多关系优先评估是否进入 `table.children`

## 6. 推荐开发顺序

1. 先建 `types`
2. 再建 `api`
3. 再写 `module.ts`
4. 再落 `form/index.vue`
5. 最后补多语言和特殊行操作

## 7. 现阶段建议

当前仓库已经具备下面这些基础能力：

- 通用实体注册中心
- 通用实体配置读取
- 通用表单抽屉
- 通用子表展示
- 部分实体自定义表单样例

因此后续不建议“每张表单独造页面框架”，而是按下面策略推进：

1. 简单表直接走标准 CRUD 模板
2. 树表走树形模板
3. 一对多表走主子表模板
4. 复杂业务表再单独自定义表单

## 8. 下一步所需输入

要把“现在数据库的几个表”全部落成前端功能，还需要至少一项输入：

1. 表名 + 字段清单 + 主外键关系
2. 或者可访问的数据库连接信息
3. 或者后端接口文档 / Swagger

拿到这些后，就可以按这份模板批量生成模块，而不是逐张表重新设计页面结构。
