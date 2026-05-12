# 字典系统

## 数据库结构

```sql
sys_dict_type        -- 字典类型
  dict_id    BIGINT   PK
  dict_name  VARCHAR  -- 字典名称
  dict_type  VARCHAR  -- 唯一标识 (如 sys_normal_disable)
  status     CHAR     -- 0=正常 1=停用

sys_dict_data        -- 字典值
  dict_code  BIGINT   PK
  dict_sort  INT      -- 排序
  dict_label VARCHAR  -- 显示标签 (如 "正常")
  dict_value VARCHAR  -- 实际值 (如 "0")
  dict_type  VARCHAR  -- FK → sys_dict_type.dict_type
  color      VARCHAR  -- 标签颜色 (字段名 tag_color，JSON key: color)
  status     CHAR     -- 0=正常 1=停用
```

---

## 后端 API

| 端点                            | 方法   | 说明                          |
| ------------------------------- | ------ | ----------------------------- |
| `/system/dict/data/list`        | GET    | 分页列表 (支持 dictType 筛选) |
| `/system/dict/data`             | POST   | 新增                          |
| `/system/dict/data`             | PUT    | 修改                          |
| `/system/dict/data/{dictCodes}` | DELETE | 批量删除                      |
| `/system/dict/type/list`        | GET    | 字典类型列表                  |

### 前端全量加载

```typescript
// src/api/modules/dict.ts
export async function fetchAllDictData(): Promise<DictDataItem[]> {
  return httpClient.get('/system/dict/data/list', {
    pageNum: 1,
    pageSize: 9999, // 一次性加载全部
  });
}
```

---

## 前端缓存机制

### 全局缓存 (TanStack Query)

```typescript
// src/composables/use-dict-data.ts
export function useAllDictDataQuery(enabled = true) {
  return useQuery({
    queryKey: ['system', 'dict', 'data', 'all'],
    queryFn: fetchAllDictData,
    staleTime: 30 * 60 * 1000, // 30 分钟缓存
    gcTime: 60 * 60 * 1000, // 60 分钟回收
  });
}
```

### 缓存预热

`MultiviewShell` (通用实体列表页) 在 setup 中调用 `useAllDictDataQuery()`，确保访问任何实体页面时字典缓存已填充。

### 缓存读取

`dict-fetcher` 和 `use-table-columns` 通过 `queryClient.getQueryData(DICT_DATA_ALL_QUERY_KEY)` 同步读取缓存。

---

## 字典数据消费场景

### 1. 筛选区 — dict 字段

当 `field_config.field_type = 'dict'` 且 `dict_code` 有值时：

```
resolve-entity-filters.ts
  → dict-code-async-select 注册规则
  → 创建 AsyncSelect
  → entityConfig.fetcher = createDictDataFetcher(dictCode)
  → 从缓存中按 dictType 过滤 + 搜索 + 分页
```

### 2. 表单 — dict 字段

```
form-field-adapter.ts
  → apiOptions.dictCode → createDictDataFetcher(dictCode)
  → AsyncSelect 组件 → valueKey='dictValue', labelKey='dictLabel'
```

### 3. 表格 — dict 列渲染

```
use-table-columns.ts
  → resolveDictLabel(field, cellData)
    1. 静态 options 匹配
    2. dictCode → 查缓存匹配 dictValue → 返回 dictLabel
  → resolveDictColor(field, cellData)
    → 查缓存匹配 → 返回 color (tag_color)
  → 有色值 → 渲染彩色 badge
```

### 4. DictTag 组件

```vue
<DictTag dict-type="sys_normal_disable" :value="row.status" />
<!-- 渲染: <span class="dict-tag--colored" style="background:#409eff">正常</span> -->
```

---

## 颜色系统

### 数据来源

数据库中 `tag_color` 字段（JSON 传输 key 为 `color`）存储颜色 hex 值。

### 常用颜色

| 语义 | Hex       | 场景              |
| ---- | --------- | ----------------- |
| 蓝色 | `#409eff` | 正常/显示/是/系统 |
| 红色 | `#f56c6c` | 停用/隐藏/否      |
| 绿色 | `#67c23a` | 成功/公告         |
| 橙色 | `#e6a23c` | 警告/通知         |
| 灰色 | `#909399` | 未知/默认         |

### 表单颜色选择

字典表单 (dict-item-table) 内置 5 个预设颜色：

| 颜色 | Hex       |
| ---- | --------- |
| 绿色 | `#b7ebc2` |
| 红色 | `#ffccc7` |
| 橙色 | `#ffe58f` |
| 蓝色 | `#91d5ff` |
| 紫色 | `#d3adf7` |

---

## 相关文件

| 文件                                                           | 职责                                      |
| -------------------------------------------------------------- | ----------------------------------------- |
| `src/composables/use-dict-data.ts`                             | TanStack Query 全量查询                   |
| `src/utils/dict-fetcher.ts`                                    | 按 dictType 过滤+搜索+分页的 fetcher 工厂 |
| `src/api/modules/dict.ts`                                      | 字典 API 调用                             |
| `src/api/query-client.ts`                                      | 全局 QueryClient 导出                     |
| `src/components/dict-tag/index.vue`                            | DictTag 组件 (带颜色渲染)                 |
| `src/components/table-entity/composables/use-table-columns.ts` | resolveDictLabel / resolveDictColor       |
| `src/features/entities/_shared/resolve-entity-filters.ts`      | 筛选区 dict 字段解析                      |
| `src/features/entities/_shared/form-field-adapter.ts`          | 表单 dict 字段适配                        |
| `src/features/entities/dict/`                                  | 字典管理 EntityModule                     |
| `src/features/entities/dictData/`                              | 字典值管理 EntityModule                   |

### 后端

| 文件                         | 职责                                   |
| ---------------------------- | -------------------------------------- |
| `SysDictData.java`           | 字典值 Domain (color 字段 → tag_color) |
| `SysDictDataMapper.xml`      | MyBatis CRUD                           |
| `SysDictDataController.java` | REST API                               |
