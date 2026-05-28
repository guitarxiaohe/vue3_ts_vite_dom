import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPermissionId,
  hasPermissionByList,
  resolvePermissionId,
} from './permission-helpers.ts';

/******************************** 权限工具测试 ********************************/

test('buildPermissionId should normalize entity and code to uppercase id', () => {
  assert.equal(buildPermissionId('user', 'create'), 'system:user:add');
});

test('resolvePermissionId should prefer explicit permission id', () => {
  assert.equal(
    resolvePermissionId('user', 'create', 'custom_user_create'),
    'custom_user_create'
  );
});

test('resolvePermissionId should build permission id from permission code', () => {
  assert.equal(resolvePermissionId('user', 'export'), 'system:user:export');
});

test('hasPermissionByList should match permission ids case-insensitively', () => {
  assert.equal(
    hasPermissionByList(['system:user:add'], 'system:user:add'),
    true
  );
});

test('hasPermissionByList should support super permission', () => {
  assert.equal(hasPermissionByList(['*:*:*'], 'system:user:remove'), true);
});

test('hasPermissionByList should reject missing structured permission', () => {
  assert.equal(
    hasPermissionByList(['system:user:list'], 'system:user:remove'),
    false
  );
});

test('hasPermissionByList should keep compatibility when only role keys exist', () => {
  assert.equal(hasPermissionByList(['operator'], 'system:user:remove'), true);
});
