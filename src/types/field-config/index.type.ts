import type { PaginationParams } from '@/types/api';

/******************************** 字段配置 ********************************/

// 字段配置实体
export interface FieldConfig {
  id?: number;
  entityKey?: string;
  fieldKey?: string;
  fieldName?: string;
  fieldType?: string | null;
  fieldRole?: string | null;
  dictCode?: string | null;
  selectEntityKey?: string | null;
  sort?: number;
  isFuzzySearch?: number;
  isVisible?: number;
  createdBy?: number | null;
  createdTime?: number | null;
  updatedBy?: number | null;
  updatedTime?: number | null;
  fixed?: 'left' | 'right' | null;
}

// 字段配置列表查询参数
export interface FieldConfigQuery
  extends Partial<
      Pick<
        FieldConfig,
        | 'entityKey'
        | 'fieldKey'
        | 'fieldName'
        | 'fieldType'
        | 'fieldRole'
        | 'dictCode'
        | 'selectEntityKey'
        | 'fixed'
      >
    >,
    Partial<PaginationParams> {
  pageNum?: number;
  pageSize?: number;
}
