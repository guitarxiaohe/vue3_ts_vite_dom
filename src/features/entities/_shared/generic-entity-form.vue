<template>
  <el-drawer
    v-model="drawerVisible"
    :title="drawerTitle"
    :size="drawerSize"
    destroy-on-close
  >
    <div class="generic-entity-form">
      <!-------------------------- 加载态 -------------------------->
      <el-skeleton v-if="loading" :rows="6" animated />

      <!-------------------------- 表单主体 -------------------------->
      <el-form
        v-else
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-position="top"
        class="generic-entity-form__form"
      >
        <el-form-item
          v-for="field in visibleFields"
          :key="field.key"
          :label="field.label"
          :prop="field.key"
        >
          <el-input
            v-if="field.component === 'input'"
            v-model="formData[field.key]"
            :placeholder="field.placeholder"
            clearable
          />

          <el-input-number
            v-else-if="field.component === 'number'"
            v-model="formData[field.key]"
            :placeholder="field.placeholder"
            :precision="field.precision"
            :min="field.min"
            :max="field.max"
            controls-position="right"
            style="width: 100%"
          />

          <el-input
            v-else-if="field.component === 'textarea'"
            v-model="formData[field.key]"
            :placeholder="field.placeholder"
            type="textarea"
            :rows="4"
          />

          <el-date-picker
            v-else-if="field.component === 'date'"
            v-model="formData[field.key]"
            type="date"
            value-format="YYYY-MM-DD"
            :placeholder="field.placeholder"
            style="width: 100%"
          />

          <el-date-picker
            v-else-if="field.component === 'datetime'"
            v-model="formData[field.key]"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            :placeholder="field.placeholder"
            style="width: 100%"
          />

          <el-switch
            v-else-if="field.component === 'switch'"
            v-model="formData[field.key]"
            :active-value="field.activeValue"
            :inactive-value="field.inactiveValue"
          />

          <AsyncSelect
            v-else-if="field.component === 'async-select'"
            v-model="formData[field.key]"
            :multiple="field.multiple"
            :fetcher="field.fetcher"
            :entity-config="field.entityConfig"
            :columns="field.columns"
            :value-key="field.valueKey"
            :label-key="field.labelKey"
            :drag-key="field.dragKey"
            :placeholder="field.placeholder"
            :dialog-title="field.label"
          />

          <el-input
            v-else
            v-model="formData[field.key]"
            :placeholder="field.placeholder"
            clearable
          />
        </el-form-item>
      </el-form>

      <!-------------------------- 子表区域 -------------------------->
      <div v-if="hasChildTables" class="generic-entity-form__children">
        <el-tabs
          v-if="showChildTabs"
          v-model="activeChildTab"
          class="generic-entity-form__tabs"
        >
          <el-tab-pane
            v-for="child in resolvedChildTables"
            :key="child.key"
            :label="child.label"
            :name="child.key"
          >
            <RowDetailChildTable
              :config="child.config"
              :row="formData"
              :show-title="false"
            />
          </el-tab-pane>
        </el-tabs>

        <RowDetailChildTable
          v-else-if="resolvedChildTables[0]"
          :config="resolvedChildTables[0].config"
          :row="formData"
        />
      </div>

      <!-------------------------- 底部操作 -------------------------->
      <div class="generic-entity-form__footer">
        <el-button @click="onCancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">
          {{ t('common.save') }}
        </el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { AsyncSelect } from '@/components/async-select';
import { getByEntityKeyAndFieldKeyApi } from '@/api/modules/user';
import {
  getEntityConfig,
  getEntityFormSubmitter,
} from '@/features/entities/registry';
import { getEntityTableConfig } from '@/utils/entity-config';
import { snakeToCamel } from '@/utils/value';
import type { AsyncSelectEntityConfig } from '@/components/async-select';
import type { ColumnsItem } from '@/components/table-entity/index.type';
import type {
  AsyncSelectFetchParams,
  AsyncSelectFetchResult,
} from '@/components/async-select/async-select.type';
import type { EntityFormSubmitContext } from '@/features/entities/types';
import RowDetailChildTable from '@/components/table-entity/row-detail-child-table.vue';

/******************************** 类型定义 ********************************/

type GenericFieldComponent =
  | 'input'
  | 'number'
  | 'textarea'
  | 'date'
  | 'datetime'
  | 'switch'
  | 'async-select';

interface GenericEntityFormProps {
  visible: boolean;
  entityKey?: string;
  isCreate: boolean;
  record?: Record<string, unknown> | null;
  recordList?: Record<string, unknown>[];
  initialIndex?: number;
}

interface GenericEntityField {
  key: string;
  label: string;
  component: GenericFieldComponent;
  required: boolean;
  placeholder: string;
  multiple?: boolean;
  entityConfig?: AsyncSelectEntityConfig;
  fetcher?: (params: AsyncSelectFetchParams) => Promise<AsyncSelectFetchResult>;
  columns?: ColumnsItem[];
  valueKey?: string;
  labelKey?: string;
  dragKey?: string;
  activeValue?: string | number | boolean;
  inactiveValue?: string | number | boolean;
  precision?: number;
  min?: number;
  max?: number;
}

/******************************** 组件入参 ********************************/

const props = withDefaults(defineProps<GenericEntityFormProps>(), {
  visible: false,
  entityKey: '',
  record: null,
  recordList: () => [],
  initialIndex: 0,
});

const emit = defineEmits<{
  'update:visible': [value: boolean];
  save: [];
  cancel: [];
}>();

const { t } = useI18n();

/******************************** 基础状态 ********************************/

const formRef = ref<FormInstance>();
const loading = ref<boolean>(false);
const submitLoading = ref<boolean>(false);
const rawFieldRows = ref<Record<string, any>[]>([]);
const formData = reactive<Record<string, any>>({});

const drawerVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
});

const entityKey = computed(() => {
  return props.entityKey || '';
});

const submitter = computed(() =>
  entityKey.value ? getEntityFormSubmitter(entityKey.value) : null
);
const childTables = computed(
  () => getEntityTableConfig(entityKey.value).children ?? []
);
const hasChildTables = computed(() => childTables.value.length > 0);
const drawerSize = computed(() => (hasChildTables.value ? '1080px' : '560px'));
const activeChildTab = ref<string>('');
const resolvedChildTables = computed(() => {
  return childTables.value.map((item, index) => ({
    key: `${item.entityKey}-${index}`,
    label: item.label || item.labelKey || item.entityKey,
    config: item,
  }));
});
const showChildTabs = computed(() => resolvedChildTables.value.length > 1);

const drawerTitle = computed(() => {
  const title =
    getEntityConfig(entityKey.value)?.title ||
    entityKey.value ||
    t('common.pleaseSelect');

  if (props.isCreate && props.record) {
    return `${title}${t('common.copy')}`;
  }
  return props.isCreate
    ? `${title}${t('common.add')}`
    : `${title}${t('common.edit')}`;
});

const visibleFields = computed<GenericEntityField[]>(() =>
  rawFieldRows.value
    .slice()
    .sort(
      (a, b) =>
        Number(resolveFieldValue(a, 'sort', 'sort') ?? 0) -
        Number(resolveFieldValue(b, 'sort', 'sort') ?? 0)
    )
    .map((field) => normalizeField(field))
    .filter((field): field is GenericEntityField => field != null)
);

const formRules = computed<FormRules<Record<string, any>>>(() => {
  return visibleFields.value.reduce<FormRules<Record<string, any>>>(
    (rules, field) => {
      if (!field.required) return rules;

      rules[field.key] = [
        {
          required: true,
          message: t('validation.required', { field: field.label }),
          trigger: field.component === 'async-select' ? 'change' : 'blur',
        },
      ];
      return rules;
    },
    {}
  );
});

/******************************** 字段处理 ********************************/

// 兼容字段配置的 camelCase 与 snake_case
function resolveFieldValue(
  field: Record<string, any>,
  camelKey: string,
  snakeKey: string
) {
  return field[camelKey] ?? field[snakeKey];
}

// 规范化字段 key
function resolveFieldKey(field: Record<string, any>) {
  const key =
    resolveFieldValue(field, 'fieldKey', 'field_key') ??
    field.dataKey ??
    field.key;
  return key ? snakeToCamel(String(key)) : '';
}

// 规范化字段名称
function resolveFieldLabel(field: Record<string, any>, key: string) {
  return String(
    resolveFieldValue(field, 'fieldName', 'field_name') ?? field.title ?? key
  );
}

// 解析字段组件类型
function resolveFieldComponent(
  field: Record<string, any>,
  key: string
): GenericFieldComponent {
  const rawType = String(
    resolveFieldValue(field, 'fieldType', 'field_type') ??
      field.component ??
      field.htmlType ??
      field.dataType ??
      field.fixedType ??
      field.select?.fixedType ??
      ''
  ).toLowerCase();

  if (
    rawType.includes('textarea') ||
    /remark|desc|description|content/i.test(key)
  ) {
    return 'textarea';
  }

  if (rawType.includes('date') || /date|time/i.test(key)) {
    if (rawType.includes('time')) {
      return 'datetime';
    }
    return 'date';
  }

  if (rawType.includes('switch')) {
    return 'switch';
  }

  if (
    rawType.includes('number') ||
    rawType.includes('int') ||
    rawType.includes('float') ||
    rawType.includes('double') ||
    /count|num|amount|price|size/i.test(key)
  ) {
    return 'number';
  }

  if (
    rawType.includes('select') ||
    resolveFieldValue(field, 'selectEntityKey', 'select_entity_key') ||
    resolveFieldValue(field, 'dictCode', 'dict_code')
  ) {
    return 'async-select';
  }

  return 'input';
}

// 解析布尔配置
function resolveBoolean(value: unknown) {
  return (
    value === true ||
    value === 1 ||
    value === '1' ||
    value === 'true' ||
    value === 'Y'
  );
}

// 解析静态下拉项
function resolveStaticOptions(field: Record<string, any>) {
  const options = field.select?.options ?? field.options ?? [];

  if (Array.isArray(options)) {
    return options.filter(Boolean);
  }

  if (typeof options === 'string') {
    try {
      const parsed = JSON.parse(options);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

// 构建静态下拉查询
function buildStaticAsyncFetcher(options: Record<string, any>[]) {
  return async (
    params: AsyncSelectFetchParams
  ): Promise<AsyncSelectFetchResult> => {
    const keyword = String(params.keyword ?? '')
      .trim()
      .toLowerCase();
    const filtered = options.filter((item) => {
      if (!keyword) return true;

      const label = String(item.label ?? item.name ?? item.title ?? '');
      const value = String(item.value ?? item.id ?? '');
      return (
        label.toLowerCase().includes(keyword) ||
        value.toLowerCase().includes(keyword)
      );
    });

    const start = (params.page - 1) * params.pageSize;
    return {
      items: filtered.slice(start, start + params.pageSize),
      total: filtered.length,
    };
  };
}

// 构建静态下拉列
function buildStaticColumns(field: Record<string, any>) {
  const labelKey = String(field.labelKey ?? field.select?.labelKey ?? 'label');
  const dragKey = String(field.dragKey ?? field.select?.dragKey ?? '');
  const columns: ColumnsItem[] = [
    {
      key: labelKey,
      dataKey: labelKey,
      title: String(
        resolveFieldValue(field, 'fieldName', 'field_name') ?? '名称'
      ),
      width: 180,
    },
  ];

  if (dragKey) {
    columns.push({
      key: dragKey,
      dataKey: dragKey,
      title: t('common.keyword'),
      width: 200,
    });
  }

  return columns;
}

// 规范化字段配置
function normalizeField(field: Record<string, any>) {
  const key = resolveFieldKey(field);
  if (!key) return null;
  const visibleValue = resolveFieldValue(field, 'isVisible', 'is_visible');
  if (visibleValue === false || visibleValue === 0 || visibleValue === '0') {
    return null;
  }

  let component = resolveFieldComponent(field, key);
  const label = resolveFieldLabel(field, key);
  const staticOptions = resolveStaticOptions(field);
  const entityConfig =
    component === 'async-select' ? buildAsyncSelectConfig(field) : undefined;
  const fetcher =
    component === 'async-select' && staticOptions.length
      ? buildStaticAsyncFetcher(staticOptions)
      : undefined;
  const columns =
    component === 'async-select' && staticOptions.length
      ? buildStaticColumns(field)
      : undefined;

  if (component === 'async-select' && !entityConfig?.entityKey && !fetcher) {
    component = 'input';
  }

  return {
    key,
    label,
    component,
    required: resolveBoolean(field.required ?? field.isRequired ?? false),
    placeholder:
      field.placeholder ??
      (component === 'async-select'
        ? t('validation.selectField', { field: label })
        : t('validation.enterField', { field: label })),
    entityConfig,
    fetcher,
    columns,
    multiple: resolveBoolean(
      field.multiple ?? field.isMultiple ?? field.select?.multiple
    ),
    valueKey: String(field.valueKey ?? field.select?.valueKey ?? 'value'),
    labelKey: String(field.labelKey ?? field.select?.labelKey ?? 'label'),
    dragKey: String(field.dragKey ?? field.select?.dragKey ?? ''),
    activeValue: field.activeValue ?? '0',
    inactiveValue: field.inactiveValue ?? '1',
    precision: field.precision == null ? undefined : Number(field.precision),
    min: field.min == null ? undefined : Number(field.min),
    max: field.max == null ? undefined : Number(field.max),
  } satisfies GenericEntityField;
}

// 构建异步下拉配置
function buildAsyncSelectConfig(
  field: Record<string, any>
): AsyncSelectEntityConfig {
  return {
    entityKey: String(
      resolveFieldValue(field, 'selectEntityKey', 'select_entity_key') ??
        resolveFieldValue(field, 'dictCode', 'dict_code') ??
        ''
    ),
  };
}

/******************************** 数据方法 ********************************/

// 加载字段配置
async function loadFieldRows() {
  if (!entityKey.value) return;

  loading.value = true;

  try {
    const response = (await getByEntityKeyAndFieldKeyApi(
      entityKey.value
    )) as unknown as {
      data?: Record<string, any>[];
    };

    rawFieldRows.value = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    rawFieldRows.value = [];
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    loading.value = false;
  }
}

// 根据字段同步默认值
function syncFormData() {
  const nextData: Record<string, any> = {};

  for (const field of visibleFields.value) {
    const recordValue = props.record?.[field.key];

    if (recordValue !== undefined) {
      nextData[field.key] = recordValue;
      continue;
    }

    if (field.component === 'switch') {
      nextData[field.key] = field.activeValue;
      continue;
    }

    if (field.component === 'async-select') {
      nextData[field.key] = field.multiple ? [] : null;
      continue;
    }

    if (field.component === 'number') {
      nextData[field.key] = null;
      continue;
    }

    nextData[field.key] = '';
  }

  Object.keys(formData).forEach((key) => {
    delete formData[key];
  });
  Object.assign(formData, nextData);
}

// 提交通用表单
async function submitForm() {
  if (!formRef.value) return;

  await formRef.value.validate();
  submitLoading.value = true;

  try {
    if (submitter.value && entityKey.value) {
      const payload: EntityFormSubmitContext = {
        entityKey: entityKey.value,
        isCreate: props.isCreate,
        record: props.record,
        data: { ...formData },
      };
      await submitter.value(payload);
    }

    emit('save');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    submitLoading.value = false;
  }
}

// 关闭抽屉
function onCancel() {
  drawerVisible.value = false;
  emit('cancel');
}

/******************************** 监听 ********************************/

watch(
  drawerVisible,
  async (visible) => {
    if (!visible) return;
    await loadFieldRows();
    activeChildTab.value = resolvedChildTables.value[0]?.key ?? '';
  },
  { immediate: true }
);

watch(
  () => [visibleFields.value, props.record, props.isCreate] as const,
  () => {
    syncFormData();
    formRef.value?.clearValidate();
  },
  { deep: true, immediate: true }
);
</script>

<style scoped lang="scss">
.generic-entity-form {
  display: flex;
  position: relative;
  flex-direction: column;
  min-height: 100%;
  padding-left: 14px;
}

.generic-entity-form__form {
  :deep(.el-form-item) {
    margin-bottom: 24px;
  }
}

.generic-entity-form__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: auto;
  padding-top: 12px;
}

.generic-entity-form__children {
  padding-top: 8px;
}

.generic-entity-form__tabs:deep(.el-tabs__header) {
  margin-bottom: 8px;
}

</style>
