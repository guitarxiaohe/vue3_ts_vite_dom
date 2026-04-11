<script setup lang="ts">
import { ref, computed, getCurrentInstance } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery } from '@tanstack/vue-query';
import { Search } from '@element-plus/icons-vue';
import DialogList from '@/components/dialog-list/index.vue';
import type { DialogListColumn } from '@/components/dialog-list/index.vue';
import type {
  AsyncSelectColumn,
  AsyncSelectFetchParams,
  AsyncSelectFetchResult,
  SelectVal,
} from './async-select.type';

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    modelValue: SelectVal;
    multiple?: boolean;
    fetcher: (p: AsyncSelectFetchParams) => Promise<AsyncSelectFetchResult>;
    valueKey?: string;
    labelKey?: string;
    placeholder?: string;
    disabled?: boolean;
    dialogTitle?: string;
    columns?: AsyncSelectColumn[];
    dialogPageSize?: number;
    /** TanStack Query 缓存 key，相同 key 的实例共享缓存 */
    queryKey?: string | string[];
    /** 数据保鲜时间（ms），默认 5 分钟 */
    staleTime?: number;
  }>(),
  {
    multiple: false,
    valueKey: 'value',
    labelKey: 'label',
    placeholder: '',
    disabled: false,
    dialogTitle: '',
    columns: () => [],
    dialogPageSize: 20,
    staleTime: 5 * 60 * 1000,
  }
);

const emit = defineEmits<{
  'update:modelValue': [v: SelectVal];
  change: [v: SelectVal, rows: Record<string, any>[]];
}>();

// ── Dropdown ───────────────────────────────────────────────────────────────

type Opt = { value: any; label: string };

/** 当 queryKey 未传时，用组件实例 uid 隔离缓存 */
const uid = getCurrentInstance()!.uid;

const resolvedQueryKey = computed(() =>
  props.queryKey
    ? Array.isArray(props.queryKey)
      ? props.queryKey
      : [props.queryKey]
    : ['__async-select__', uid]
);

/** 控制懒加载：首次展开才启用 query */
const queryEnabled = ref(false);

function toOpt(item: Record<string, any>): Opt {
  return {
    value: item[props.valueKey],
    label: String(item[props.labelKey] ?? ''),
  };
}

const { data: queryData, isFetching: selectLoading } = useQuery({
  queryKey: resolvedQueryKey,
  queryFn: () => props.fetcher({ page: 1, pageSize: 50 }),
  enabled: queryEnabled,
  staleTime: computed(() => props.staleTime),
  select: (res) => res.items.map(toOpt),
});

/**
 * 已选项的 opt 缓存（确保弹窗确认或已有值时 label 能正确显示，
 * 即便这些项不在当前 query 结果里）
 */
const selectedOpts = ref<Opt[]>([]);

const selectOptions = computed<Opt[]>(() => {
  const fromQuery = queryData.value ?? [];
  const vals = Array.isArray(props.modelValue)
    ? props.modelValue
    : props.modelValue != null
      ? [props.modelValue]
      : [];
  const extra = selectedOpts.value.filter(
    (o) => vals.includes(o.value) && !fromQuery.find((n) => n.value === o.value)
  );
  return [...fromQuery, ...extra];
});

const innerValue = computed<SelectVal>({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

/** 下拉展开时启用 query（仅触发一次，后续由 staleTime 控制是否重新请求） */
function onDropdownVisible(visible: boolean) {
  if (visible) queryEnabled.value = true;
}

// ── Dialog ─────────────────────────────────────────────────────────────────

const dialogVisible = ref(false);

/** AsyncSelectColumn → DialogListColumn 格式转换 */
const dialogColumns = computed<DialogListColumn[]>(() =>
  props.columns.map((col) => ({
    key: col.prop,
    title: col.label,
    dataKey: col.prop,
    ...(col.width
      ? {
          width:
            typeof col.width === 'number'
              ? col.width
              : parseInt(String(col.width)),
        }
      : { flexGrow: 1 }),
  }))
);

function openDialog() {
  dialogVisible.value = true;
}

/** DialogList 确认后同步到下拉框 */
function onDialogConfirm(rows: Record<string, any>[]) {
  // 缓存选中项的 label，保证下拉框能正常显示
  for (const row of rows) {
    const opt = toOpt(row);
    if (!selectedOpts.value.find((o) => o.value === opt.value)) {
      selectedOpts.value.push(opt);
    }
  }

  const newVal: SelectVal = props.multiple
    ? rows.map((r) => r[props.valueKey])
    : (rows[0]?.[props.valueKey] ?? null);

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
  <!-- ── 下拉框 + 搜索按钮 ── -->
  <div class="async-select">
    <el-select-v2
      v-model="innerValue"
      class="async-select__select"
      :options="selectOptions"
      :loading="selectLoading"
      :multiple="multiple"
      filterable
      :placeholder="computedPlaceholder"
      :disabled="disabled"
      v-bind="$attrs"
      @visible-change="onDropdownVisible"
    />
    <el-button
      :icon="Search"
      :disabled="disabled"
      class="async-select__trigger"
      :title="t('common.dialogSelect')"
      @click="openDialog"
    />
  </div>

  <!-- ── 弹窗（DialogList）── -->
  <DialogList
    v-model:visible="dialogVisible"
    :model-value="modelValue"
    :multiple="multiple"
    :fetcher="fetcher"
    :columns="dialogColumns"
    :row-key="valueKey"
    :dialog-title="computedDialogTitle"
    :page-size="dialogPageSize"
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
</style>
