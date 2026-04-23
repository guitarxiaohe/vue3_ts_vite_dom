<script setup lang="ts">
import { ElMessage } from 'element-plus';

/******************************** 组件入参 ********************************/

const props = defineProps<{
  row: Record<string, any>;
}>();

/******************************** 事件方法 ********************************/

// 下载当前文件
function onDownload() {
  ElMessage.info(`下载文件：${props.row.fileOriginName ?? props.row.fileId ?? ''}`);
}
</script>

<template>
  <el-button type="primary" link size="small" @click.stop="onDownload">
    下载
  </el-button>
</template>
