import { describe, expect, test } from 'vitest';

import { mapFieldConfigRowsToColumns } from './use-table-columns';

/******************************** 表格审计列测试 ********************************/

describe('use-table-columns audit user rendering', () => {
  test('detail formatter should resolve createUser field type after normalization', () => {
    const [column] = mapFieldConfigRowsToColumns([
      {
        id: 1,
        fieldName: '创建者',
        fieldKey: 'create_user',
        fieldType: 'createUser',
        fieldRole: 'createUser',
      },
    ]);

    const text = column.detailTextFormatter?.(
      {
        createUser: {
          userId: 9,
          userName: 'creator-admin',
        },
      },
      null
    );

    expect(text).toBe('creator-admin');
  });

  test('cell renderer should pass updateUser as the avatar row for audit columns', () => {
    const [column] = mapFieldConfigRowsToColumns([
      {
        id: 2,
        fieldName: '更新者',
        fieldKey: 'update_by',
        fieldType: 'by',
        fieldRole: 'updateUser',
      },
    ]);

    const rowData = {
      userId: 1,
      userName: 'target-user',
      updateUser: {
        userId: 99,
        userName: 'auditor-admin',
        nickName: '审计员',
      },
    };

    const vnode = column.cellRenderer?.({
      rowData,
      cellData: 'auditor-admin',
      rowIndex: 0,
      column: {} as never,
      columns: [],
      columnIndex: 0,
    }) as {
      props?: Record<string, unknown>;
    };

    expect(vnode.props?.row).toBe(rowData.updateUser);
  });
});
