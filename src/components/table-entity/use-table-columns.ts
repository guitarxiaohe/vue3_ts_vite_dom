import { h, ref, watch, type ComputedRef, type Ref } from 'vue';
import type { Slots } from 'vue';
import { getByEntityKeyAndFieldKeyApi } from '@/api/modules/user';
import { isEmptyValue, snakeToCamel } from '@/utils/value';
import type { ColumnsItem, TableEntlty } from './index.type';
import { fontWidth, normalizeColumnFixed } from './column-utils';
import { applyColumnSlots } from './column-slots';
import CellAvatar from './cells/cell-avatar.vue';

/******************************** 列配置加载与插槽合并 ********************************/

// 兼容字段配置的 camelCase 与 snake_case
function resolveFieldValue(field: Record<string, any>, camelKey: string) {
  return field[camelKey];
}

// 规范化日期时间文案 时间戳转 YYYY-MM-DD HH:MM:SS
function formatDateTimeText(value: unknown, isDateOnly = false) {
  if (value == null || value === '') return '--';
  const text = String(value).trim();
  if (!text) return '--';

  // 解析为合法时间戳（支持字符串和数字）
  let date: Date;
  if (/^\d+$/.test(text)) {
    date = new Date(Number(text));
  } else {
    date = new Date(text);
  }
  if (isNaN(date.getTime())) return '--';

  const pad = (n: number) => String(n).padStart(2, '0');
  const Y = date.getFullYear();
  const M = pad(date.getMonth() + 1);
  const D = pad(date.getDate());
  if (isDateOnly) {
    return `${Y}-${M}-${D}`;
  }
  const h = pad(date.getHours());
  const m = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${Y}-${M}-${D} ${h}:${m}:${s}`;
}

// 解析字典选项文案
function resolveDictLabel(
  field: Record<string, any>,
  value: unknown
): string | undefined {
  if (value == null || value === '') return undefined;
  const options = field.options;
  if (!Array.isArray(options)) return undefined;

  const matched = options.find((item) => {
    if (!item || typeof item !== 'object') return false;
    return String((item as Record<string, any>).value) === String(value);
  }) as Record<string, any> | undefined;

  if (!matched) return undefined;
  return String(matched.label ?? value);
}

// 根据字段类型解析单元格渲染器
function resolveCellRendererByFieldType(field: Record<string, any>) {
  const fieldType = String(
    resolveFieldValue(field, 'fieldType') ?? ''
  ).toLowerCase();

  console.log(field.dictCode, field.selectEntityKey);
  if (fieldType === 'dict') {
    return ({
      rowData,
      cellData,
    }: {
      rowData: Record<string, any>;
      cellData: string | number | null;
    }) =>
      h(CellAvatar, {
        row: rowData,
        value: cellData,
      });
  }

  if (fieldType === 'by') {
    return ({
      rowData,
      cellData,
    }: {
      rowData: Record<string, any>;
      cellData: unknown;
    }) =>
      h(CellAvatar, {
        ...rowData.createUser,
        row: rowData,
        value: cellData,
      });
  }

  if (
    fieldType === 'text' ||
    fieldType === 'input' ||
    fieldType === 'textarea'
  ) {
    return ({ cellData }: { cellData: unknown }) =>
      h(
        'span',
        {},
        cellData == null || cellData === '' ? '--' : String(cellData)
      );
  }

  if (fieldType === 'date') {
    return ({ cellData }: { cellData: unknown }) =>
      h('span', {}, formatDateTimeText(cellData, true));
  }

  if (fieldType === 'datetime') {
    return ({ cellData }: { cellData: unknown }) =>
      h('span', {}, formatDateTimeText(cellData));
  }

  if (fieldType === 'dict' || fieldType === 'select') {
    return ({ cellData }: { cellData: unknown }) =>
      h(
        'span',
        {},
        resolveDictLabel(field, cellData) ?? String(cellData ?? '--')
      );
  }

  return ({ cellData }: { cellData: unknown }) =>
    h('div', '未找到对应类型 =>' + fieldType);
}

// 将字段配置转换为表格列
export function mapFieldConfigRowsToColumns(rows: Record<string, any>[]) {
  return rows.map(
    (col): ColumnsItem => ({
      width: col.width
        ? col.width
        : (fontWidth(resolveFieldValue(col, 'fieldName')) ?? 150),
      title: resolveFieldValue(col, 'fieldName') ?? '--',
      key: col.id ?? '--',
      dataKey: snakeToCamel(resolveFieldValue(col, 'fieldKey') ?? '--'),
      fixed: normalizeColumnFixed(resolveFieldValue(col, 'fixed')),
      cellRenderer: resolveCellRendererByFieldType(col),
    })
  );
}

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
    return applyColumnSlots(
      columns.map((c) => ({ ...c })),
      slots
    );
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
        fieldConfigRows.value = Array.isArray(props.fieldConfigRows)
          ? [...props.fieldConfigRows]
          : [];
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
        const columns = mapFieldConfigRowsToColumns(responseData);
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
    () => props.fieldConfigRows,
    () => {
      if (props.columns?.length) {
        fieldConfigRows.value = Array.isArray(props.fieldConfigRows)
          ? [...props.fieldConfigRows]
          : [];
      }
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
