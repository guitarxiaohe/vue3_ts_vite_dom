import { ref, watch, type ComputedRef, type Ref } from 'vue';
import type { Slots } from 'vue';
import { getByEntityKeyAndFieldKeyApi } from '@/api/modules/user';
import { isEmptyValue, snakeToCamel } from '@/utils/value';
import type { ColumnsItem, TableEntlty } from './index.type';
import { fontWidth, normalizeColumnFixed } from './column-utils';
import { applyColumnSlots } from './column-slots';

/******************************** 列配置加载与插槽合并 ********************************/

// props.columns 优先；否则按 entityKey 拉字段配置并合并 `{dataKey}Col` 插槽
export function useTableColumns(
  props: TableEntlty,
  slots: Slots,
  tableLoading: Ref<boolean>,
  selectionColumn: ComputedRef<ColumnsItem>
) {
  const tableColumns = ref<ColumnsItem[]>([]);
  const businessColumns = ref<ColumnsItem[]>([]);
  const fieldConfigRows = ref<Record<string, any>[]>([]);

  // 组装业务列并合并插槽
  function buildBusinessColumns(columns: ColumnsItem[]) {
    return applyColumnSlots(columns.map((c) => ({ ...c })), slots);
  }

  // 组装 tableColumns（含可选选择列）
  function setTableColumns(columns: ColumnsItem[]) {
    businessColumns.value = columns;
    tableColumns.value = props.selectable
      ? [selectionColumn.value, ...columns]
      : columns;
  }

  // 初始化列配置
  async function initColumns() {
    try {
      if (props.columns?.length) {
        fieldConfigRows.value = [];
        setTableColumns(buildBusinessColumns(props.columns));
        return;
      }
      if (!props?.entityKey) {
        console.warn('请提供 entityKey 或 columns');
        return;
      }
      tableLoading.value = true;
      const list = await getByEntityKeyAndFieldKeyApi(props.entityKey || '');
      const responseData: Record<string, any>[] = Array.isArray(list?.data)
        ? list.data
        : [];
      fieldConfigRows.value = Array.isArray(responseData) ? responseData : [];

      if (!isEmptyValue(responseData)) {
        const columns = responseData.map(
          (col): ColumnsItem => ({
            width: col.width ? col.width : (fontWidth(col.fieldName) ?? 150),
            title: col.fieldName ?? '--',
            key: col.id ?? '--',
            dataKey: snakeToCamel(col.fieldKey ?? '--'),
            fixed: normalizeColumnFixed(col.fixed),
          })
        );
        setTableColumns(buildBusinessColumns(columns));
        return;
      }

      setTableColumns([]);
    } catch (error) {
      console.error('Failed to load field config:', error);
    } finally {
      tableLoading.value = false;
    }
  }

  // 重新拉取列配置
  async function reloadColumns() {
    await initColumns();
  }

  watch(
    () => props.columns,
    () => {
      if (props.columns?.length) void initColumns();
    },
    { deep: true }
  );

  watch(
    () => props.entityKey,
    () => {
      if (!props.columns?.length && props.entityKey) void initColumns();
    }
  );

  return {
    tableColumns,
    businessColumns,
    fieldConfigRows,
    initColumns,
    reloadColumns,
  };
}
