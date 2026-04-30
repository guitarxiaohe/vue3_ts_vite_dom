import {
  type EntityFilterComponentContext,
  type EntityFilterComponentRegistration,
  type EntityFilterFieldConfig,
} from '@/types/entity-config';
import type { FieldConfig } from '@/types/user';

/******************************** 工具方法 ********************************/

// 判断字段是否启用模糊查询
export function isFuzzyField(field: FieldConfig) {
  return Boolean(field.isFuzzySearch) || Number(field.isFuzzySearch ?? 0) === 1;
}

// 构建默认后端筛选字段
function buildBaseBackendFilterField(
  field: FieldConfig,
  t: EntityFilterComponentContext['t']
): EntityFilterFieldConfig {
  const fieldType = String(field.fieldType ?? 'input').trim().toLowerCase();
  const dynamicField = field as unknown as Record<string, unknown>;
  const staticOptions = Array.isArray(dynamicField.options)
    ? (dynamicField.options as EntityFilterFieldConfig['options'])
    : undefined;
  const baseField: EntityFilterFieldConfig = {
    key: String(field.fieldKey ?? ''),
    label: String(field.fieldName ?? field.fieldKey ?? ''),
    component: 'input',
    placeholder: t('common.enterKeyword'),
    order: field.sort ?? 999,
  };

  if ((fieldType === 'select' || fieldType === 'dict') && staticOptions?.length) {
    return {
      ...baseField,
      component: 'select',
      placeholder: t('common.pleaseSelect'),
      options: staticOptions,
    };
  }

  if (fieldType === 'date' || fieldType === 'datetime') {
    return {
      ...baseField,
      component: 'date',
      placeholder: t('common.pleaseSelect'),
    };
  }

  return baseField;
}

// 默认组件替换规则
export function createDefaultFilterComponentRegistrations(): EntityFilterComponentRegistration[] {
  return [
    {
      key: 'select-entity-async-select',
      component: 'async-select',
      fieldTypes: ['select', 'dict'],
      matcher: ({ field }) => Boolean(String(field.selectEntityKey ?? '').trim()),
      mapField: ({ field, t }) => ({
        placeholder: t('common.pleaseSelect'),
        entityConfig: {
          entityKey: String(field.selectEntityKey ?? '').trim(),
        },
      }),
    },
  ];
}

// 判断注册规则是否命中字段
function isMatchedFilterRegistration(
  registration: EntityFilterComponentRegistration,
  context: EntityFilterComponentContext
) {
  const fieldKey = String(context.field.fieldKey ?? '').trim();
  const fieldType = String(context.field.fieldType ?? '').trim().toLowerCase();

  if (registration.fieldKeys?.length && !registration.fieldKeys.includes(fieldKey)) {
    return false;
  }

  if (
    registration.fieldTypes?.length &&
    !registration.fieldTypes.map((item) => item.toLowerCase()).includes(fieldType)
  ) {
    return false;
  }

  if (registration.matcher && !registration.matcher(context)) {
    return false;
  }

  return true;
}

// 将注册规则应用到筛选字段
function applyFilterRegistration(
  baseField: EntityFilterFieldConfig,
  registration: EntityFilterComponentRegistration,
  context: EntityFilterComponentContext
): EntityFilterFieldConfig {
  const nextField = {
    ...baseField,
    ...(registration.mapField?.(context) ?? {}),
  } as EntityFilterFieldConfig;

  if (typeof registration.component === 'string') {
    nextField.component = registration.component;
  } else {
    nextField.component = 'custom';
    nextField.renderComponent = registration.component;
  }

  const componentProps = registration.props?.(context);
  if (componentProps) {
    nextField.componentProps = {
      ...(nextField.componentProps ?? {}),
      ...componentProps,
    };
  }

  return nextField;
}

/******************************** 导出方法 ********************************/

// 将后端字段配置解析为筛选项
export function resolveBackendFilterFields(options: {
  entityKey: string;
  backendFields: FieldConfig[];
  registrations?: EntityFilterComponentRegistration[];
  t: EntityFilterComponentContext['t'];
}): EntityFilterFieldConfig[] {
  const registrations = [
    ...(options.registrations ?? []),
    ...createDefaultFilterComponentRegistrations(),
  ];

  return options.backendFields
    .filter((field) => isFuzzyField(field))
    .map((field) => {
      const context: EntityFilterComponentContext = {
        entityKey: options.entityKey,
        field,
        t: options.t,
      };

      const baseField = buildBaseBackendFilterField(field, options.t);
      const matchedRegistration = registrations.find((registration) =>
        isMatchedFilterRegistration(registration, context)
      );

      if (!matchedRegistration) {
        return baseField;
      }

      return applyFilterRegistration(baseField, matchedRegistration, context);
    })
    .filter((field) => Boolean(field.key))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

// 解析静态兜底筛选项
export function resolveFallbackFilterFields(
  fallbackFields: Record<string, EntityFilterFieldConfig>,
  t: EntityFilterComponentContext['t']
): EntityFilterFieldConfig[] {
  const fields = Object.values(fallbackFields)
    .filter((field) => !field.hidden)
    .map((field) => ({
      ...field,
      component: field.component ?? 'input',
      placeholder:
        field.placeholder ??
        (field.component === 'select' || field.component === 'async-select'
          ? t('common.pleaseSelect')
          : t('common.enterKeyword')),
    }))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  if (fields.length) {
    return fields;
  }

  return [
    {
      key: 'keyword',
      label: t('common.keyword'),
      component: 'input',
      placeholder: t('common.enterKeyword'),
      order: 1,
    },
  ];
}
