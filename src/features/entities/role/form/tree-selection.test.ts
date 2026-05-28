import test from 'node:test';
import assert from 'node:assert/strict';
import {
  collectCheckedTreeKeys,
  resolveTreeCheckedKeysForDisplay,
} from './tree-selection.ts';

/******************************** 树选择测试 ********************************/

test('collectCheckedTreeKeys should include half checked parent ids', () => {
  const treeRef = {
    getCheckedKeys: () => [101, 102, 103],
    getHalfCheckedKeys: () => [10, 1],
  };

  assert.deepEqual(collectCheckedTreeKeys(treeRef), [101, 102, 103, 10, 1]);
});

test('collectCheckedTreeKeys should trim strings and remove duplicates', () => {
  const treeRef = {
    getCheckedKeys: () => [' 101 ', '102', 101],
    getHalfCheckedKeys: () => ['10', '102'],
  };

  assert.deepEqual(collectCheckedTreeKeys(treeRef), ['101', '102', 101, '10']);
});

test('collectCheckedTreeKeys should return only checked ids when half checked is disabled', () => {
  const treeRef = {
    getCheckedKeys: () => [101, 102],
    getHalfCheckedKeys: () => [10],
  };

  assert.deepEqual(collectCheckedTreeKeys(treeRef, false), [101, 102]);
});

test('resolveTreeCheckedKeysForDisplay should keep only leaf keys in linked mode', () => {
  const treeNodes = [
    {
      id: 1,
      children: [
        {
          id: 10,
          children: [{ id: 101 }, { id: 102 }, { id: 103 }],
        },
      ],
    },
  ];

  assert.deepEqual(
    resolveTreeCheckedKeysForDisplay(treeNodes, [1, 10, 101, 102], false),
    [101, 102]
  );
});

test('resolveTreeCheckedKeysForDisplay should keep original ids in strict mode', () => {
  const treeNodes = [
    { id: 1, children: [{ id: 10, children: [{ id: 101 }] }] },
  ];

  assert.deepEqual(
    resolveTreeCheckedKeysForDisplay(treeNodes, [1, 10, 101], true),
    [1, 10, 101]
  );
});
