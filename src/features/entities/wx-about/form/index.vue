<script setup lang="ts">
import { ref, watch } from 'vue';
import DetailDrawer from '@/features/form-shell/components/form-drawer.vue';
import { updateEntityRowApi } from '@/api/modules/dynamic-entity';
import { ElMessage } from 'element-plus';
import type {
  EntityFormEmits,
  EntityFormProps,
} from '@/features/entities/_shared/types';

const props = defineProps<EntityFormProps>();
const emit = defineEmits<EntityFormEmits>();

const saving = ref(false);
const formData = ref<Record<string, any>>({});

const drawerTitle = '编辑关于我';

function syncFormState(record?: Record<string, unknown>) {
  formData.value = {
    content: '',
    ...(record || {}),
  };
}

async function handleSave() {
  saving.value = true;
  try {
    const data = { ...formData.value };
    const id = props.record?.id || 1;
    await updateEntityRowApi('wxAbout', id as number, data);
    ElMessage.success('修改成功');
    emit('save');
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败');
  } finally {
    saving.value = false;
  }
}

function handleCancel() {
  emit('update:visible', false);
  emit('cancel');
}

watch(
  () => props.visible,
  (v) => {
    if (!v) return;
    syncFormState(props.record);
  },
  { immediate: true }
);
</script>

<template>
  <DetailDrawer
    v-model:form-data="formData"
    :visible="props.visible"
    :record="props.record"
    :is-create="false"
    :title="drawerTitle"
    :saving="saving"
    size="560px"
    @save="handleSave"
    @cancel="handleCancel"
    @update:visible="emit('update:visible', $event)"
  >
    <template #content>
      <el-form ref="formRef" :model="formData" label-position="top">
        <el-form-item label="内容（支持HTML）">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="10"
            placeholder="请输入关于我的内容，支持HTML标签"
          />
        </el-form-item>
      </el-form>
    </template>
  </DetailDrawer>
</template>
