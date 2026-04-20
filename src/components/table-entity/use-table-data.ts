import { watch, type Ref } from 'vue';
import { getListByEntityKeyApi } from '@/api/modules/user';
import { getApiErrorText, isApiSuccess } from '@/utils/api-success';
import type { TableEntlty, TableListQuery } from './index.type';
import { isDataFetcher, shouldUseEntityListApi } from './utils';

/******************************** 类型 ********************************/

type PaginatedRowsBody = {
  total?: number;
  rows?: Record<string, any>[];
  code?: number;
  msg?: string;
  message?: string;
};

type PaginationState = {
  total: number;
  pageNum: number;
  pageSize: number;
};

/******************************** 列表数据加载 ********************************/

// 三种来源：自定义 fetcher、静态数组、entityKey + getListByEntityKeyApi
export function useTableData(
  props: TableEntlty,
  dataList: Ref<Record<string, any>[]>,
  tableLoading: Ref<boolean>,
  pagination: PaginationState
) {
  async function initData() {
    try {
      if (isDataFetcher(props.data)) {
        tableLoading.value = true;
        const query: TableListQuery = {
          pageNum: pagination.pageNum,
          pageSize: pagination.pageSize,
          ...(props.dataParams ?? {}),
        };
        const payload = await props.data(query);
        pagination.total = Number(payload.total) || 0;
        dataList.value = payload.rows ?? [];
        return;
      }

      if (Array.isArray(props.data)) {
        dataList.value = [...props.data];
        pagination.total =
          props.total != null ? Number(props.total) : props.data.length;
        return;
      }

      if (shouldUseEntityListApi(props)) {
        tableLoading.value = true;
        const query: Record<string, unknown> = {
          pageNum: pagination.pageNum,
          pageSize: pagination.pageSize,
          ...(props.dataParams ?? {}),
        };
        const result = (await getListByEntityKeyApi(
          props.entityKey!.trim(),
          query
        )) as unknown as PaginatedRowsBody;
        if (result.code != null && !isApiSuccess(result.code)) {
          throw new Error(getApiErrorText(result));
        }
        pagination.total = Number(result.total) || 0;
        dataList.value = result.rows ?? [];
      }
    } catch (e) {
      console.error('table-entity initData:', e);
    } finally {
      tableLoading.value = false;
    }
  }

  // 筛选参数变化时重拉（仅函数 data 或内置 entity 列表）
  watch(
    () => props.dataParams,
    () => {
      if (isDataFetcher(props.data) || shouldUseEntityListApi(props))
        void initData();
    },
    { deep: true }
  );

  return { initData };
}
