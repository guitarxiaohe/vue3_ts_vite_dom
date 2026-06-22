<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import DetailDrawer from '@/features/form-shell/components/form-drawer.vue';
import { mapEntityFormFields } from '@/features/entities/_shared/form-field-adapter';
import { addChatKnowledgeApi, editChatKnowledgeApi } from '../services';
import { getEntityTableConfig } from '@/utils/entity-config';
import type {
  EntityFormEmits,
  EntityFormProps,
} from '@/features/entities/_shared/types';
import { getChatKnowledgeFormFields } from './constants';

/******************************** 知识库表单 ********************************/

const props = defineProps<EntityFormProps>();
const emit = defineEmits<EntityFormEmits>();
const { t } = useI18n();

/******************************** 表单状态 ********************************/

const submitLoading = ref<boolean>(false);
const formData = ref<Record<string, unknown>>({});

const formFields = computed(() =>
  mapEntityFormFields(getChatKnowledgeFormFields(t))
);
const formChildren = computed(
  () => getEntityTableConfig('chatKnowledge').children ?? []
);
const resolvedRowKey = computed(() => {
  const config = getEntityTableConfig('chatKnowledge');
  return config.rowKey || 'id';
});
const drawerTitle = computed(() => {
  if (props.isCreate && props.record) {
    return `${t('common.copy')}${t('entity.chatKnowledge.title')}`;
  }

  return props.isCreate
    ? `${t('common.add')}${t('entity.chatKnowledge.title')}`
    : `${t('common.edit')}${t('entity.chatKnowledge.title')}`;
});

/******************************** 数据方法 ********************************/

// 保存知识库表单
async function handleSave(data: Record<string, unknown>) {
  submitLoading.value = true;

  try {
    const id =
      props.record?.id ?? props.record?.[resolvedRowKey.value] ?? undefined;

    if (props.isCreate || id == null) {
      await addChatKnowledgeApi(data as any);
    } else {
      await editChatKnowledgeApi({ ...data, knowledgeId: id } as any);
    }

    emit('save', data);
    emit('update:visible', false);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
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
    :saving="submitLoading"
    :title="drawerTitle"
    :child-tables="formChildren"
    @save="handleSave"
    @cancel="onCancel"
    @update:visible="emit('update:visible', $event)"
  />
</template>
