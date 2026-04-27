<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AsyncSelect from '@/components/async-select/async-select.vue';
import type { EntityFilterFieldConfig } from '@/types/entity-config';
import type { FilterFormValue } from '@/features/multiview/types';

/******************************** 组件入参 ********************************/

const props = withDefaults(
  defineProps<{
    fields: EntityFilterFieldConfig[];
    showSearchButton?: boolean;
    showResetButton?: boolean;
  }>(),
  {
    showSearchButton: true,
    showResetButton: true,
  }
);

const emit = defineEmits<{
  search: [];
  reset: [];
}>();

const { t } = useI18n();
const formModel = defineModel<Record<string, FilterFormValue>>({
  required: true,
});
</script>

<template>
  <section
    v-if="props.fields.length"
    class="multiview-fuzzy-filter"
  >
    <el-form
      :model="formModel"
      label-position="top"
      class="multiview-fuzzy-filter__form"
    >
      <el-form-item
        v-for="field in props.fields"
        :key="field.key"
        :label="field.label"
        class="multiview-fuzzy-filter__item"
      >
        <el-input
          v-if="field.component === 'input'"
          v-model="formModel[field.key]"
          :placeholder="field.placeholder || t('common.enterKeyword')"
          clearable
        />

        

        <AsyncSelect
          v-else-if="field.component === 'select'"
          :model-value="(formModel[field.key] ?? null) as any"
          :entity-config="field.entityConfig"
          :value-key="field.valueKey || 'value'"
          :label-key="field.labelKey || 'label'"
          :drag-key="field.dragKey"
          :placeholder="field.placeholder || t('common.pleaseSelect')"
          @update:model-value="
            (value) => (formModel[field.key] = value as FilterFormValue)
          "
        />

        <el-date-picker
          v-else-if="field.component === 'date'"
          v-model="formModel[field.key]"
          type="date"
          :placeholder="field.placeholder || t('common.pleaseSelect')"
          clearable
        />
      </el-form-item>
    </el-form>

    <div class="multiview-fuzzy-filter__actions">
      <el-button
        v-if="props.showSearchButton"
        type="primary"
        @click="emit('search')"
      >
        {{ t('common.search') }}
      </el-button>
      <el-button
        v-if="props.showResetButton"
        @click="emit('reset')"
      >
        {{ t('common.reset') }}
      </el-button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.multiview-fuzzy-filter {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  padding: 0;
}

.multiview-fuzzy-filter__form {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 14px;
}

.multiview-fuzzy-filter__item {
  margin-bottom: 0;
}

.multiview-fuzzy-filter__actions {
  display: flex;
  gap: 8px;
  padding-bottom: 2px;
}

@media (max-width: 1024px) {
  .multiview-fuzzy-filter {
    align-items: stretch;
    flex-direction: column;
  }

  .multiview-fuzzy-filter__actions {
    justify-content: flex-start;
  }

  .multiview-fuzzy-filter__form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .multiview-fuzzy-filter__form {
    grid-template-columns: 1fr;
  }
}
</style>
