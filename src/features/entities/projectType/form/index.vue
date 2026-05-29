<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import DetailDrawer from '@/features/form-shell/components/form-drawer.vue';
import { mapEntityFormFields } from '@/features/entities/_shared/form-field-adapter';
import { getUserFormFields } from './constants';
import type {
  EntityFormEmits,
  EntityFormProps,
} from '@/features/entities/_shared/types';
import {
  createProjectType,
  editProjectType,
  type CreateProjectTypePayload,
  type EditProjectTypePayload,
} from './service';

/******************************** 类型定义 ********************************/

/******************************** 组件入参 ********************************/

const props = defineProps<EntityFormProps>();
const emit = defineEmits<EntityFormEmits>();

const { t } = useI18n();

/******************************** 表单状态 ********************************/

const submitLoading = ref<boolean>(false);
const optionsLoading = ref<boolean>(false);
const formData = ref<Record<string, unknown>>({});
const formFields = computed(() => mapEntityFormFields(getUserFormFields(t)));

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
    const payload: CreateProjectTypePayload = {
      typeName: String(data.typeName ?? '').trim(),
      typeCode: String(data.typeCode ?? '').trim(),
      remark: String(data.remark ?? '').trim(),
    };
    await createProjectType(payload);
    emit('save');
    emit('update:visible', false);
  } finally {
    submitLoading.value = false;
  }
}

const handEdit = async (data: Record<string, unknown>) => {
  try {
    const payload: EditProjectTypePayload = {
      typeId: data.typeId as string,
      typeName: String(data.typeName ?? '').trim(),
      typeCode: String(data.typeCode ?? '').trim(),
      remark: String(data.remark ?? '').trim(),
    };

    await editProjectType(payload);
    emit('save');
    emit('update:visible', false);
  } finally {
    submitLoading.value = false;
  }
};

// 关闭抽屉
function onCancel() {
  emit('update:visible', false);
  emit('cancel');
}

const save = (data: Record<string, unknown>) => {
  props.isCreate ? handleSave(data) : handEdit(data);
};

/******************************** 监听 ********************************/
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
    :saving="submitLoading || optionsLoading"
    :title="drawerTitle"
    @save="save"
    @cancel="onCancel"
    @update:visible="emit('update:visible', $event)"
  />
</template>
