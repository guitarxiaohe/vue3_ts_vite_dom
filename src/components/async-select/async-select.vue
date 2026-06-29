<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery } from '@tanstack/vue-query';
import DialogList from '@/components/dialog-list/index.vue';
import { getListByEntityKeyApi } from '@/api/modules/dynamic-entity';
import { createDictDataFetcher } from '@/utils/dict-fetcher';
import moreDotIcon from '@/assets/svg/icons/more-dot.svg';
import type {
  ColumnsItem,
  TableListQuery,
} from '@/components/table-entity/index.type';
import { loadMissingSelectedOptions } from './async-select.utils';
import type {
  AsyncSelectEntityConfig,
  AsyncSelectFetchParams,
  AsyncSelectFetchResult,
  SelectVal,
} from './async-select.type';
import { toCamelCase } from '@/utils/value';

const { t } = useI18n();

/******************************** 类型 ********************************/

type OptLabel = {
  label: string;
  subtitle: string;
  raw: Record<string, any>;
};

type Opt = { value: string | number; label: OptLabel };

type AsyncSelectListResult = {
  items: Record<string, any>[];
  total: number;
};

const DEFAULT_LABEL_KEYS = [
  'label',
  'name',
  'title',
  'deptName',
  'nickName',
  'userName',
  'fileOriginName',
];
const DEFAULT_VALUE_KEYS = ['value', 'id', 'userId', 'deptId', 'fileId'];

const props = withDefaults(
  defineProps<{
    modelValue: SelectVal;
    multiple?: boolean;
    fetcher?: (p: AsyncSelectFetchParams) => Promise<AsyncSelectFetchResult>;
    entityConfig?: AsyncSelectEntityConfig;
    valueKey?: string;
    labelKey?: string;
    placeholder?: string;
    disabled?: boolean;
    dictCode?: string;
    dialogTitle?: string;
    columns?: ColumnsItem[];
    dialogPageSize?: number;
    queryKey?: string | string[];
    staleTime?: number;
    subtitleKey?: string;
  }>(),
  {
    multiple: false,
    valueKey: 'value',
    labelKey: 'label',
    placeholder: '',
    disabled: false,
    dictCode: '',
    dialogTitle: '',
    columns: () => [],
    dialogPageSize: 20,
    staleTime: 5 * 60 * 1000,
    subtitleKey: '',
  }
);
const emit = defineEmits<{
  'update:modelValue': [v: SelectVal];
  change: [v: SelectVal, rows: Record<string, any>[]];
}>();

const queryEnabled = ref(false);
const selectedOpts = ref<Opt[]>([]);

const innerValue = computed<SelectVal>({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const resolvedDialogPageSize = computed(
  () => props.entityConfig?.pageSize ?? props.dialogPageSize
);

const resolvedDictCode = computed(() =>
  String(props.entityConfig?.dictCode ?? props.dictCode ?? '').trim()
);

const isDictSelect = computed(() => Boolean(resolvedDictCode.value));

const resolvedQueryKey = computed(() => {
  if (props.entityConfig?.queryKey) {
    return Array.isArray(props.entityConfig.queryKey)
      ? props.entityConfig.queryKey
      : [props.entityConfig.queryKey];
  }
  if (props.queryKey) {
    return Array.isArray(props.queryKey) ? props.queryKey : [props.queryKey];
  }
  if (resolvedDictCode.value) {
    return [
      '__async-select-dict__',
      resolvedDictCode.value,
      props.valueKey,
      props.labelKey,
    ];
  }
  if (props.entityConfig?.entityKey) {
    return [
      '__async-select-entity__',
      props.entityConfig.entityKey,
      JSON.stringify(props.entityConfig.dataParams ?? {}),
      props.valueKey,
      props.labelKey,
    ];
  }
  return ['__async-select__', props.valueKey, props.labelKey];
});

const activeValues = computed<Array<string | number>>(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.filter(
      (item): item is string | number => item != null
    );
  }
  return props.modelValue != null ? [props.modelValue] : [];
});

function toOpt(item: Record<string, any>): Opt {
  return {
    value: resolveOptionValue(item),
    label: {
      label: resolveOptionLabel(item),
      subtitle: props.subtitleKey
        ? String(item[toCamelCase(props.subtitleKey)] ?? '')
        : '',
      raw: item,
    },
  };
}

// 合并已选项缓存，避免重复插入
function appendSelectedOptions(options: Opt[]) {
  for (const option of options) {
    if (!selectedOpts.value.find((item) => item.value === option.value)) {
      selectedOpts.value.push(option);
    }
  }
}

// 解析选项主文案
function resolveOptionLabel(item: Record<string, any>) {
  const keys = [props.labelKey, ...DEFAULT_LABEL_KEYS].filter(Boolean);

  for (const key of keys) {
    const value = item[String(key)];
    if (value !== undefined && value !== null && value !== '') {
      return String(value);
    }
  }

  return '';
}

// 解析选项值
function resolveOptionValue(item: Record<string, any>) {
  const keys = [props.valueKey, ...DEFAULT_VALUE_KEYS].filter(Boolean);

  for (const key of keys) {
    const value = item[String(key)];
    if (value !== undefined && value !== null && value !== '') {
      return value as string | number;
    }
  }

  return '' as string;
}

async function fetchEntityList(
  params: AsyncSelectFetchParams
): Promise<AsyncSelectListResult> {
  const config = props.entityConfig;
  const dictCode = resolvedDictCode.value;
  if (dictCode) {
    const result = await createDictDataFetcher(dictCode)({
      page: params.page,
      pageSize: params.pageSize,
      keyword: params.keyword,
    });
    return {
      items: result.rows ?? [],
      total: Number(result.total) || 0,
    };
  }
  if (!config?.entityKey) {
    throw new Error('AsyncSelect entityConfig.entityKey is required');
  }

  const query: TableListQuery & { keyword?: string } = {
    pageNum: params.page,
    pageSize: params.pageSize,
    ...(config.dataParams ?? {}),
    ...(params.params ?? {}),
  };
  if (params.keyword) {
    query.keyword = params.keyword;
  }
  if (config.fetcher) {
    const result = await config.fetcher(query);
    return {
      items: result.rows ?? [],
      total: Number(result.total) || 0,
    };
  }
  const result = (await getListByEntityKeyApi(
    config.entityKey,
    query
  )) as unknown as {
    rows?: Record<string, any>[];
    total?: number;
  };
  const items =
    result.rows?.map((t) => {
      return {
        ...t,
        label: t[toCamelCase(props.labelKey)],
        value: t[toCamelCase(props.valueKey)],
        subTitle: t[toCamelCase(props.subtitleKey)],
      };
    }) ?? [];
  return {
    items,
    total: Number(result.total) || 0,
  };
}

async function fetchList(params: AsyncSelectFetchParams) {
  if (isDictSelect.value || props.entityConfig?.entityKey) {
    return fetchEntityList(params);
  }
  if (!props.fetcher) {
    throw new Error('AsyncSelect requires fetcher, dictCode or entityConfig');
  }
  return props.fetcher(params);
}

// 为回显补拉候选行数据
async function loadRowsForSelectedValues() {
  if (resolvedDictCode.value) {
    const result = await createDictDataFetcher(resolvedDictCode.value)({
      page: 1,
      pageSize: 9999,
    });
    return result.rows ?? [];
  }

  // 无精确按值查询能力时，兜底拉一批选项用于回显
  const result = await fetchList({
    page: 1,
    pageSize: 9999,
  });

  return result.items ?? [];
}

const dropdownQueryKey = computed(() => [
  ...resolvedQueryKey.value,
  1,
  resolvedDialogPageSize.value,
  '',
]);

const { data: queryData, isFetching: selectLoading } = useQuery({
  queryKey: dropdownQueryKey,
  queryFn: () => fetchList({ page: 1, pageSize: resolvedDialogPageSize.value }),
  enabled: queryEnabled,
  staleTime: computed(() => props.staleTime),
  select: (res) => res.items.map(toOpt),
});

const selectOptions = computed<Opt[]>(() => {
  const fromQuery = queryData.value ?? [];
  const extra = selectedOpts.value.filter(
    (o) =>
      activeValues.value.includes(o.value) &&
      !fromQuery.find((n) => n.value === o.value)
  );
  return [...fromQuery, ...extra];
});

watch(
  activeValues,
  async (values) => {
    if (!values.length) {
      selectedOpts.value = [];
      return;
    }
    const options = await loadMissingSelectedOptions({
      activeValues: values,
      selectedValues: selectedOpts.value.map((item) => item.value),
      loadRows: () =>
        props.entityConfig?.loadByValues
          ? props.entityConfig.loadByValues(values)
          : loadRowsForSelectedValues(),
      resolveValue: resolveOptionValue,
      toOption: toOpt,
    });

    appendSelectedOptions(options);
  },
  { immediate: true }
);

function onDropdownVisible(visible: boolean) {
  if (visible) queryEnabled.value = true;
}

const dialogVisible = ref(false);

function openDialog() {
  if (props.disabled) return;
  dialogVisible.value = true;
}

function onDialogConfirm(rows: Record<string, any>[]) {
  appendSelectedOptions(rows.map(toOpt));

  const newVal: SelectVal = props.multiple
    ? rows.map((r) => r[props.valueKey] as string | number)
    : ((rows[0]?.[props.valueKey] as string | number | undefined) ?? null);

  queryEnabled.value = true;
  emit('update:modelValue', newVal);
  emit('change', newVal, rows);
}

const computedPlaceholder = computed(
  () => props.placeholder || t('common.pleaseSelect')
);
const computedDialogTitle = computed(
  () => props.dialogTitle || t('common.pleaseSelect')
);
</script>

<template>
  <div class="async-select">
    <el-select-v2
      v-model="innerValue"
      class="async-select__select"
      :options="selectOptions"
      :loading="selectLoading"
      :multiple="multiple"
      filterable
      clearable
      :placeholder="computedPlaceholder"
      :disabled="disabled"
      v-bind="$attrs"
      @visible-change="onDropdownVisible"
    >
      <template #label="{ label }">
        <span>{{ label.label }}</span>
      </template>
      <template #default="{ item }">
        <div class="async-select__option">
          <p class="async-select__option-label">
            {{ item.label.label }}
          </p>
          <p v-if="item.label.subtitle" class="async-select__option-desc">
            {{ item.label.subtitle }}
          </p>
        </div>
      </template>
    </el-select-v2>
    <button
      type="button"
      class="async-select__inner-trigger"
      :class="{ 'is-disabled': disabled }"
      :title="t('common.dialogSelect')"
      @mousedown.prevent
      @click.stop="openDialog"
    >
      <el-icon>
        <img :src="moreDotIcon" :alt="t('common.more')" />
      </el-icon>
    </button>
  </div>

  <DialogList
    v-model:visible="dialogVisible"
    :entity-key="props.entityConfig?.entityKey"
    :model-value="modelValue"
    :multiple="multiple"
    :fetcher="fetchList"
    :columns="
      props.entityConfig?.columns?.length
        ? props.entityConfig.columns
        : props.columns
    "
    :keyId="valueKey"
    :row-key="valueKey"
    :dialog-title="computedDialogTitle"
    :page-size="resolvedDialogPageSize"
    :query-key="resolvedQueryKey"
    :stale-time="props.staleTime"
    @confirm="onDialogConfirm"
  />
</template>

<style scoped lang="scss">
:deep(.el-select) {
  // width: 260px !important;
}

:deep(.el-input__icon) {
  margin-right: 15px;
}

.async-select {
  position: relative;
  display: block;
  // width: 260px;
  width: 100%;
}

.async-select__select {
  // width: 260px;
}

// .async-select__select:deep(.el-select__suffix),
// .async-select__select:deep(.el-select-v2__suffix) {
//   margin-right: 24px;
//   transition: margin-right 0.2s ease;
// }

.async-select__inner-trigger {
  position: absolute;
  top: 50%;
  right: 5px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 4px;
  padding: 0;
  background: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
  font-size: 14px;
  transform: translateY(-50%);
}

.async-select__inner-trigger:hover:not(.is-disabled) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.async-select__inner-trigger.is-disabled {
  cursor: not-allowed;
  color: var(--el-text-color-placeholder);
}

.async-select__option {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  line-height: 1.3;
  margin-bottom: 5px !important;
}

.async-select__option-label,
.async-select__option-desc {
  overflow: hidden;
  margin: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.async-select__option-label {
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 500;
}

.async-select__option-desc {
  margin-top: 2px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.async-select
  :deep(.el-select-dropdown__item.is-selected .async-select__option-label),
.async-select
  :deep(.el-select-dropdown__item.is-selected .async-select__option-desc),
.async-select
  :deep(.el-select-dropdown__item.selected .async-select__option-label),
.async-select
  :deep(.el-select-dropdown__item.selected .async-select__option-desc) {
  color: var(--el-color-primary);
}
</style>
