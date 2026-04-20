import { h } from 'vue';
import { ElButton, ElSpace, TableV2FixedDir } from 'element-plus';
import type { ColumnsItem, TableEntlty, TableRowActionItem } from './index.type';

/******************************** 行尾操作列 ********************************/

export type RowOpsHandlers = {
  onDetail: (row: Record<string, any>, rowIndex: number) => void;
  onDelete: (row: Record<string, any>) => void;
  onCustomAction: (event: string, row: Record<string, any>) => void;
};

// 组装操作列：默认详情/删除 + rowActions
export function buildOperationsColumn(
  props: TableEntlty,
  handlers: RowOpsHandlers
): ColumnsItem {
  const showDefault = props.showDefaultRowActions !== false;
  const extras: TableRowActionItem[] = props.rowActions ?? [];

  return {
    key: '__ops__',
    title: props.rowActionColumnTitle ?? '操作',
    width: props.rowActionColumnWidth ?? 200,
    align: 'center' as const,
    fixed: TableV2FixedDir.RIGHT,
    cellRenderer: ({ rowData, rowIndex }) => {
      const btns: ReturnType<typeof h>[] = [];

      if (showDefault) {
        btns.push(
          h(
            ElButton,
            {
              type: 'primary',
              link: true,
              size: 'small',
              onClick: (e: MouseEvent) => {
                e.stopPropagation();
                handlers.onDetail(rowData, rowIndex);
              },
            },
            () => '详情'
          ),
          h(
            ElButton,
            {
              type: 'danger',
              link: true,
              size: 'small',
              onClick: (e: MouseEvent) => {
                e.stopPropagation();
                handlers.onDelete(rowData);
              },
            },
            () => '删除'
          )
        );
      }

      extras.forEach((a) => {
        btns.push(
          h(
            ElButton,
            {
              type: (a.type || 'primary') as any,
              link: true,
              size: 'small',
              onClick: (e: MouseEvent) => {
                e.stopPropagation();
                handlers.onCustomAction(a.event, rowData);
              },
            },
            () => a.label
          )
        );
      });

      return h(
        ElSpace,
        { size: 4, wrap: true, class: 'table-entity__row-ops' },
        { default: () => btns }
      );
    },
  };
}
