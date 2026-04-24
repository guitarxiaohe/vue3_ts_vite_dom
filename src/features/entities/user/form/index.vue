<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import DetailDrawer from '@/features/form-shell/components/form-drawer.vue';
import { mapEntityFormFields } from '@/features/entities/_shared/form-field-adapter';
import { getUserFormFields } from './constants';
import { getEntityTableConfig } from '@/utils/entity-config';
import type {
  EntityFormEmits,
  EntityFormProps,
} from '@/features/entities/_shared/types';

/******************************** 类型定义 ********************************/

/******************************** 组件入参 ********************************/

const props = defineProps<EntityFormProps>();
const emit = defineEmits<EntityFormEmits>();

const { t } = useI18n();

/******************************** 表单状态 ********************************/

const submitLoading = ref<boolean>(false);
const formData = ref<Record<string, unknown>>({});
const formFields = computed(() => mapEntityFormFields(getUserFormFields(t)));
const formChildren = computed(
  () => getEntityTableConfig(props.entityKey ?? 'user').children ?? []
);

const drawerTitle = computed(() => {
  if (props.isCreate && props.record) {
    return `${t('common.copy')}${t('menu.user')}`;
  }
  return props.isCreate
    ? `${t('common.add')}${t('menu.user')}`
    : `${t('common.edit')}${t('menu.user')}`;
});

// 提交部门表单
async function handleSave(data: Record<string, unknown>) {
  submitLoading.value = true;

  try {
    await new Promise((resolve) => window.setTimeout(resolve, 200));
    emit('save', data);
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
    :columns="1"
    :saving="submitLoading"
    :title="drawerTitle"
    :child-tables="formChildren"
    @save="handleSave"
    @cancel="onCancel"
    @update:visible="emit('update:visible', $event)"
  />
</template>
