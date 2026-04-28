<script setup lang="ts">
import { computed, toRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { AsyncSelect } from '@/components/async-select';
import { AsyncCascader } from '@/components/async-cascader';
import { useFormValidation } from '../composables/use-form-validation';
import type { DetailField, DetailRecord } from '../types/detail';
import FileUpload from '@/components/file-upload/file-upload.vue';
import type { EntityFormField } from '@/features/entities/_shared/types';

/******************************** 类型定义 ********************************/

interface FormDrawerFormProps {
  fields?: DetailField[];
  columns?: number;
  isCreate?: boolean;
}

/******************************** 组件入参 ********************************/

const props = withDefaults(defineProps<FormDrawerFormProps>(), {
  fields: () => [] as DetailField[],
  columns: 1,
  isCreate: false,
});

const { t } = useI18n();
const formData = defineModel<DetailRecord>('formData', { required: true });

/******************************** 表单状态 ********************************/

const { formRef, rules, isFieldDisabled, validate, INT_MAX, INT_MIN } =
  useFormValidation(formData, toRef(props, 'fields'), toRef(props, 'isCreate'));

const columnsCount = computed(() => {
  const count = Number(props.columns ?? 1) || 1;
  return Math.max(1, Math.min(2, Math.floor(count)));
});

const colSpan = computed(() => (columnsCount.value === 1 ? 24 : 12));

const visibleFields = computed(() => {
  return (props.fields ?? []).filter((field) => {
    if (props.isCreate && field.hideOnCreate) return false;
    if (!props.isCreate && field.hideOnEdit) return false;
    return true;
  });
});

/******************************** 展示方法 ********************************/

// 获取输入占位文案
function resolveInputPlaceholder(field: DetailField) {
  return (
    field.placeholder || t('validation.enterField', { field: field.label })
  );
}

// 获取选择占位文案
function resolveSelectPlaceholder(field: DetailField) {
  return (
    field.placeholder || t('validation.selectField', { field: field.label })
  );
}

defineExpose({ validate, formRef });
</script>

<template>
  <el-form
    ref="formRef"
    :rules="rules"
    label-position="top"
    :model="formData"
    :inline="false"
  >
    <div class="form-container">
      <!-------------------------- 栅格表单 -------------------------->
      <el-row :gutter="16">
        <template v-for="field in visibleFields" :key="field.prop">
          <el-col :span="colSpan">
            <el-form-item :label="field.label" :prop="field.prop">
              <el-select
                v-if="field.type === 'select'"
                v-model="formData[field.prop]"
                :placeholder="resolveSelectPlaceholder(field)"
                :disabled="isFieldDisabled(field)"
                :multiple="field.multiple"
                style="width: 100%"
              >
                <el-option
                  v-for="option in field.options || []"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>

              <AsyncSelect
                v-else-if="
                  field.type === 'async-select' && field.asyncSelectConfig
                "
                v-model="formData[field.prop]"
                :fetcher="field.asyncSelectConfig.fetcher"
                :entity-config="field.asyncSelectConfig.entityConfig"
                :columns="field.asyncSelectConfig.columns"
                :value-key="field.asyncSelectConfig.valueKey"
                :label-key="field.asyncSelectConfig.labelKey"
                :drag-key="field.asyncSelectConfig.dragKey"
                :placeholder="resolveSelectPlaceholder(field)"
                :disabled="isFieldDisabled(field)"
                :multiple="field.multiple"
                :dialog-title="field.label"
              />

              <FileUpload
                v-else-if="field.type === 'fileUpload'"
                v-bind="fileConfig"
              />
              <AsyncCascader
                v-else-if="
                  field.type === 'async-cascader' && field.asyncCascaderConfig
                "
                v-model="formData[field.prop]"
                :fetcher="field.asyncCascaderConfig.fetcher"
                :entity-config="field.asyncCascaderConfig.entityConfig"
                :props-map="field.asyncCascaderConfig.propsMap"
                :clearable="field.asyncCascaderConfig.clearable"
                :check-strictly="field.asyncCascaderConfig.checkStrictly"
                :emit-path="field.asyncCascaderConfig.emitPath"
                :show-all-levels="field.asyncCascaderConfig.showAllLevels"
                :placeholder="resolveSelectPlaceholder(field)"
                :disabled="isFieldDisabled(field)"
              />

              <el-radio-group
                v-else-if="field.type === 'radio'"
                v-model="formData[field.prop]"
                :disabled="isFieldDisabled(field)"
              >
                <el-radio
                  v-for="option in field.options || []"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </el-radio>
              </el-radio-group>

              <el-checkbox-group
                v-else-if="field.type === 'checkbox'"
                v-model="formData[field.prop]"
                :disabled="isFieldDisabled(field)"
              >
                <el-checkbox
                  v-for="option in field.options || []"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </el-checkbox>
              </el-checkbox-group>

              <el-date-picker
                v-else-if="field.type === 'date' || field.type === 'datetime'"
                v-model="formData[field.prop]"
                :type="field.type"
                :placeholder="resolveSelectPlaceholder(field)"
                :disabled="isFieldDisabled(field)"
                :value-format="
                  field.type === 'datetime'
                    ? 'YYYY-MM-DD HH:mm:ss'
                    : 'YYYY-MM-DD'
                "
                style="width: 100%"
              />

              <el-input-number
                v-else-if="field.type === 'number'"
                v-model="formData[field.prop]"
                :placeholder="resolveInputPlaceholder(field)"
                :disabled="isFieldDisabled(field)"
                :min="field.min ?? INT_MIN"
                :max="field.max ?? INT_MAX"
                style="width: 100%"
                controls-position="right"
              />

              <el-switch
                v-else-if="field.type === 'switch'"
                v-model="formData[field.prop]"
                :disabled="isFieldDisabled(field)"
              />

              <el-input
                v-else
                v-model="formData[field.prop]"
                :placeholder="resolveInputPlaceholder(field)"
                :disabled="isFieldDisabled(field)"
                :type="field.type === 'textarea' ? 'textarea' : 'text'"
                :rows="field.type === 'textarea' ? 5 : undefined"
                clearable
              />
            </el-form-item>
          </el-col>
        </template>
      </el-row>
    </div>
  </el-form>
</template>

<style scoped lang="scss">
.form-container {
  padding: 0;
  overflow-x: hidden;
}

.el-form {
  .el-form-item {
    margin-bottom: 24px;
  }
}
</style>
