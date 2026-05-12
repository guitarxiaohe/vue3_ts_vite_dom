<script setup lang="ts">
import { computed } from 'vue';
import { useAllDictDataQuery } from '@/composables/use-dict-data';

/******************************** 字典标签着色组件 ********************************/

const props = withDefaults(
  defineProps<{
    dictType: string;
    value?: string | number | null;
  }>(),
  {
    value: null,
  }
);

const { data: allDict } = useAllDictDataQuery();

const matchedItem = computed(() => {
  if (!allDict.value || props.value == null) return null;
  return (
    allDict.value.find(
      (item) =>
        item.dictType === props.dictType &&
        String(item.dictValue) === String(props.value)
    ) ?? null
  );
});

const label = computed(
  () => matchedItem.value?.dictLabel ?? String(props.value ?? '--')
);
const color = computed<string | undefined>(() => {
  const c = matchedItem.value?.color;
  return typeof c === 'string' ? c : undefined;
});
</script>

<template>
  <span
    v-if="color"
    class="dict-tag dict-tag--colored"
    :style="{ backgroundColor: color }"
  >
    {{ label }}
  </span>
  <span v-else class="dict-tag">{{ label }}</span>
</template>

<style scoped lang="scss">
.dict-tag {
  font-size: 12px;
  color: var(--color-text-primary);
}

.dict-tag--colored {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  font-weight: 500;
  color: #fff;
  line-height: 1.5;
}
</style>
