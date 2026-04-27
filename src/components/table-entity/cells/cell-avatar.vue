<script setup lang="ts">
import UserAvatarInfo from '@/components/user-avatar-info/index.vue';

const props = withDefaults(
  defineProps<{
    row?: Record<string, any>;
    value?: string | number | null;
  }>(),
  {
    row: () => ({}),
    value: null,
  }
);
console.log('value ==>', props.row);
</script>
<template>
  <UserAvatarInfo :user-id="props.row?.userId" v-bind="{ ...props }" />
</template>

<style scoped lang="scss"></style>
