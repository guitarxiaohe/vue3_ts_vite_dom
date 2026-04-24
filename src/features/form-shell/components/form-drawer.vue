<script setup lang="ts">
import { computed, nextTick, ref, toRef, watch } from 'vue';
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import FormDrawerForm from './form-drawer-form.vue';
import type { DetailField, DetailRecord } from '../types/detail';

/******************************** 类型定义 ********************************/

interface FormDrawerProps {
  visible: boolean;
  record?: DetailRecord;
  recordList?: DetailRecord[];
  fields?: DetailField[];
  columns?: number;
  initialIndex?: number;
  title?: string;
  isCreate?: boolean;
  size?: string;
  saving?: boolean;
  showNavigation?: boolean;
  formData?: DetailRecord;
  saveText?: string;
}

interface FormDrawerFormInstance {
  validate: () => Promise<boolean>;
  formRef: {
    clearValidate: (fields?: string[]) => void;
  } | null;
}

/******************************** 组件入参 ********************************/

const props = withDefaults(defineProps<FormDrawerProps>(), {
  record: undefined,
  recordList: () => [],
  fields: () => [] as DetailField[],
  columns: 1,
  initialIndex: 0,
  title: '',
  isCreate: false,
  size: '456px',
  saving: false,
  showNavigation: true,
  formData: undefined,
  saveText: '',
});

const emits = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'save', record: DetailRecord, index: number): void;
  (e: 'cancel'): void;
  (e: 'index-change', index: number): void;
  (e: 'update:form-data', value: DetailRecord): void;
}>();

const { t } = useI18n();

/******************************** 基础状态 ********************************/

const formComp = ref<FormDrawerFormInstance | null>(null);
const internalFormData = ref<DetailRecord>({});
const currentIndex = ref<number>(props.initialIndex ?? 0);
const syncingFromOuter = ref<boolean>(false);

const resolvedTitle = computed(() => props.title || t('common.detail'));
const total = computed(() => props.recordList?.length ?? 0);
const isFirst = computed(() => currentIndex.value <= 0);
const isLast = computed(() => currentIndex.value >= total.value - 1);
const showNavigation = computed(() => {
  return props.showNavigation && !props.isCreate && total.value > 1;
});

/******************************** 数据方法 ********************************/

// 清除表单校验
function clearFormValidation() {
  formComp.value?.formRef?.clearValidate();
}

// 获取字段默认值
function getInitialValueByField(field: DetailField) {
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }
  if (field.type === 'number') {
    return undefined;
  }
  if (field.type === 'checkbox') {
    return [];
  }
  if (
    field.type === 'select' ||
    field.type === 'async-select' ||
    field.type === 'radio'
  ) {
    return field.multiple ? [] : '';
  }
  if (field.type === 'switch') {
    return false;
  }
  return '';
}

// 提取表单字段值
function extractFormFields(
  record: DetailRecord | undefined,
  includeNonCopyable = false
) {
  const result: DetailRecord = {};

  (props.fields ?? []).forEach((field) => {
    if (!record) {
      result[field.prop] = getInitialValueByField(field);
      return;
    }

    if (props.isCreate && !includeNonCopyable && field.copyable === false) {
      result[field.prop] = getInitialValueByField(field);
      return;
    }

    const value = record[field.prop];
    result[field.prop] =
      value !== undefined ? value : getInitialValueByField(field);
  });

  return result;
}

// 获取当前编辑记录
function getCurrentRecord() {
  if (props.isCreate) {
    return props.record;
  }

  const listRecord = props.recordList?.[currentIndex.value];
  return listRecord ?? props.record;
}

// 同步当前表单数据
async function loadCurrent() {
  const record = getCurrentRecord();

  if (props.isCreate) {
    internalFormData.value = extractFormFields(record);
  } else {
    internalFormData.value = extractFormFields(record, true);
  }

  await nextTick();
  clearFormValidation();
}

// 保存表单
async function handleSave() {
  if (formComp.value) {
    try {
      await formComp.value.validate();
    } catch {
      ElMessage.warning(t('form.validationFailed'));
      return;
    }
  }

  emits('save', { ...internalFormData.value }, props.isCreate ? -1 : currentIndex.value);
}

// 取消编辑
function handleCancel() {
  clearFormValidation();
  emits('update:visible', false);
  emits('cancel');
}

// 切换上一条
function handlePrev() {
  if (isFirst.value) return;
  currentIndex.value -= 1;
}

// 切换下一条
function handleNext() {
  if (isLast.value) return;
  currentIndex.value += 1;
}

/******************************** 监听 ********************************/

watch(
  () => props.formData,
  (value) => {
    if (!value || syncingFromOuter.value) return;
    internalFormData.value = { ...value };
  },
  { deep: true }
);

watch(
  internalFormData,
  (value) => {
    syncingFromOuter.value = true;
    emits('update:form-data', value);
    nextTick(() => {
      syncingFromOuter.value = false;
    });
  },
  { deep: true }
);

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) {
      clearFormValidation();
      return;
    }

    currentIndex.value = props.initialIndex ?? 0;
    await loadCurrent();
  },
  { immediate: true }
);

watch(
  () => props.record,
  async () => {
    if (!props.visible) return;
    await loadCurrent();
  },
  { deep: true }
);

watch(currentIndex, async (value) => {
  if (!props.visible || props.isCreate) return;
  emits('index-change', value);
  await loadCurrent();
});
</script>

<template>
  <el-drawer
    :model-value="props.visible"
    :title="resolvedTitle"
    :size="props.size"
    direction="rtl"
    @close="() => emits('update:visible', false)"
  >
    <div class="form-drawer">
      <!-------------------------- 记录切换 -------------------------->
      <div v-if="showNavigation" class="form-drawer__nav">
        <el-button :icon="ArrowUp" circle :disabled="isFirst" @click="handlePrev" />
        <el-button
          :icon="ArrowDown"
          circle
          :disabled="isLast"
          @click="handleNext"
        />
      </div>

      <!-------------------------- 表单内容 -------------------------->
      <FormDrawerForm
        ref="formComp"
        v-model:form-data="internalFormData"
        :fields="props.fields"
        :columns="props.columns"
        :is-create="props.isCreate"
      />

      <!-------------------------- 底部操作 -------------------------->
      <div class="form-drawer__footer">
        <el-button @click="handleCancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="props.saving" @click="handleSave">
          {{ props.saveText || t('common.save') }}
        </el-button>
      </div>
    </div>
  </el-drawer>
</template>

<style scoped lang="scss">
.form-drawer {
  position: relative;
  min-height: 100%;
  padding-left: 14px;
}

.form-drawer__nav {
  position: absolute;
  top: 6px;
  left: -6px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-drawer__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
  padding-top: 16px;
}
</style>
