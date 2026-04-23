<script setup lang="ts">
import { ElMessage } from 'element-plus';

/******************************** 组件入参 ********************************/

const props = defineProps<{
  row: Record<string, any>;
}>();

/******************************** 事件方法 ********************************/

// 重置用户密码
function onReset() {
  ElMessage.info(`重置用户：${props.row.userName ?? props.row.nickName ?? ''}`);
}
</script>

<template>
  <el-button type="warning" link size="small" @click.stop="onReset">
    重置密码
  </el-button>
</template>
