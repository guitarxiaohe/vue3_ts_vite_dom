<template>
  <div>
    <div>{{ msgInfo.text }}</div>
    <div style="display: flex; justify-content: space-between">
      <div></div>
      <ElButton size="small" @click="handleClick">去查看</ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WsMessage } from '@/types/ws';
import { ElButton } from 'element-plus';
import { useRouter } from 'vue-router';

const props = defineProps<{
  msgInfo: WsMessage;
}>();

const router = useRouter();

const handleClick = () => {
  if (props.msgInfo.path) {
    router.push({
      path: props.msgInfo.path,
      query: props.msgInfo.params as any,
    });
  }
};
</script>
