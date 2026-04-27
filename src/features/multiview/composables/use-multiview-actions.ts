import { computed, h, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { TableV2FixedDir } from 'element-plus';
import ActionColumn from '@/features/multiview/components/action-column.vue';
import { getEntityRowActionsConfig } from '@/features/entities/registry';
import { getEntityActionsConfig } from '@/utils/entity-config';
import type { ColumnsItem } from '@/components/table-entity/index.type';
import type {
  RowActionComponentConfig,
  RowActionRenderConfig,
  RowActionRuntimeActions,
} from '@/features/entities/_shared/row-actions-types';

/******************************** 操作按钮 ********************************/

const MAX_PRIMARY_ACTIONS = 4;
const DEFAULT_ACTION_COLUMN_WIDTH = 96;
const MAX_ACTION_COLUMN_WIDTH = 200;
const ACTION_BUTTON_WIDTH = 40;
const MORE_BUTTON_WIDTH = 28;
const ACTION_COLUMN_PADDING = 24;

// 使用实体配置生成操作列
export function useMultiviewActions(
  entityKey: Ref<string>,
  actions: RowActionRuntimeActions,
  hasEntityConfig: Ref<boolean>
) {
  const { t } = useI18n();
  const rowActionsConfig = computed(() =>
    getEntityRowActionsConfig(entityKey.value)
  );
  const entityActionsConfig = computed(() =>
    getEntityActionsConfig(entityKey.value)
  );

  const customButtons = computed<RowActionComponentConfig[]>(() =>
    [...(rowActionsConfig.value.customButtons ?? [])].sort(
      (a, b) => (a.order ?? 1000) - (b.order ?? 1000)
    )
  );

  const builtinActions = computed<RowActionRenderConfig[]>(() => {
    const config = rowActionsConfig.value;
    const pageActions = entityActionsConfig.value;
    const items: RowActionRenderConfig[] = [];

    if (!hasEntityConfig.value) {
      return [
        {
          key: '__builtin_view__',
          label: t('common.view'),
          actionKey: 'view',
          order: 10,
        },
      ];
    }

    if (config.showView ?? true) {
      items.push({
        key: '__builtin_view__',
        label: t('common.view'),
        actionKey: 'view',
        order: 10,
      });
    }

    if (config.showEdit ?? pageActions.showEdit) {
      items.push({
        key: '__builtin_edit__',
        label: t('common.edit'),
        actionKey: 'edit',
        order: 20,
      });
    }

    if (config.showCopy ?? pageActions.showCopy) {
      items.push({
        key: '__builtin_copy__',
        label: t('common.copy'),
        actionKey: 'copy',
        order: 25,
      });
    }

    if (config.showDelete ?? pageActions.showDelete) {
      items.push({
        key: '__builtin_delete__',
        label: t('common.delete'),
        actionKey: 'delete',
        order: 30,
        danger: true,
      });
    }

    return items;
  });

  const hasRowActions = computed(
    () => builtinActions.value.length > 0 || customButtons.value.length > 0
  );

  const maxPrimaryActions = computed(
    () => rowActionsConfig.value.maxPrimaryActions ?? MAX_PRIMARY_ACTIONS
  );

  const actionColumnWidth = computed(() => {
    const visibleCount =
      builtinActions.value.length + customButtons.value.length;
    const primaryCount = Math.min(visibleCount, maxPrimaryActions.value);
    const moreWidth =
      visibleCount > maxPrimaryActions.value ? MORE_BUTTON_WIDTH : 0;
    const computedWidth =
      ACTION_COLUMN_PADDING + primaryCount * ACTION_BUTTON_WIDTH + moreWidth;

    const adaptiveWidth = Math.max(
      rowActionsConfig.value.actionColumnWidth ?? 0,
      DEFAULT_ACTION_COLUMN_WIDTH,
      computedWidth
    );

    return Math.min(adaptiveWidth, MAX_ACTION_COLUMN_WIDTH);
  });

  // 获取当前行可见按钮
  function getVisibleActions(row: Record<string, any>) {
    const customActions: RowActionRenderConfig[] = customButtons.value
      .filter((action) =>
        action.visible ? action.visible(row, actions) : true
      )
      .map(
        (action): RowActionRenderConfig => ({
          key: action.key,
          label: action.label,
          component: action.component,
          order: action.order,
        })
      );

    return [...builtinActions.value, ...customActions].sort(
      (a, b) => (a.order ?? 1000) - (b.order ?? 1000)
    );
  }

  // 获取主要按钮
  function getPrimaryActions(row: Record<string, any>) {
    return getVisibleActions(row).slice(0, maxPrimaryActions.value);
  }

  // 获取更多按钮
  function getExtraActions(row: Record<string, any>) {
    return getVisibleActions(row).slice(maxPrimaryActions.value);
  }

  const actionColumn = computed<ColumnsItem | undefined>(() => {
    if (!hasRowActions.value) {
      return undefined;
    }

    return {
      key: '__ops__',
      dataKey: '__ops__',
      title: t('common.operation'),
      width: actionColumnWidth.value ,
      align: 'right' as const,
      fixed: TableV2FixedDir.RIGHT,
      cellRenderer: ({ rowData }) =>
        h(ActionColumn, {
          row: rowData,
          actions,
          primaryActions: getPrimaryActions(rowData),
          extraActions: getExtraActions(rowData),
          onRefresh: actions.refresh,
        }),
    };
  });

  return {
    actionColumn,
    actionColumnWidth,
    hasRowActions,
    getPrimaryActions,
    getExtraActions,
  };
}
