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

export type SelectVal = string | number | null | (string | number)[];
