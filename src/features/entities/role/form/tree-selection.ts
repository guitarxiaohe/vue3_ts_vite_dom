/******************************** 类型 ********************************/

export interface TreeSelectionNode {
  id: number | string;
  children?: TreeSelectionNode[];
}

/******************************** 树选择工具 ********************************/

// 标准化树选择 ID 列表
function normalizeTreeIds(value: unknown): Array<number | string> {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : item))
    .filter((item) => item !== '' && item != null) as Array<number | string>;
}

// 收集树组件选中 ID，默认包含半选父节点
export function collectCheckedTreeKeys(
  treeRef:
    | {
        getCheckedKeys?: (leafOnly?: boolean) => unknown;
        getHalfCheckedKeys?: () => unknown;
      }
    | null
    | undefined,
  includeHalfChecked = true
): Array<number | string> {
  const checkedKeys = normalizeTreeIds(treeRef?.getCheckedKeys?.(false) ?? []);
  const halfCheckedKeys = includeHalfChecked
    ? normalizeTreeIds(treeRef?.getHalfCheckedKeys?.() ?? [])
    : [];

  return [...new Set([...checkedKeys, ...halfCheckedKeys])];
}

// 将已保存的权限 ID 转成树回显 keys，联动模式下只恢复叶子勾选，半选父节点交给树自行推导
export function resolveTreeCheckedKeysForDisplay(
  treeNodes: TreeSelectionNode[],
  selectedIds: Array<number | string>,
  checkStrictly: boolean
): Array<number | string> {
  const normalizedSelectedIds = new Set(normalizeTreeIds(selectedIds));
  if (checkStrictly) {
    return [...normalizedSelectedIds];
  }

  const keys: Array<number | string> = [];

  const walk = (nodes: TreeSelectionNode[]) => {
    for (const node of nodes) {
      const children = Array.isArray(node.children) ? node.children : [];
      if (!children.length) {
        if (normalizedSelectedIds.has(node.id)) {
          keys.push(node.id);
        }
        continue;
      }

      walk(children);
    }
  };

  walk(treeNodes);
  return keys;
}
