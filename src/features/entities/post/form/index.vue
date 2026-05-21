<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import SimpleEntityForm from '@/features/entities/_shared/simple-entity-form.vue';
import type {
  EntityFormProps,
  EntityFormEmits,
} from '@/features/entities/_shared/types';
import { getPostFormFields } from './constants';

/******************************** 岗位表单 ********************************/

const props = defineProps<EntityFormProps>();
const emit = defineEmits<EntityFormEmits>();
const { t } = useI18n();

const fields = computed(() => getPostFormFields(t));
</script>

<template>
  <SimpleEntityForm
    :visible="props.visible"
    :is-create="props.isCreate"
    :record="props.record"
    :record-list="props.recordList"
    :initial-index="props.initialIndex"
    entity-key="post"
    :entity-name="t('entity.post.title')"
    :fields="fields"
    @update:visible="emit('update:visible', $event)"
    @save="emit('save')"
    @cancel="emit('cancel')"
  />
</template>
