<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import DetailDrawer from '@/features/form-shell/components/form-drawer.vue';
import { mapEntityFormFields } from '@/features/entities/_shared/form-field-adapter';
import { getFieldConfigFormFields } from './constants';
import { getEntityTableConfig } from '@/utils/entity-config';
import type {
  EntityFormEmits,
  EntityFormProps,
} from '@/features/entities/_shared/types';
import {
  addFieldConfig,
  assertAjaxOk,
  updateFieldConfig,
} from '@/api/modules/fieldConfig';
import type { FieldConfig } from '@/types/field-config';

/******************************** 组件入参 ********************************/

const props = defineProps<EntityFormProps>();
const emit = defineEmits<EntityFormEmits>();
const { t } = useI18n();

/******************************** 表单状态 ********************************/

const submitLoading = ref<boolean>(false);
const formData = ref<Record<string, unknown>>({});
const formChildren = computed(
  () => getEntityTableConfig(props.entityKey ?? 'fieldConfig').children ?? []
);

const formFields = computed(() =>
  mapEntityFormFields(getFieldConfigFormFields(t))
);

const drawerTitle = computed(() => {
  if (props.isCreate && props.record) {
    return t('fieldConfig.copyTitle');
  }

  return props.isCreate
    ? t('fieldConfig.addTitle')
    : t('fieldConfig.editTitle');
});

/******************************** 提交方法 ********************************/

// 规范化提交数据
function normalizePayload(data: Record<string, unknown>): FieldConfig {
  const fixed = String(data.fixed ?? '').trim();

  return {
    ...(data as FieldConfig),
    sort: Number(data.sort ?? 0),
    isFuzzySearch: Number(data.isFuzzySearch ?? 0),
    isVisible: Number(data.isVisible ?? 1),
    fieldType: String(data.fieldType ?? 'input'),
    fieldRole: String(data.fieldRole ?? '').trim() || null,
    dictCode: String(data.dictCode ?? '').trim() || null,
    selectEntityKey: String(data.selectEntityKey ?? '').trim() || null,
    fixed: fixed ? (fixed as 'left' | 'right') : null,
  };
}

// 保存字段配置
async function handleSave(data: Record<string, unknown>) {
  submitLoading.value = true;

  try {
    const payload = normalizePayload(data);

    if (props.isCreate) {
      const response = await addFieldConfig(payload);
      assertAjaxOk(response as { code?: number; msg?: string });
    } else {
      const response = await updateFieldConfig(payload);
      assertAjaxOk(response as { code?: number; msg?: string });
    }

    emit('save', payload);
    emit('update:visible', false);
  } finally {
    submitLoading.value = false;
  }
}

// 关闭抽屉
function onCancel() {
  emit('update:visible', false);
  emit('cancel');
}
</script>

<template>
  <DetailDrawer
    v-model:form-data="formData"
    :record="props.record"
    :record-list="props.recordList"
    :initial-index="props.initialIndex"
    :visible="props.visible"
    :is-create="props.isCreate"
    :fields="formFields"
    :columns="2"
    :saving="submitLoading"
    :title="drawerTitle"
    :child-tables="formChildren"
    @save="handleSave"
    @cancel="onCancel"
    @update:visible="emit('update:visible', $event)"
  />
</template>
