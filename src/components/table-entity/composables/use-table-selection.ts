import { ref, computed, h, watch, type Ref } from 'vue';
import { ElCheckbox, TableV2FixedDir } from 'element-plus';
import type { ColumnsItem, TableEntlty } from '../index.type';

/******************************** 类型 ********************************/

type EmitFn = {
  (e: 'update:selectedKeys', keys: any[]): void;
  (e: 'selection-change', rows: Record<string, any>[]): void;
};

const SEL_WIDTH = 55;

/******************************** 行选择与选择列 ********************************/

// 勾选状态、选择列渲染、行点击选择（与 dataList 联动）
export function useTableSelection(
  props: TableEntlty,
  emit: EmitFn,
  dataList: Ref<Record<string, any>[]>
) {
  const selectedKeySet = ref<Set<any>>(new Set());
  const selectedRowsMap = ref<Map<any, Record<string, any>>>(new Map());
  const hoveredIndex = ref(-1);

  // 行主键字段，缺省为 id
  const rowKeyField = () => props.rowKey ?? 'id';

  watch(
    () => props.selectedKeys,
    (keys) => {
      selectedKeySet.value = new Set(keys ?? []);
    },
    { immediate: true }
  );

  // 翻页后用当前页行补全已选行的最新引用
  watch(
    () => dataList.value,
    (rows) => {
      const rk = rowKeyField();
      rows.forEach((row) => {
        const key = row[rk];
        if (selectedKeySet.value.has(key)) {
          selectedRowsMap.value.set(key, row);
        }
      });
    },
    { deep: true }
  );

  // 同步 v-model:selectedKeys 与 selection-change
  function emitSelection() {
    emit('update:selectedKeys', [...selectedKeySet.value]);
    emit('selection-change', [...selectedRowsMap.value.values()]);
  }

  // 当前行是否已选
  function isSelected(row: Record<string, any>) {
    return selectedKeySet.value.has(row[rowKeyField()]);
  }

  // 单击切换单行选中
  function toggleRow(row: Record<string, any>) {
    const key = row[rowKeyField()];
    if (props.multiple) {
      if (selectedKeySet.value.has(key)) {
        selectedKeySet.value.delete(key);
        selectedRowsMap.value.delete(key);
      } else {
        selectedKeySet.value.add(key);
        selectedRowsMap.value.set(key, row);
      }
      selectedKeySet.value = new Set(selectedKeySet.value);
    } else {
      selectedKeySet.value = new Set([key]);
      selectedRowsMap.value.clear();
      selectedRowsMap.value.set(key, row);
    }
    emitSelection();
  }

  // 表头全选 / 全不选当前页
  function toggleAll() {
    const rk = rowKeyField();
    const allKeys = dataList.value.map((r) => r[rk]);
    const allSelected = allKeys.every((k) => selectedKeySet.value.has(k));
    if (allSelected) {
      allKeys.forEach((k) => {
        selectedKeySet.value.delete(k);
        selectedRowsMap.value.delete(k);
      });
    } else {
      dataList.value.forEach((row) => {
        const k = row[rk];
        selectedKeySet.value.add(k);
        selectedRowsMap.value.set(k, row);
      });
    }
    selectedKeySet.value = new Set(selectedKeySet.value);
    emitSelection();
  }

  const allCurrentSelected = computed(
    () =>
      dataList.value.length > 0 &&
      dataList.value.every((r) => selectedKeySet.value.has(r[rowKeyField()]))
  );

  const someCurrentSelected = computed(() =>
    dataList.value.some((r) => selectedKeySet.value.has(r[rowKeyField()]))
  );

  // 清空勾选
  function clearSelection() {
    selectedKeySet.value = new Set();
    selectedRowsMap.value.clear();
    emitSelection();
  }

  // 已选完整行数组
  function getSelectedRows() {
    return [...selectedRowsMap.value.values()];
  }

  function getSelectedCount() {
    return selectedKeySet.value.size;
  }

  // 外部设置已选主键并尽量绑定行对象
  function setSelectedKeys(keys: any[]) {
    selectedKeySet.value = new Set(keys);
    const rk = rowKeyField();
    dataList.value.forEach((row) => {
      const key = row[rk];
      if (selectedKeySet.value.has(key)) {
        selectedRowsMap.value.set(key, row);
      }
    });
    emitSelection();
  }

  // 左侧选择列：序号 / 复选 / 单选圆点
  const selectionColumn = computed(
    (): ColumnsItem => ({
      key: '__sel__',
      width: SEL_WIDTH,
      align: 'center' as const,
      fixed: TableV2FixedDir.LEFT,
      cellRenderer: ({
        rowData,
        rowIndex,
      }: {
        rowData: Record<string, any>;
        rowIndex: number;
      }) => {
        const selected = isSelected(rowData);
        const hovered = hoveredIndex.value === rowIndex;

        if (!selected && !hovered) {
          return h('span', { class: 'sel-index' }, rowIndex + 1);
        }

        if (props.multiple) {
          return h(ElCheckbox, {
            modelValue: selected,
            onClick: (e: MouseEvent) => {
              e.stopPropagation();
              toggleRow(rowData);
            },
          });
        }
        return h('span', {
          class: ['sel-radio', selected && 'sel-radio--checked'],
          onClick: (e: MouseEvent) => {
            e.stopPropagation();
            toggleRow(rowData);
          },
        });
      },
      headerCellRenderer: () => {
        if (!props.multiple) {
          return h('span', { class: 'sel-header' }, '');
        }
        return h(ElCheckbox, {
          modelValue: allCurrentSelected.value,
          indeterminate: someCurrentSelected.value && !allCurrentSelected.value,
          disabled: dataList.value.length === 0,
          onClick: (e: MouseEvent) => {
            e.stopPropagation();
            toggleAll();
          },
        });
      },
    })
  );

  // 行 hover 与点击行触发选择
  const rowEventHandlers = {
    onMouseenter: ({ rowIndex }: { rowIndex: number }) => {
      hoveredIndex.value = rowIndex;
    },
    onMouseleave: () => {
      hoveredIndex.value = -1;
    },
    onClick: ({ rowData }: { rowData: Record<string, any> }) => {
      toggleRow(rowData);
    },
  };

  return {
    selectedKeySet,
    selectionColumn,
    rowEventHandlers,
    clearSelection,
    getSelectedRows,
    getSelectedCount,
    setSelectedKeys,
  };
}
