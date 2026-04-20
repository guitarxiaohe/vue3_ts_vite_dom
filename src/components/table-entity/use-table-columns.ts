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

  // 组装 tableColumns（含可选选择列）
  async function initColumns() {
    try {
      if (props.columns?.length) {
        const wrapped = applyColumnSlots(
          props.columns.map((c) => ({ ...c })),
          slots
        );
        tableColumns.value = props.selectable
          ? [selectionColumn.value, ...wrapped]
          : wrapped;
        return;
      }
      if (!props?.entityKey) {
        console.warn('请提供 entityKey 或 columns');
        return;
      }
      tableLoading.value = true;
      const list = await getByEntityKeyAndFieldKeyApi(props.entityKey || '');
      const responseData = list?.data || [];

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
        const wrapped = applyColumnSlots(columns, slots);
        tableColumns.value = props.selectable
          ? [selectionColumn.value, ...wrapped]
          : wrapped;
      }
    } catch (error) {
      console.error('Failed to load field config:', error);
    } finally {
      tableLoading.value = false;
    }
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

  return { tableColumns, initColumns };
}
