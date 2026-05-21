<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import DetailDrawer from '@/features/form-shell/components/form-drawer.vue';
import { mapEntityFormFields } from './form-field-adapter';
import { addEntityRowApi, updateEntityRowApi } from '@/api/modules/dynamic-entity';
import { getEntityTableConfig } from '@/utils/entity-config';
import type { EntityFormField, EntityFormProps, EntityFormEmits } from './types';

/******************************** 组件入参 ********************************/

const props = withDefaults(
  defineProps<
    EntityFormProps & {
      entityName: string;
      fields: EntityFormField[];
      columns?: number;
    }
  >(),
  {
    entityKey: '',
    record: undefined,
    recordList: () => [],
    initialIndex: 0,
    columns: 1,
  }
);

const emit = defineEmits<EntityFormEmits>();
const { t } = useI18n();

/******************************** 表单状态 ********************************/

const submitLoading = ref<boolean>(false);
const formData = ref<Record<string, unknown>>({});

const formFields = computed(() => mapEntityFormFields(props.fields));
const formChildren = computed(
  () => getEntityTableConfig(props.entityKey ?? '').children ?? []
);
const resolvedRowKey = computed(() => {
  const config = getEntityTableConfig(props.entityKey ?? '');
  return config.rowKey || 'id';
});

const drawerTitle = computed(() => {
  if (props.isCreate && props.record) {
    return `${t('common.copy')}${props.entityName}`;
  }

  return props.isCreate
    ? `${t('common.add')}${props.entityName}`
    : `${t('common.edit')}${props.entityName}`;
});

/******************************** 数据方法 ********************************/

async function handleSave(data: Record<string, unknown>) {
  if (!props.entityKey) {
    ElMessage.error(t('common.failed'));
    return;
  }

  submitLoading.value = true;

  try {
    const id =
      props.record?.id ?? props.record?.[resolvedRowKey.value] ?? undefined;

    if (props.isCreate || id == null) {
      await addEntityRowApi(props.entityKey, data);
    } else {
      await updateEntityRowApi(props.entityKey, id as number | string, data);
    }

    emit('save', data);
    emit('update:visible', false);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    submitLoading.value = false;
  }
}

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
    :columns="props.columns"
    :saving="submitLoading"
    :title="drawerTitle"
    :child-tables="formChildren"
    @save="handleSave"
    @cancel="onCancel"
    @update:visible="emit('update:visible', $event)"
  />
</template>
