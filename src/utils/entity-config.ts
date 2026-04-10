import { getEntityConfig as getEntityModuleConfig } from '@/features/entities/registry';
import type {
  EntityActionsConfig,
  EntityTableConfig,
  EntityConfig,
  EntityFilterFieldConfig,
} from '@/types/entity-config';
import { i18n } from '@/i18n';

/**
 * 获取实体操作按钮配置
 *
 * @description
 * 返回实体的操作按钮配置，未配置的按钮默认显示
 */
export const getEntityActionsConfig = (
  entityKey: string
): Required<EntityActionsConfig> => {
  const config = getEntityModuleConfig(entityKey)?.actions || {};

  return {
    showCreate: config.showCreate ?? true,
    createName: config.createName ?? i18n.global.t('actions.create'),
    showEdit: config.showEdit ?? true,
    showCopy: config.showCopy ?? true,
    showDelete: config.showDelete ?? true,
    showImport: config.showImport ?? true,
    showExport: config.showExport ?? true,
  };
};

/**
 * 获取实体完整配置
 */
export const getEntityConfig = (
  entityKey: string
): EntityConfig | undefined => {
  return getEntityModuleConfig(entityKey);
};

/**
 * 获取实体表格配置
 */
export const getEntityTableConfig = (entityKey: string): EntityTableConfig => {
  return getEntityModuleConfig(entityKey)?.table || {};
};

/**
 * 获取实体默认排序配置
 *
 * @description
 * 仅当实体在配置中声明了 defaultSort 时才返回配置，避免跨实体复用旧的排序参数
 */
export const getEntityDefaultSort = (
  entityKey: string
): EntityTableConfig['defaultSort'] | null => {
  const tableConfig = getEntityTableConfig(entityKey);
  if (!tableConfig.defaultSort?.field) {
    return null;
  }

  return {
    field: tableConfig.defaultSort.field,
    order: tableConfig.defaultSort.order ?? 'asc',
  };
};

/**
 * 获取实体的筛选项配置
 *
 * @description
 * 返回实体筛选配置，包括默认值、显示名称、顺序、隐藏等
 */
export const getEntityFiltersConfig = (
  entityKey: string
): Record<string, EntityFilterFieldConfig> => {
  const config = getEntityModuleConfig(entityKey);
  return config?.filters?.fields ?? {};
};

/**
 * 获取实体的外部筛选定义
 */
export const getEntityExternalFilters = (
  entityKey: string
): import('@/features/multiview/types').ExternalFilterDefinition[] => {
  const config = getEntityModuleConfig(entityKey);
  return config?.filters?.externalFilters ?? [];
};
