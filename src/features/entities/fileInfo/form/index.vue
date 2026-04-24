<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import DetailDrawer from '@/features/form-shell/components/form-drawer.vue';
import { mapEntityFormFields } from '@/features/entities/_shared/form-field-adapter';
import { getFileInfoFormFields } from './constants';
import { getEntityTableConfig } from '@/utils/entity-config';
import type {
  EntityFormEmits,
  EntityFormProps,
} from '@/features/entities/_shared/types';
import type { SysFileInfo } from '@/types/fileInfo';
import {
  addFileInfo,
  assertAjaxOk,
  updateFileInfo,
} from '@/api/modules/fileInfo';

/******************************** 类型定义 ********************************/

/******************************** 组件入参 ********************************/

const props = defineProps<EntityFormProps>();
const emit = defineEmits<EntityFormEmits>();

const { t } = useI18n();

/******************************** 表单状态 ********************************/

const submitLoading = ref<boolean>(false);
const formData = ref<Record<string, unknown>>({});
const formFields = computed(() => mapEntityFormFields(getFileInfoFormFields(t)));
const formChildren = computed(
  () => getEntityTableConfig(props.entityKey ?? 'fileInfo').children ?? []
);

const drawerTitle = computed(() => {
  if (props.isCreate && props.record) {
    return t('fileInfo.dialog.copy');
  }
  return props.isCreate
    ? t('fileInfo.dialog.add')
    : t('fileInfo.dialog.edit');
});

/******************************** 数据方法 ********************************/

// 提交文件表单
async function handleSave(data: Record<string, unknown>) {
  submitLoading.value = true;

  try {
    if (props.isCreate) {
      const response = await addFileInfo(data as SysFileInfo);
      assertAjaxOk(response as { code?: number; msg?: string });
    } else {
      const response = await updateFileInfo(data as SysFileInfo);
      assertAjaxOk(response as { code?: number; msg?: string });
    }

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
