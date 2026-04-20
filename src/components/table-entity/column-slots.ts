import { h } from 'vue';
import type { Slots } from 'vue';
import type { ColumnsItem } from './index.type';
import { colSlotName, formatCellText } from './column-utils';

/******************************** 列 cell 与插槽合并 ********************************/

// 为每列包一层 cellRenderer：插槽优先，其次列自带 renderer，最后纯文本
export function applyColumnSlots(
  cols: ColumnsItem[],
  slots: Slots
): ColumnsItem[] {
  return cols.map((col) => {
    if (col.key === '__sel__' || col.key === '__ops__') return col;
    const dk = col.dataKey;
    if (dk == null || dk === '') return col;

    const name = colSlotName(String(dk));
    const userCellRenderer = col.cellRenderer;

    return {
      ...col,
      cellRenderer: (ctx: {
        rowData: Record<string, any>;
        rowIndex: number;
        cellData: unknown;
        column: ColumnsItem;
      }) => {
        const { rowData, rowIndex, cellData } = ctx;
        const value =
          cellData !== undefined ? cellData : rowData?.[dk as string];

        const slotFn = slots[name];
        if (slotFn) {
          return h(
            'div',
            { class: 'table-entity__col-slot' },
            slotFn({
              row: rowData,
              value,
              cellData: value,
              column: col,
              rowIndex,
            })
          );
        }
        if (userCellRenderer) {
          return userCellRenderer(
            ctx as Parameters<NonNullable<ColumnsItem['cellRenderer']>>[0]
          );
        }
        return h(
          'span',
          { class: 'table-entity__col-text' },
          formatCellText(value)
        );
      },
    };
  });
}
