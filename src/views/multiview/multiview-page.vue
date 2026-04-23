<template>
  <div class="multiview-page">
    <!-------------------------- 无实体提示 -------------------------->
    <el-alert
      v-if="!entityKey"
      type="info"
      show-icon
      title="缺少实体标识"
      description="请通过 /multiview/:entityKey 访问配置化列表页面"
    />

    <!-------------------------- 配置化列表 -------------------------->
    <MultiviewShell
      v-else
      ref="shellRef"
      :key="entityKey"
      :entity-key="entityKey"
      :cache-key="cacheKey"
      @create="handleCreate"
      @edit="handleEdit"
      @copy="handleCopy"
      @export="handleExport"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import MultiviewShell, {
  type MultiviewExportPayload,
} from '@/features/multiview/components/multiview-shell.vue';
import {
  getEntityFormComponent,
  hasEntityForm,
} from '@/features/entities/registry';

/******************************** 基础状态 ********************************/

const route = useRoute();
const shellRef = ref<InstanceType<typeof MultiviewShell>>();

const entityKey = computed<string>(() => {
  const key = route.params.entityKey;
  return typeof key === 'string' ? key.trim() : '';
});

const cacheKey = computed<string>(() => route.path);

/******************************** 操作方法 ********************************/

// 新建记录
function handleCreate() {
  if (!hasEntityForm(entityKey.value)) {
    ElMessage.warning(`实体 ${entityKey.value} 暂未配置表单组件`);
    return;
  }

  ElMessage.info(`打开 ${entityKey.value} 新建表单`);
}

// 编辑记录
function handleEdit(row?: Record<string, any>) {
  if (!row) return;

  if (!getEntityFormComponent(entityKey.value)) {
    ElMessage.warning(`实体 ${entityKey.value} 暂未配置表单组件`);
    return;
  }

  ElMessage.info(`打开 ${entityKey.value} 编辑表单`);
}

// 复制记录
function handleCopy(row?: Record<string, any>) {
  if (!row) return;

  if (!getEntityFormComponent(entityKey.value)) {
    ElMessage.warning(`实体 ${entityKey.value} 暂未配置表单组件`);
    return;
  }

  ElMessage.info(`打开 ${entityKey.value} 复制表单`);
}

// 导出记录
function handleExport(payload: MultiviewExportPayload) {
  ElMessage.info(`导出 ${payload.entityKey}`);
}
</script>

<style scoped lang="scss">
.multiview-page {
  min-height: 100%;
  padding: 24px;
  background: var(--color-bg-page);
}

@media (max-width: 640px) {
  .multiview-page {
    padding: 14px;
  }
}
</style>
