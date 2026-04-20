import type { Column } from 'element-plus';

// ── Column 类型 ──────────────────────────────────────────────────────────

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

/**
 * 扩展 ElTableV2 的 Column 类型，添加自定义属性
 */
export interface ColumnsItem extends Column {
  select?: SelectColumns;
  isSearch?: boolean;
}

// ── 组件 Props 类型 ──────────────────────────────────────────────────────

export type TableEntlty = {
  dataUrl?: string;
  entityKey?: string;
  /** 表格数据 */
  data: Record<string, any>[];
  /** 列配置 */
  columns: ColumnsItem[];
  /** 表格高度，默认 400 */
  height?: number;
  /** 表格宽度 */
  width?: number;
  /** 是否启用选择列（复选框 / 单选） */
  selectable?: boolean;
  /** 多选还是单选，默认 true（多选） */
  multiple?: boolean;
  /** 行数据唯一标识字段，默认 'id' */
  rowKey?: string;
  /** 已选中的 key 值（支持 v-model:selectedKeys） */
  selectedKeys?: any[];
  /** 数据总条数（用于分页） */
  total?: number;
  /** 每页条数，默认 20 */
  pageSize?: number;
  /** 当前页码（支持 v-model:currentPage） */
  currentPage?: number;
  /** 是否显示分页，默认 false */
  showPagination?: boolean;
};
