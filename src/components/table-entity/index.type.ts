import type { Component, VNode } from 'vue';
import type { Column } from 'element-plus';
import type { EntityTableChildConfig } from '@/types/entity-config';

/******************************** 列扩展配置 ********************************/

// 列内表单控件等扩展配置
export interface SelectColumns {
  fixedType?: 'input' | 'select' | 'date' | 'switch';
  placeholder?: string;
  options?: {
    label: string;
    value: string;
  }[];
  fieldIdObj?: Record<string, string>;
  asyncOptions?: () => Promise<{ label: string; value: string }[]>;
  field?: string;
}

// 在 Element TableV2 Column 上扩展业务字段
export interface ColumnsItem extends Column {
  select?: SelectColumns;
  isSearch?: boolean;
}

export type DetailRenderContext = {
  row: Record<string, any>;
  column: ColumnsItem;
};

export type DetailRenderResult = VNode | Component;

export type DetailRenderMap = Record<
  string,
  (context: DetailRenderContext) => DetailRenderResult
>;

/******************************** 列表与数据 ********************************/

// 分页 + 与 dataParams 合并后的查询对象
export type TableListQuery = {
  pageNum: number;
  pageSize: number;
} & Record<string, string | number | boolean | undefined>;

// 父组件自定义拉表：返回若依风格 { total, rows }
export type TableDataFetcher = (
  query: TableListQuery
) => Promise<{ total: number; rows: Record<string, any>[] }>;

/******************************** 列插槽作用域 ********************************/

// 插槽名：`{dataKey}Col`，与列 dataKey 对应
export type TableEntityColSlotProps = {
  row: Record<string, any>;
  // 当前格取值，等价 row[dataKey]
  value: unknown;
  cellData: unknown;
  column: ColumnsItem;
  rowIndex: number;
};

/******************************** 组件 Props ********************************/

export type TableEntlty = {
  // 实体键：无 columns 时拉列配置；无自定义 data 时走列表接口；内置删除依赖
  entityKey?: string;
  // 预加载字段配置：与 columns 搭配时复用排序元数据，避免重复拉取
  fieldConfigRows?: Record<string, any>[];
  // 列表查询附加参数，并入分页请求
  dataParams?: Record<string, string | number | boolean | undefined>;
  // 数据：函数优先，其次静态数组，否则 entityKey + getList
  data?: Record<string, any>[] | TableDataFetcher;
  columns?: ColumnsItem[];
  height?: number;
  width?: number;
  selectable?: boolean;
  multiple?: boolean;
  rowKey?: string;
  selectedKeys?: any[];
  total?: number;
  pageSize?: number;
  currentPage?: number;
  showPagination?: boolean;
  // 行尾操作列由外部注入，表格不内置业务按钮
  rowActionColumn?: ColumnsItem;
  // 列设置入口与前端显隐态
  showColumnSettings?: boolean;
  hiddenColumnKeys?: string[];
  detailDrawerTitle?: string;
  detailDrawerWidth?: string | number;
  detailRenderMap?: DetailRenderMap;
  detailVisibleCount?: number;
  detailHiddenKeys?: string[];
  detailChildren?: EntityTableChildConfig[];
  sortableColumnKeys?: string[];
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
};

/******************************** 顶部工具区 ********************************/

// 顶部工具区列设置项
export type TableColumnSettingItem = {
  key: string;
  dataKey: string;
  title: string;
};

// 顶部工具区列拖拽排序结果
export type TableColumnReorderPayload = {
  columnKey: string;
  oldIndex: number;
  newIndex: number;
  orderedKeys: string[];
};
