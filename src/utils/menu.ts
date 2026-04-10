import type { SidebarMenuSection } from '@/features/menu/types';
import { i18n } from '@/i18n';

/**
 * 根据路由路径从菜单配置中获取标题
 */
export const getTitleFromMenu = (
  path: string,
  menuSections: SidebarMenuSection[] = [],
  fallbackTitle = i18n.global.t('common.unnamedPage')
): string => {
  // 遍历菜单区块查找匹配的标题
  for (const section of menuSections) {
    // 情况1：一级菜单（直接路由）
    if (section.path === path) {
      return section.label;
    }

    // 情况2：二级菜单（有子菜单）
    if (section.items) {
      for (const group of section.items) {
        if (group.path === path) {
          return group.label;
        }
        const matchedItem = group.items?.find((item) => item.path === path);
        if (matchedItem) {
          return matchedItem.label;
        }
      }
    }
  }

  // 如果菜单中没有找到，使用传入的兜底标题
  return fallbackTitle || i18n.global.t('common.unnamedPage');
};
