<script setup lang="ts">
import { computed } from 'vue';
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

const userId = computed(() => props.row?.userId);
const nickName = computed(() => props.row?.nickName ?? '');
const userName = computed(() => props.row?.userName ?? '');
const avatar = computed(() => props.row?.avatar ?? '');
const sex = computed(() => props.row?.sex ?? '');
const deptName = computed(() => props.row?.deptName ?? props.row?.dept?.deptName ?? '');
</script>
<template>
  <UserAvatarInfo
    :user-id="userId"
    :nick-name="nickName"
    :name="userName"
    :src="avatar"
    :avatar="avatar"
    :sex="sex"
    :dept-name="deptName"
  />
</template>

<style scoped lang="scss"></style>
