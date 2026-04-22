import type { ColumnsItem, TableListQuery } from '@/components/table-entity/index.type';

export interface AsyncSelectColumn {
  prop: string;
  label: string;
  width?: number | string;
  minWidth?: number | string;
}

export interface AsyncSelectFetchParams {
  keyword?: string;
  page: number;
  pageSize: number;
}

export interface AsyncSelectFetchResult {
  items: Record<string, any>[];
  total: number;
}

export interface AsyncSelectEntityFetchResult {
  rows: Record<string, any>[];
  total: number;
}

export interface AsyncSelectEntityConfig {
  entityKey: string;
  columns?: ColumnsItem[];
  dataParams?: Record<string, string | number | boolean | undefined>;
  queryKey?: string | string[];
  pageSize?: number;
  loadByValues?: (
    values: Array<string | number>
  ) => Promise<Record<string, any>[]>;
  fetcher?: (
    query: TableListQuery & { keyword?: string }
  ) => Promise<AsyncSelectEntityFetchResult>;
}

export type SelectVal = string | number | null | (string | number)[];
