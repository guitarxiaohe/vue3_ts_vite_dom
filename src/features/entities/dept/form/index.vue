<script setup lang="ts">
import GenericEntityForm from '@/features/entities/_shared/generic-entity-form.vue';
import type {
  EntityFormProps,
  EntityFormEmits,
} from '@/features/entities/_shared/types';

/******************************** 部门表单 ********************************/

const props = defineProps<EntityFormProps>();
const emit = defineEmits<EntityFormEmits>();
</script>

<template>
  <GenericEntityForm
    :visible="props.visible"
    :is-create="props.isCreate"
    :record="props.record"
    :record-list="props.recordList"
    :initial-index="props.initialIndex"
    entity-key="dept"
    @update:visible="emit('update:visible', $event)"
    @save="emit('save')"
    @cancel="emit('cancel')"
  />
</template>
