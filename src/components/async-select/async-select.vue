<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery } from '@tanstack/vue-query';
import { Search } from '@element-plus/icons-vue';
import DialogList from '@/components/dialog-list/index.vue';
import { getListByEntityKeyApi } from '@/api/modules/user';
import type {
  ColumnsItem,
  TableListQuery,
} from '@/components/table-entity/index.type';
import type {
  AsyncSelectEntityConfig,
  AsyncSelectFetchParams,
  AsyncSelectFetchResult,
  SelectVal,
} from './async-select.type';

const { t } = useI18n();

/******************************** 类型 ********************************/

type OptLabel = {
  label: string;
  dragLabel: string;
  raw: Record<string, any>;
};

type Opt = { value: string | number; label: OptLabel };

type AsyncSelectListResult = {
  items: Record<string, any>[];
  total: number;
};

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
    dialogTitle?: string;
    columns?: ColumnsItem[];
    dialogPageSize?: number;
    queryKey?: string | string[];
    staleTime?: number;
    dragKey?: string;
  }>(),
  {
    multiple: false,
    valueKey: 'value',
    labelKey: 'deptName',
    placeholder: '',
    disabled: false,
    dialogTitle: '',
    columns: () => [],
    dialogPageSize: 20,
    staleTime: 5 * 60 * 1000,
    dragKey: '',
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

const resolvedQueryKey = computed(() => {
  if (props.entityConfig?.queryKey) {
    return Array.isArray(props.entityConfig.queryKey)
      ? props.entityConfig.queryKey
      : [props.entityConfig.queryKey];
  }
  if (props.queryKey) {
    return Array.isArray(props.queryKey) ? props.queryKey : [props.queryKey];
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
    value: item[props.valueKey] as string | number,
    label: {
      label: String(item[props.labelKey] ?? ''),
      dragLabel: props.dragKey ? String(item[props.dragKey] ?? '') : '',
      raw: item,
    },
  };
}

async function fetchEntityList(
  params: AsyncSelectFetchParams
): Promise<AsyncSelectListResult> {
  const config = props.entityConfig;
  if (!config?.entityKey) {
    throw new Error('AsyncSelect entityConfig.entityKey is required');
  }
  const query: TableListQuery & { keyword?: string } = {
    pageNum: params.page,
    pageSize: params.pageSize,
    ...(config.dataParams ?? {}),
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
  return {
    items:
      result.rows?.map((t) => ({
        ...t,
        label: t[props.labelKey],
        value: t[props.valueKey],
      })) ?? [],
    total: Number(result.total) || 0,
  };
}

async function fetchList(params: AsyncSelectFetchParams) {
  if (props.entityConfig?.entityKey) {
    return fetchEntityList(params);
  }
  if (!props.fetcher) {
    throw new Error('AsyncSelect requires fetcher or entityConfig');
  }
  return props.fetcher(params);
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
    const missedValues = values.filter(
      (value) => !selectedOpts.value.find((item) => item.value === value)
    );
    if (!missedValues.length) return;

    if (props.entityConfig?.loadByValues) {
      const rows = await props.entityConfig.loadByValues(missedValues);
      for (const row of rows) {
        const opt = toOpt(row);
        if (!selectedOpts.value.find((item) => item.value === opt.value)) {
          selectedOpts.value.push(opt);
        }
      }
    }
  },
  { immediate: true }
);

function onDropdownVisible(visible: boolean) {
  if (visible) queryEnabled.value = true;
}

const dialogVisible = ref(false);

function openDialog() {
  dialogVisible.value = true;
}

function onDialogConfirm(rows: Record<string, any>[]) {
  for (const row of rows) {
    const opt = toOpt(row);
    if (!selectedOpts.value.find((o) => o.value === opt.value)) {
      selectedOpts.value.push(opt);
    }
  }

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
      <template #label="{ label, value }">
        <span>{{ label.label }}</span>
      </template>
      <template #default="{ item }">
        <div class="async-select__option">
          <p class="async-select__option-label">
            {{ item.label.label }}
          </p>
          <p v-if="item.label.dragLabel" class="async-select__option-desc">
            {{ item.label.dragLabel }}
          </p>
        </div>
      </template>
    </el-select-v2>
    <el-button
      :icon="Search"
      :disabled="disabled"
      class="async-select__trigger"
      :title="t('common.dialogSelect')"
      @click="openDialog"
    />
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
    :row-key="valueKey"
    :dialog-title="computedDialogTitle"
    :page-size="resolvedDialogPageSize"
    :query-key="resolvedQueryKey"
    :stale-time="props.staleTime"
    @confirm="onDialogConfirm"
  />
</template>

<style scoped lang="scss">
.async-select {
  display: inline-flex;
  align-items: center;
  width: 100%;
  gap: 4px;
}

.async-select__select {
  flex: 1;
  min-width: 0;
}

.async-select__trigger {
  flex-shrink: 0;
  height: 32px;
  padding: 0 10px;
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
