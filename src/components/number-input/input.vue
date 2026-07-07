<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    ariaLabel: string;
    placeholder?: string;
    type?: string;
    floating?: boolean;
  }>(),
  {
    placeholder: '',
    type: 'number',
    floating: false,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'input', value: string): void;
  (e: 'focus', event: FocusEvent): void;
  (e: 'blur', event: FocusEvent): void;
}>();

const handleInput = (value: string) => {
  emit('update:modelValue', value);
  emit('input', value);
};
</script>

<template>
  <div
    class="tool-input"
    :class="{
      'is-floating': floating,
    }"
  >
    <span class="tool-input-label">{{ label }}</span>
    <el-input
      :model-value="modelValue"
      :aria-label="ariaLabel"
      class="tool-input-control"
      :placeholder="placeholder"
      :type="type"
      @blur="emit('blur', $event)"
      @focus="emit('focus', $event)"
      @input="handleInput"
    >
      <template v-if="$slots.append" #append>
        <slot name="append" />
      </template>
    </el-input>
  </div>
</template>

<style scoped lang="scss">
.tool-input {
  position: relative;
  width: 100%;
}

.tool-input-label {
  background: transparent;
  color: #606266;
  font-size: 14px;
  left: 12px;
  line-height: 1;
  padding: 0;
  pointer-events: none;
  position: absolute;
  top: 20px;
  transform: translateY(-50%);
  transition:
    top 0.18s ease,
    transform 0.18s ease,
    color 0.18s ease,
    font-size 0.18s ease,
    background-color 0.18s ease,
    padding 0.18s ease;
  z-index: 2;
}

.tool-input.is-floating .tool-input-label {
  background: #fff;
  color: #606266;
  font-size: 12px;
  padding: 0 4px;
  top: -5px;
  transform: translateY(0);
}

.tool-input-control {
  width: 100%;
}

:deep(.tool-input-control .el-input__wrapper) {
  border-radius: 4px 0 0 4px;
  box-shadow: 0 0 0 1px #d7dce2 inset;
  height: 40px;
  padding: 0 12px;
}

:deep(.tool-input-control.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

:deep(.tool-input-control .el-input__inner) {
  color: #20242a;
  font-size: 14px;
}

:deep(.tool-input-control .el-input__inner::placeholder) {
  color: #606266;
}

:deep(.tool-input-control .el-input-group__append) {
  box-sizing: border-box;
  width: 65px;
  min-width: 65px;
  max-width: 65px;
  padding: 0;
}

:deep(.tool-input-control .el-input-group__append > *) {
  box-sizing: border-box;
  width: 65px;
  min-width: 65px;
  max-width: 65px;
}

// :deep(.tool-input-control .el-input-group__append .el-select) {
//   display: flex;
//   height: 100%;
// }

// :deep(.tool-input-control .el-input-group__append .el-select__wrapper) {
//   border-radius: 0;
//   height: 100%;
//   min-height: 40px;
// }
</style>
