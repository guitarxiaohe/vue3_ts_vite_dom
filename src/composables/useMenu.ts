import type { FlatMenuItem, MenuItem, TreeNode } from '@/types/user';
import { computed, ref, type Ref } from 'vue';

export function useMenu(menuList: Ref<MenuItem[]> | MenuItem[]) {
  const sourceList = ref(menuList);

  const flatList = computed<FlatMenuItem[]>(() => {
    const result: FlatMenuItem[] = [];
    const menuMap = new Map<number, MenuItem>();

    sourceList.value.forEach((item) => {
      menuMap.set(item.menuId, item);
    });

    const buildPath = (item: MenuItem): string => {
      if (item.parentId === null || item.parentId === 0) {
        return item.path.startsWith('/') ? item.path : `/${item.path}`;
      }

      const parent = menuMap.get(item.parentId);
      if (!parent) {
        return item.path.startsWith('/') ? item.path : `/${item.path}`;
      }

      const parentPath = buildPath(parent);
      const currentPath = item.path.startsWith('/')
        ? item.path.slice(1)
        : item.path;

      return `${parentPath}/${currentPath}`.replace(/\/+/g, '/');
    };

    const getLevel = (item: MenuItem): number => {
      if (item.parentId === null || item.parentId === 0) {
        return 1;
      }
      const parent = menuMap.get(item.parentId);
      if (!parent) {
        return 1;
      }
      return getLevel(parent) + 1;
    };

    const getAllParentIds = (item: MenuItem): number[] => {
      if (item.parentId === null || item.parentId === 0) {
        return [];
      }
      const parent = menuMap.get(item.parentId);
      if (!parent) {
        return [];
      }
      return [...getAllParentIds(parent), item.parentId];
    };

    sourceList.value.forEach((item) => {
      result.push({
        ...item,
        fullPath: buildPath(item),
        level: getLevel(item),
        allParentIds: getAllParentIds(item),
      });
    });

    return result.sort((a, b) => {
      if (a.level !== b.level) {
        return a.level - b.level;
      }
      return a.orderNum - b.orderNum;
    });
  });

  const treeList = computed<TreeNode[]>(() => {
    const menuMap = new Map<number, TreeNode>();
    const rootNodes: TreeNode[] = [];

    const flatMap = new Map<number, FlatMenuItem>();
    flatList.value.forEach((item) => {
      flatMap.set(item.menuId, item);
    });

    flatList.value.forEach((item) => {
      const treeNode: TreeNode = {
        ...item,
        fullPath: item.fullPath,
        level: item.level,
        children: [],
      };
      menuMap.set(item.menuId, treeNode);
    });

    flatList.value.forEach((item) => {
      const node = menuMap.get(item.menuId)!;

      if (item.parentId === null || item.parentId === 0) {
        rootNodes.push(node);
      } else {
        const parentNode = menuMap.get(item.parentId);
        if (parentNode) {
          if (!parentNode.children) {
            parentNode.children = [];
          }
          parentNode.children.push(node);
        } else {
          rootNodes.push(node);
        }
      }
    });

    const sortChildren = (nodes: TreeNode[]): TreeNode[] => {
      return nodes
        .sort((a, b) => a.orderNum - b.orderNum)
        .map((node) => {
          if (node.children && node.children.length > 0) {
            return {
              ...node,
              children: sortChildren(node.children),
            };
          }
          return node;
        });
    };

    return sortChildren(rootNodes);
  });

  const getMenuById = (menuId: number): FlatMenuItem | undefined => {
    return flatList.value.find((item) => item.menuId === menuId);
  };

  const getMenuByPath = (path: string): FlatMenuItem | undefined => {
    return flatList.value.find((item) => item.fullPath === path);
  };

  const getChildrenByParentId = (parentId: number): FlatMenuItem[] => {
    return flatList.value.filter((item) => item.parentId === parentId);
  };

  const getBreadcrumb = (menuId: number): FlatMenuItem[] => {
    const result: FlatMenuItem[] = [];
    const item = getMenuById(menuId);

    if (!item) return result;

    result.unshift(item);

    let currentParentId = item.parentId;
    while (currentParentId !== null && currentParentId !== 0) {
      const parent = getMenuById(currentParentId);
      if (parent) {
        result.unshift(parent);
        currentParentId = parent.parentId;
      } else {
        break;
      }
    }

    return result;
  };

  const getVisibleMenus = computed<FlatMenuItem[]>(() => {
    return flatList.value.filter(
      (item) => item.visible === '0' && item.status === '0'
    );
  });

  const getVisibleTree = computed<TreeNode[]>(() => {
    const filterVisible = (nodes: TreeNode[]): TreeNode[] => {
      return nodes
        .filter((node) => node.visible === '0' && node.status === '0')
        .map((node) => {
          if (node.children && node.children.length > 0) {
            return {
              ...node,
              children: filterVisible(node.children),
            };
          }
          return node;
        });
    };

    return filterVisible(treeList.value);
  });

  return {
    flatList,
    treeList,
    getMenuById,
    getMenuByPath,
    getChildrenByParentId,
    getBreadcrumb,
    getVisibleMenus,
    getVisibleTree,
  };
}
