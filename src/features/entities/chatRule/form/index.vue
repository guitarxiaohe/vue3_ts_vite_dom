<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import DetailDrawer from '@/features/form-shell/components/form-drawer.vue';
import { mapEntityFormFields } from '@/features/entities/_shared/form-field-adapter';
import { getEntityTableConfig } from '@/utils/entity-config';
import type {
  EntityFormEmits,
  EntityFormProps,
} from '@/features/entities/_shared/types';
import { getChatRuleFormFields } from './constants';
import { addChatRuleApi, editChatRuleApi } from '../services';

/******************************** AI 规则表单 ********************************/

const props = defineProps<EntityFormProps>();
const emit = defineEmits<EntityFormEmits>();
const { t } = useI18n();

/******************************** 表单状态 ********************************/

const submitLoading = ref<boolean>(false);
const formData = ref<Record<string, unknown>>({});

const formFields = computed(() =>
  mapEntityFormFields(getChatRuleFormFields(t))
);
const formChildren = computed(
  () => getEntityTableConfig('chatRule').children ?? []
);
const resolvedRowKey = computed(() => {
  const config = getEntityTableConfig('chatRule');
  return config.rowKey || 'id';
});
const drawerTitle = computed(() => {
  if (props.isCreate && props.record) {
    return `${t('common.copy')}${t('entity.chatRule.title')}`;
  }

  return props.isCreate
    ? `${t('common.add')}${t('entity.chatRule.title')}`
    : `${t('common.edit')}${t('entity.chatRule.title')}`;
});

/******************************** 数据方法 ********************************/

// 保存规则表单
async function handleSave(data: Record<string, unknown>) {
  submitLoading.value = true;

  try {
    const id =
      props.record?.id ?? props.record?.[resolvedRowKey.value] ?? undefined;

    if (props.isCreate || id == null) {
      await addChatRuleApi(data as any);
    } else {
      await editChatRuleApi({ ...data, ruleId: id } as any);
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
