import type { Component } from 'vue';
import type {
  EntityBatchActionConfig,
  EntityFormSubmitContext,
  EntityModule,
  EntityTableActionConfig,
} from './types';
import type { EntityConfig } from '@/types/entity-config';
import type { EntityRowActionsConfig } from './_shared/row-actions-types';

/******************************** 模块注册 ********************************/

// 自动收集实体模块，约定路径：features/entities/<entityKey>/module.ts
const moduleFiles = import.meta.glob('./**/module.ts', { eager: true });

const entityModules = Object.values(moduleFiles)
  .map((moduleFile) => {
    const payload = moduleFile as {
      default?: EntityModule;
      entityModule?: EntityModule;
    };

    return payload.default || payload.entityModule;
  })
  .filter((module): module is EntityModule => Boolean(module?.entityKey));

const entityModuleMap = new Map<string, EntityModule>();

for (const module of entityModules) {
  entityModuleMap.set(module.entityKey, module);
}

/******************************** 查询方法 ********************************/

// 获取实体模块
export function getEntityModule(entityKey: string): EntityModule | undefined {
  return entityModuleMap.get(entityKey);
}

// 获取实体配置
export function getEntityConfig(entityKey: string): EntityConfig | undefined {
  return getEntityModule(entityKey)?.config;
}

// 获取实体表单组件
export function getEntityFormComponent(entityKey: string): Component | null {
  return getEntityModule(entityKey)?.form?.component ?? null;
}

// 获取实体表单提交方法
export function getEntityFormSubmitter(entityKey: string) {
  return getEntityModule(entityKey)?.form?.submit ?? null;
}

// 获取实体详情组件
export function getEntityDetailComponent(entityKey: string): Component | null {
  return getEntityModule(entityKey)?.detail?.component ?? null;
}

// 判断实体是否存在表单
export function hasEntityForm(entityKey: string): boolean {
  return Boolean(getEntityModule(entityKey)?.form);
}

// 获取实体表头按钮配置
export function getEntityRowActionsConfig(
  entityKey: string
): EntityRowActionsConfig {
  return getEntityModule(entityKey)?.rowActions ?? {};
}

// 获取实体表头按钮配置
export function getEntityTableActions(entityKey: string):
  | {
      left?: Array<Component | EntityTableActionConfig>;
      right?: Array<Component | EntityTableActionConfig>;
    }
  | undefined {
  return getEntityModule(entityKey)?.tableActions;
}

// 获取实体批量按钮配置
export function getEntityBatchActions(
  entityKey: string
): Array<Component | EntityBatchActionConfig> | undefined {
  return getEntityModule(entityKey)?.batchActions;
}

// 注册或覆盖实体模块
export function registerEntityModule(module: EntityModule) {
  entityModuleMap.set(module.entityKey, module);
}

// 获取全部实体模块
export function getAllEntityModules() {
  return entityModuleMap;
}
