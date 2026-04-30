<script setup lang="ts">
import { computed, ref } from 'vue';
import { type FormInstance, type FormRules } from 'element-plus';
import { useI18n } from 'vue-i18n';
import DetailDrawer from '@/features/form-shell/components/form-drawer.vue';
import type {
  EntityFormEmits,
  EntityFormProps,
} from '@/features/entities/_shared/types';
import type { DictClassValue, DictFormData } from '@/types/dict';
import { useDictBundleForm } from '../composables/use-dict-bundle-form';
import DictItemTable from './components/dict-item-table.vue';

/******************************** 组件入参 ********************************/

const props = defineProps<EntityFormProps>();
const emit = defineEmits<EntityFormEmits>();
const { t } = useI18n();

/******************************** 基础状态 ********************************/

const parentFormRef = ref<FormInstance>();
const {
  saving,
  parentForm,
  childItems,
  childItemsLoading,
  syncFormState,
  clearParentValidation,
  validateParentForm,
  handleSave,
} = useDictBundleForm(props, emit, parentFormRef);

const drawerTitle = computed(() => {
  if (props.isCreate && props.record) {
    return t('dictPage.copyTitle');
  }

  return props.isCreate ? t('dictPage.createTitle') : t('dictPage.editTitle');
});

const dictClassOptions = computed<
  Array<{ label: string; value: DictClassValue }>
>(() => [
  { label: t('dictPage.classSystem'), value: 'system' },
  { label: t('dictPage.classBusiness'), value: 'business' },
]);

const parentRules = computed<FormRules<DictFormData>>(() => ({
  dictType: [
    {
      required: true,
      message: t('validation.enterField', { field: t('dictPage.dictType') }),
      trigger: 'blur',
    },
  ],
  dictName: [
    {
      required: true,
      message: t('validation.enterField', { field: t('dictPage.dictName') }),
      trigger: 'blur',
    },
  ],
  dictClass: [
    {
      required: true,
      message: t('validation.selectField', { field: t('dictPage.dictClass') }),
      trigger: 'change',
    },
  ],
}));

function handleIndexChange(index: number) {
  const record = props.recordList?.[index] ?? props.record;
  syncFormState(record);
}

// 关闭主抽屉
function handleCancel() {
  emit('update:visible', false);
  emit('cancel');
}
</script>

<template>
  <DetailDrawer
    v-model:form-data="parentForm"
    :visible="props.visible"
    :record="props.record"
    :record-list="props.recordList"
    :initial-index="props.initialIndex"
    :is-create="props.isCreate"
    :title="drawerTitle"
    :saving="saving"
    size="1120px"
    :custom-validate="validateParentForm"
    :custom-clear-validate="clearParentValidation"
    @save="handleSave"
    @cancel="handleCancel"
    @index-change="handleIndexChange"
    @update:visible="emit('update:visible', $event)"
  >
    <template #content>
      <div class="dict-form__content">
        <!-------------------------- 主表信息 -------------------------->
        <section class="dict-form__card">
          <div class="dict-form__section-title">
            {{ t('dictPage.basicSectionTitle') }}
          </div>

          <el-form
            ref="parentFormRef"
            :model="parentForm"
            :rules="parentRules"
            label-position="top"
            class="dict-form__grid"
          >
            <el-form-item :label="t('dictPage.dictType')" prop="dictType">
              <el-input
                v-model="parentForm.dictType"
                :placeholder="t('validation.enterField', { field: t('dictPage.dictType') })"
                clearable
              />
            </el-form-item>

            <el-form-item :label="t('dictPage.dictName')" prop="dictName">
              <el-input
                v-model="parentForm.dictName"
                :placeholder="t('validation.enterField', { field: t('dictPage.dictName') })"
                clearable
              />
            </el-form-item>

            <el-form-item :label="t('dictPage.dictClass')" prop="dictClass">
              <el-select
                v-model="parentForm.dictClass"
                :placeholder="t('validation.selectField', { field: t('dictPage.dictClass') })"
              >
                <el-option
                  v-for="item in dictClassOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item
              :label="t('dictPage.enabled')"
              class="dict-form__switch-cell"
            >
              <el-switch
                v-model="parentForm.status"
                active-value="0"
                inactive-value="1"
              />
            </el-form-item>
          </el-form>
        </section>
      </div>
    </template>

    <template #extra>
      <section class="dict-form__card">
        <DictItemTable
          :items="childItems"
          :loading="childItemsLoading"
          @update:items="childItems = $event"
        />
      </section>
    </template>
  </DetailDrawer>
</template>

<style scoped lang="scss">
.dict-form__content {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.dict-form__card {
  border-radius: 18px;
  padding: 20px 22px;
  background: var(--color-bg-card);
  border: 1px solid var(--el-border-color-lighter);
}

.dict-form__section-title {
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.dict-form__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0 16px;
}

.dict-form__switch-cell {
  min-width: 160px;
}

@media (max-width: 960px) {
  .dict-form__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .dict-form__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
