import test from 'node:test';
import assert from 'node:assert/strict';
import { loadMissingSelectedOptions } from './async-select.utils.ts';

/******************************** AsyncSelect 工具测试 ********************************/

test('loadMissingSelectedOptions should resolve missing selected options from fallback rows', async () => {
  const result = await loadMissingSelectedOptions({
    activeValues: [2],
    selectedValues: [],
    loadRows: async () => [
      { deptId: 1, deptName: '研发部' },
      { deptId: 2, deptName: '产品部' },
    ],
    resolveValue: (row) => row.deptId as number,
    toOption: (row) => ({
      value: row.deptId as number,
      label: {
        label: row.deptName as string,
        dragLabel: '',
        raw: row,
      },
    }),
  });

  assert.deepEqual(result, [
    {
      value: 2,
      label: {
        label: '产品部',
        dragLabel: '',
        raw: { deptId: 2, deptName: '产品部' },
      },
    },
  ]);
});

test('loadMissingSelectedOptions should skip fetch when selected values are already cached', async () => {
  let callCount = 0;

  const result = await loadMissingSelectedOptions({
    activeValues: [2],
    selectedValues: [2],
    loadRows: async () => {
      callCount += 1;
      return [{ deptId: 2, deptName: '产品部' }];
    },
    resolveValue: (row) => row.deptId as number,
    toOption: (row) => ({
      value: row.deptId as number,
      label: {
        label: row.deptName as string,
        dragLabel: '',
        raw: row,
      },
    }),
  });

  assert.deepEqual(result, []);
  assert.equal(callCount, 0);
});
