<script setup lang="ts">
import { computed, type CSSProperties } from 'vue';
import { useAllDictDataQuery } from '@/composables/use-dict-data';

/******************************** 字典标签着色组件 ********************************/

const props = withDefaults(
  defineProps<{
    dictType?: string;
    value?: string | number | null;
    label?: string | number | null;
    color?: string | null;
  }>(),
  {
    dictType: '',
    value: null,
    label: null,
    color: null,
    semanticColor: '',
  }
);

const { data: allDict } = useAllDictDataQuery();

const matchedItem = computed(() => {
  if (!allDict.value || !props.dictType || props.value == null) return null;
  return (
    allDict.value.find(
      (item) =>
        item.dictType === props.dictType &&
        String(item.dictValue) === String(props.value)
    ) ?? null
  );
});
const label = computed(
  () =>
    props.label ?? matchedItem.value?.dictLabel ?? String(props.value ?? '--')
);
const color = computed<string | undefined>(() => {
  const c = props.color ?? matchedItem.value?.cssClass;
  return typeof c === 'string' ? c : undefined;
});

const customStyle = computed<CSSProperties>(() =>
  color.value ? ({ 'background-color': color.value } as CSSProperties) : {}
);
</script>

<template>
  <span class="dict-tag" :style="customStyle">
    {{ label }}
  </span>
</template>

<style scoped lang="scss">
.dict-tag {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  max-width: 100%;
  flex-shrink: 0;
  padding: 2px 10px;
  border: 1px solid var(--color-primary-bg);
  border-radius: 4px;
  background: var(--color-primary-bg);
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  vertical-align: middle;
  white-space: nowrap;
}

.dict-tag--colored {
  border-color: color-mix(in srgb, var(--dict-tag-color) 42%, transparent);
  background: color-mix(in srgb, var(--dict-tag-color) 14%, transparent);
  color: var(--dict-tag-color);
}

.dict-tag--success {
  border-color: var(--color-success-bg);
  background: var(--color-success-bg);
  color: var(--color-success);
}

.dict-tag--danger {
  border-color: var(--color-danger-bg);
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.dict-tag--warning {
  border-color: var(--color-warning-bg);
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.dict-tag--info {
  border-color: var(--color-info-bg);
  background: var(--color-info-bg);
  color: var(--color-info);
}
</style>
