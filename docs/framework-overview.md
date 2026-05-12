# XiaoHe 配置化快速开发框架 — 架构总览

## 核心思想

> **建表 → 配字段 → 自动渲染列表/筛选/表单。不为每个业务表写重复的 CRUD 代码。**

框架通过两张元数据表 (`entity_config` + `field_config`) 驱动前端的通用列表页、筛选、表单、详情抽屉，实现"配置即页面"的效果。

---

## 架构分层

```
┌─────────────────────────────────────────────────────────────┐
│ 前端 (Vue 3 + TS)                                          │
│                                                             │
│  MultiviewShell  ──── 通用页面壳 (路由 /multiview/:entityKey)  │
│    ├─ MultiviewFuzzyFilter  ── 筛选区 (field_config 驱动)    │
│    ├─ TableEntity           ── 表格区 (ElTableV2 + 列配置)   │
│    ├─ FormDrawer            ── 表单抽屉 (EntityModule 注册)  │
│    └─ RowDetailDrawer       ── 详情抽屉 (field_config 驱动)  │
│                                                             │
│  EntityModule ── 实体注册 (features/entities/<key>/module.ts) │
│    ├─ form component  (自定义 / GenericEntityForm)          │
│    ├─ config           (标题/操作/筛选/表格/详情)             │
│    └─ rowActions       (行内自定义按钮)                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 后端 API                                                    │
│                                                             │
│  GET  /system/fieldConfig/listByEntityKey/{entityKey}       │
│    ├─ 无分页参数 → 返回 field_config 行（表头/筛选）          │
│    └─ 有分页参数 → 返回业务数据 rows（分页+排序+操作人）      │
│                                                             │
│  POST/PUT/DELETE /system/fieldConfig/data/{entityKey}/...   │
│    └─ 通用增删改 (根据 entity_config.table_name 动态路由)    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 元数据表 (MySQL)                                            │
│                                                             │
│  entity_config (实体 → table_name)                          │
│  field_config  (列 → field_type/dict_code/field_role/...)  │
└─────────────────────────────────────────────────────────────┘
```

---

## 新增一个业务模块的步骤

```
1. 建数据库表 (id/create_by/create_time/update_by/update_time)
2. INSERT entity_config (entity_key='xxx', table_name='xxx')
3. INSERT field_config (field_key/field_name/field_type/...)
   或: 调用存储过程 CALL generate_field_config('xiaohe') 自动生成
4. 前端注册 EntityModule: features/entities/<entityKey>/module.ts
   最小配置: createEntityModule({ entityKey: 'xxx', config: { title: 'XXX管理' } })
5. (可选) 自定义表单: form/index.vue
6. 访问 /#/multiview/<entityKey> 即可使用
```

---

## 字段类型体系 (field_type)

| 类型       | 前端渲染                | 说明                               |
| ---------- | ----------------------- | ---------------------------------- |
| `input`    | el-input                | 文本输入                           |
| `number`   | el-input-number         | 数字                               |
| `textarea` | el-input textarea       | 多行文本                           |
| `select`   | el-select / AsyncSelect | 下拉 (有 select_entity_key → 异步) |
| `dict`     | AsyncSelect + 字典缓存  | 字典下拉 (需 dict_code)            |
| `date`     | el-date-picker          | 日期                               |
| `datetime` | el-date-picker datetime | 日期时间                           |
| `switch`   | el-switch               | 开关                               |
| `file`     | file-upload             | 文件上传 (关联 SysFileInfo)        |
| `by`       | 审计人显示              | createUser/updateUser              |
| `user`     | 用户选择器              | 关联 sys_user                      |

---

## 字典系统

```
sys_dict_type (字典类型)
  ├─ dict_id, dict_name, dict_type
  └─ sys_dict_data (字典值)
       ├─ dict_code, dict_label, dict_value
       ├─ color (tag_color) — 前端渲染彩色标签
       ├─ dict_type FK → sys_dict_type.dict_type
       └─ status
```

### 字典数据流

```
1. MultiviewShell 挂载 → useAllDictDataQuery() → 全局缓存 30min
2. field_config 中 dictCode 字段 → 筛选/表单/表格 自动用 AsyncSelect + createDictDataFetcher
3. TableEntity dict 列 → resolveDictLabel() + resolveDictColor()
   ├─ 静态 options → 匹配 label
   ├─ dictCode → 查 TanStack Query 缓存
   └─ color 有值 → 渲染彩色 badge
```

---

## 独立页面 (不走通用路由)

| 路由              | 页面     | 说明                                  |
| ----------------- | -------- | ------------------------------------- |
| `/entity`         | Entity   | 字段配置管理页                        |
| `/fileInfo`       | FileInfo | 文件管理                              |
| `/monitor/server` | Server   | CPU/内存/JVM/磁盘 仪表盘              |
| `/monitor/cache`  | Cache    | Redis 信息+命令统计                   |
| `/monitor/online` | Online   | 在线用户管理                          |
| `/monitor/druid`  | Druid    | Druid 连接池监控 iframe               |
| `/tool/gen`       | Gen      | 代码生成器 (结合 field_config 知识库) |
| `/tool/build`     | Build    | 表单构建器 (三栏布局配置)             |
| `/tool/swagger`   | Swagger  | Knife4j API 文档 iframe               |

---

## 代码生成器 (强结合 field_config)

```
导入表流程:
  1. POST /tool/gen/importTable?tables=xxx
  2. 后端查询 field_config 知识库 (selectFieldConfigKnowledgeBase)
  3. 对每个列:
     有知识库匹配 → 继承 field_type/field_role/dict_code/select_entity_key
     无匹配      → fallback 列名语义推断 + DB 类型判断
  4. 插入 gen_table + gen_table_column (含 select_entity_key/field_role)

前端列编辑器:
  字段类型: input/number/textarea/select/dict/date/datetime/switch/file/by/user
  字典编码: dict 类型时 → dictType
  关联实体: select 类型时 → selectEntityKey
  字段角色: createUser/updateUser/fileInfo
```

---

## 核心文件索引

### 前端核心

| 文件                                                           | 职责                              |
| -------------------------------------------------------------- | --------------------------------- |
| `src/features/multiview/components/multiview-shell.vue`        | 通用页面壳                        |
| `src/components/table-entity/index.vue`                        | 通用表格 (ElTableV2)              |
| `src/features/entities/_shared/create-entity-module.ts`        | EntityModule 工厂                 |
| `src/features/entities/_shared/generic-entity-form.vue`        | 通用表单 (field_config 自动渲染)  |
| `src/features/entities/_shared/resolve-entity-filters.ts`      | 筛选字段解析                      |
| `src/features/entities/registry.ts`                            | EntityModule 自动扫描注册         |
| `src/components/table-entity/composables/use-table-columns.ts` | field_config → 列定义 + dict 渲染 |
| `src/utils/dict-fetcher.ts`                                    | 字典缓存异步查询器                |
| `src/api/query-client.ts`                                      | 全局 QueryClient 导出             |
| `src/router/index.ts`                                          | 路由定义                          |
| `src/components/conventional-menu/index.vue`                   | 侧边菜单 (路径规范化)             |

### 后端核心

| 文件                                | 职责                             |
| ----------------------------------- | -------------------------------- |
| `FieldConfigController.java`        | field_config CRUD + 通用列表 API |
| `DynamicEntityDataServiceImpl.java` | 动态实体查/增/改/删              |
| `SysDictDataController.java`        | 字典数据 API                     |
| `GenController.java`                | 代码生成 API                     |
| `GenUtils.java`                     | 列初始化 (field_config 知识库)   |
| `FieldConfigMapper.java/xml`        | field_config 知识库查询          |
