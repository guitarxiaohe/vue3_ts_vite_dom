import type { Component } from 'vue';
import {
  House,
  Settings,
  Package,
  Box,
  FileText,
  MessageSquare,
  HelpCircle,
  Building2,
  Workflow,
  MapPinned,
} from 'lucide-vue-next';

/******************************** 菜单图标映射 ********************************/

// 菜单图标选项
export const MENU_ICON_OPTIONS: Array<{
  label: string;
  value: string;
  component: Component;
}> = [
  { label: 'House', value: 'House', component: House },
  { label: 'Settings', value: 'Settings', component: Settings },
  { label: 'Package', value: 'Package', component: Package },
  { label: 'Box', value: 'Box', component: Box },
  { label: 'FileText', value: 'FileText', component: FileText },
  {
    label: 'MessageSquare',
    value: 'MessageSquare',
    component: MessageSquare,
  },
  { label: 'HelpCircle', value: 'HelpCircle', component: HelpCircle },
  { label: 'Building2', value: 'Building2', component: Building2 },
  { label: 'Workflow', value: 'Workflow', component: Workflow },
  { label: 'MapPinned', value: 'MapPinned', component: MapPinned },
];

// 根据图标名称获取组件
export function resolveMenuIcon(iconName?: string) {
  return (
    MENU_ICON_OPTIONS.find((item) => item.value === iconName)?.component ?? House
  );
}
