import type { TableDataFetcher, TableEntlty } from '../index.type';

/******************************** 数据源判断 ********************************/

// 判断 props.data 是否为异步拉取函数
export function isDataFetcher(d: TableEntlty['data']): d is TableDataFetcher {
  return typeof d === 'function';
}

// 是否走 entityKey + getListByEntityKeyApi（无函数 data、无静态数组）
export function shouldUseEntityListApi(props: {
  entityKey?: string;
  data?: TableEntlty['data'];
}): boolean {
  const key = props.entityKey?.trim();
  if (!key) return false;
  if (isDataFetcher(props.data)) return false;
  if (Array.isArray(props.data)) return false;
  return true;
}
