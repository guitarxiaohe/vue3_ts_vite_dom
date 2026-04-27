import type { TableListQuery } from '@/components/table-entity/index.type';

/******************************** 联级下拉类型 ********************************/

// 联级值类型
export type CascaderVal = Array<string | number>;

// 联级节点
export interface AsyncCascaderNode {
  label: string;
  value: string | number;
  leaf?: boolean;
  children?: AsyncCascaderNode[];
  raw?: Record<string, any>;
}

// 联级拉取参数
export interface AsyncCascaderFetchParams {
  level: number;
  parentValue: string | number | null;
  pathValues: CascaderVal;
}

// 联级实体拉取结果
export interface AsyncCascaderEntityFetchResult {
  rows: Record<string, any>[];
}

// 联级实体配置
export interface AsyncCascaderEntityConfig {
  entityKey: string;
  queryKey?: string | string[];
  dataParams?: Record<string, string | number | boolean | undefined>;
  parentKey?: string;
  valueKey?: string;
  labelKey?: string;
  leafKey?: string;
  childrenKey?: string;
  rootParentValue?: string | number | null;
  fetcher?: (query: TableListQuery) => Promise<AsyncCascaderEntityFetchResult>;
}
