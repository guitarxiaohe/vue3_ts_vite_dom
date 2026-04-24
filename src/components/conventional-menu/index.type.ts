import type { Component } from 'vue';

/******************************** 菜单组件类型 ********************************/

// 侧边栏菜单节点
export interface ConventionalMenuItem {
  menuId: number;
  index: string;
  title: string;
  icon?: Component | null;
  children?: ConventionalMenuItem[];
}
