<template>
  <div class="multiview-page">
    <!-------------------------- 无实体提示 -------------------------->
    <el-alert
      v-if="!entityKey"
      type="info"
      show-icon
      :title="t('multiview.missingEntityTitle')"
      :description="t('multiview.missingEntityDescription')"
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

    <!-------------------------- 动态实体表单 -------------------------->
    <component
      :is="entityFormComponent"
      v-if="entityFormComponent"
      v-model:visible="formVisible"
      :entity-key="entityKey"
      :is-create="isCreateMode"
      :record="currentRecord"
      :record-list="formRecordList"
      :initial-index="currentRecordIndex"
      @save="handleFormSave"
      @cancel="formVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, watch, type Component } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import MultiviewShell, {
  type MultiviewExportPayload,
} from '@/features/multiview/components/multiview-shell.vue';
import {
  getEntityFormComponent,
  hasEntityForm,
} from '@/features/entities/registry';
import { getEntityTableConfig } from '@/utils/entity-config';

/******************************** 基础状态 ********************************/

const route = useRoute();
const { t } = useI18n();
const shellRef = ref<InstanceType<typeof MultiviewShell>>();
const entityFormComponent = shallowRef<Component | null>(null);
const formVisible = ref<boolean>(false);
const isCreateMode = ref<boolean>(true);
const currentRecord = ref<Record<string, unknown> | null>(null);
const currentRecordIndex = ref<number>(0);

const entityKey = computed<string>(() => {
  const key = route.params.entityKey;
  return typeof key === 'string' ? key.trim() : '';
});

const cacheKey = computed<string>(() => route.path);
const rowKeyField = computed<string>(
  () => getEntityTableConfig(entityKey.value).rowKey || 'id'
);
const formRecordList = computed<Record<string, unknown>[]>(
  () => shellRef.value?.data?.list ?? []
);

/******************************** 监听 ********************************/

watch(
  entityKey,
  (key) => {
    entityFormComponent.value = key ? getEntityFormComponent(key) : null;
  },
  { immediate: true }
);

/******************************** 操作方法 ********************************/

// 新建记录
function handleCreate() {
  if (!hasEntityForm(entityKey.value)) {
    ElMessage.warning(
      t('multiview.formNotConfigured', { entity: entityKey.value })
    );
    return;
  }
  isCreateMode.value = true;
  currentRecord.value = null;
  currentRecordIndex.value = 0;
  formVisible.value = true;
}

// 编辑记录
function handleEdit(row?: Record<string, any>) {
  if (!row) return;

  if (!getEntityFormComponent(entityKey.value)) {
    ElMessage.warning(
      t('multiview.formNotConfigured', { entity: entityKey.value })
    );
    return;
  }
  isCreateMode.value = false;
  currentRecordIndex.value = resolveRecordIndex(row);
  currentRecord.value = { ...row };
  formVisible.value = true;
}

// 复制记录
function handleCopy(row?: Record<string, any>) {
  if (!row) return;

  if (!getEntityFormComponent(entityKey.value)) {
    ElMessage.warning(
      t('multiview.formNotConfigured', { entity: entityKey.value })
    );
    return;
  }
  const copiedRecord = { ...row };
  delete copiedRecord[rowKeyField.value];
  delete copiedRecord.id;
  delete copiedRecord._id;
  currentRecordIndex.value = resolveRecordIndex(row);
  currentRecord.value = copiedRecord;
  isCreateMode.value = true;
  formVisible.value = true;
}

// 导出记录
function handleExport(payload: MultiviewExportPayload) {
  ElMessage.info(t('multiview.exporting', { entity: payload.entityKey }));
}

// 计算记录在当前列表中的位置
function resolveRecordIndex(row: Record<string, unknown>) {
  const list = formRecordList.value;
  const rowKey = rowKeyField.value;
  const recordId = row[rowKey] ?? row.id ?? row._id;

  if (recordId == null) return 0;

  const index = list.findIndex((item) => {
    const itemId = item[rowKey] ?? item.id ?? item._id;
    return String(itemId) === String(recordId);
  });

  return index >= 0 ? index : 0;
}

// 表单保存后刷新列表
function handleFormSave() {
  formVisible.value = false;
  shellRef.value?.refetch();
  shellRef.value?.clearSelection();
  // ElMessage.success(mag ? mag : t('common.success'));
}
</script>

<style scoped lang="scss">
.multiview-page {
  min-height: 100%;
  // padding: 24px;
  background: var(--color-bg-page);
}

@media (max-width: 640px) {
  .multiview-page {
    padding: 14px;
  }
}
</style>
