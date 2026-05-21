<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import SimpleEntityForm from '@/features/entities/_shared/simple-entity-form.vue';
import type {
  EntityFormProps,
  EntityFormEmits,
} from '@/features/entities/_shared/types';
import { getDictDataFormFields } from './constants';

/******************************** 字典值表单 ********************************/

const props = defineProps<EntityFormProps>();
const emit = defineEmits<EntityFormEmits>();
const { t } = useI18n();

const fields = computed(() => getDictDataFormFields(t));
</script>

<template>
  <SimpleEntityForm
    :visible="props.visible"
    :is-create="props.isCreate"
    :record="props.record"
    :record-list="props.recordList"
    :initial-index="props.initialIndex"
    entity-key="dictData"
    :entity-name="t('entity.dictData.title')"
    :fields="fields"
    :columns="2"
    @update:visible="emit('update:visible', $event)"
    @save="emit('save')"
    @cancel="emit('cancel')"
  />
</template>
