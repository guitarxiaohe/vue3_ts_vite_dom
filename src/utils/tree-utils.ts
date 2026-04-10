/**
 * 树状数据处理工具
 */

/**
 * 将扁平数据转换为树状结构
 *
 * @param data - 扁平数据列表
 * @param idKey - ID 字段名
 * @param parentKey - 父级 ID 字段名
 * @param rootValue - 根节点的 parentId 值
 * @returns 树状结构数据
 *
 * @example
 * ```ts
 * const flatData = [
 *   { id: 1, name: 'A', parentId: null },
 *   { id: 2, name: 'B', parentId: 1 },
 *   { id: 3, name: 'C', parentId: 1 },
 * ];
 * const treeData = unflattenData(flatData);
 * // [{ id: 1, name: 'A', parentId: null, children: [{ id: 2, ... }, { id: 3, ... }] }]
 * ```
 */
export function unflattenData<T extends Record<string, unknown>>(
  data: T[],
  idKey = 'id',
  parentKey = 'parentId',
  rootValue: null | string | number = null
): T[] {
  const tree: T[] = [];
  const childrenMap: Record<string | number, T[]> = {};
  const idSet = new Set<string | number>();

  for (const item of data) {
    const id = item[idKey] as string | number | null | undefined;
    if (id !== undefined && id !== null) {
      idSet.add(id);
    }
  }

  for (const item of data) {
    const newItem = { ...item };
    const id = newItem[idKey] as string | number;
    const parentId = newItem[parentKey] as string | number | null | undefined;

    // 初始化 children 数组
    if (Array.isArray((newItem as Record<string, unknown>).children)) {
      childrenMap[id] = (
        (newItem as Record<string, unknown>).children as T[]
      ).concat(childrenMap[id] || []);
    } else if (!childrenMap[id]) {
      childrenMap[id] = [];
    }
    (newItem as Record<string, unknown>).children = childrenMap[id];

    // 判断是否为根节点
    if (
      parentId !== undefined &&
      parentId !== null &&
      parentId !== rootValue &&
      idSet.has(parentId)
    ) {
      // 子节点 - 只在 parentId 不为 null 时使用作为索引
      if (!childrenMap[parentId]) {
        childrenMap[parentId] = [];
      }
      childrenMap[parentId].push(newItem);
    } else {
      // 根节点, 若后端未返回父节点则直接作为根节点渲染
      tree.push(newItem);
    }
  }

  return tree;
}

/**
 * 获取树状数据中指定层级的所有节点 ID
 *
 * @param data - 树状数据
 * @param level - 层级（0 = 无展开，1 = 第一层，-1 = 全部）
 * @param idKey - ID 字段名
 * @param currentLevel - 当前层级（内部使用）
 * @returns 节点 ID 列表
 *
 * @example
 * ```ts
 * const treeData = [...];
 * // 获取第一层所有节点 ID
 * const ids = getNodeIdsByLevel(treeData, 1);
 * // 获取所有节点 ID（全部展开）
 * const allIds = getNodeIdsByLevel(treeData, -1);
 * ```
 */
export function getNodeIdsByLevel<T extends Record<string, unknown>>(
  data: T[],
  level: number,
  idKey = 'id',
  currentLevel = 1
): (string | number)[] {
  if (level === 0) return [];
  if (level === -1) {
    // 返回所有节点（全部展开）
    const ids: (string | number)[] = [];
    for (const item of data) {
      ids.push(item[idKey] as string | number);
      if (Array.isArray(item.children) && item.children.length > 0) {
        ids.push(
          ...getNodeIdsByLevel(
            item.children as T[],
            -1,
            idKey,
            currentLevel + 1
          )
        );
      }
    }
    return ids;
  }

  if (currentLevel === level) {
    return data.map((item) => item[idKey] as string | number);
  }

  const ids: (string | number)[] = [];
  for (const item of data) {
    if (Array.isArray(item.children) && item.children.length > 0) {
      ids.push(
        ...getNodeIdsByLevel(
          item.children as T[],
          level,
          idKey,
          currentLevel + 1
        )
      );
    }
  }
  return ids;
}

/**
 * 扁平化树状数据（用于导出等场景）
 *
 * @param data - 树状数据
 * @param childrenKey - children 字段名
 * @returns 扁平数据列表
 *
 * @example
 * ```ts
 * const treeData = [{ id: 1, name: 'A', children: [{ id: 2, name: 'B' }] }];
 * const flatData = flattenTreeData(treeData);
 * // [{ id: 1, name: 'A' }, { id: 2, name: 'B' }]
 * ```
 */
export function flattenTreeData<T extends Record<string, unknown>>(
  data: T[],
  childrenKey = 'children'
): Omit<T, 'children'>[] {
  const result: Omit<T, 'children'>[] = [];

  function traverse(nodes: T[]) {
    for (const node of nodes) {
      const { [childrenKey]: children, ...rest } = node;
      result.push(rest as Omit<T, 'children'>);

      if (Array.isArray(children) && children.length > 0) {
        traverse(children as T[]);
      }
    }
  }

  traverse(data);
  return result;
}
