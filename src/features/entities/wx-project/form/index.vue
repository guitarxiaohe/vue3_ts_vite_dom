<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { type FormInstance, type FormRules } from 'element-plus';
import DetailDrawer from '@/features/form-shell/components/form-drawer.vue';
import {
  addEntityRowApi,
  updateEntityRowApi,
} from '@/api/modules/dynamic-entity';
import { ElMessage } from 'element-plus';
import type {
  EntityFormEmits,
  EntityFormProps,
} from '@/features/entities/_shared/types';

const props = defineProps<EntityFormProps>();
const emit = defineEmits<EntityFormEmits>();

const formRef = ref<FormInstance>();
const saving = ref(false);
const formData = ref<Record<string, any>>({});

const drawerTitle = computed(() => {
  if (props.isCreate && props.record) return '复制项目';
  return props.isCreate ? '新增项目' : '编辑项目';
});

const rules: FormRules = {
  title: [{ required: true, message: '请输入项目标题', trigger: 'blur' }],
};

function syncFormState(record?: Record<string, unknown>) {
  formData.value = {
    title: '',
    description: '',
    cover_image: '',
    tags: '',
    url: '',
    sort_order: 0,
    ...(record || {}),
  };
}

async function handleSave() {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    return;
  }
  saving.value = true;
  try {
    const data = { ...formData.value };
    const id = props.record?.id;
    if (props.isCreate || !id) {
      await addEntityRowApi('wxProject', data);
    } else {
      await updateEntityRowApi('wxProject', id as number, data);
    }
    ElMessage.success(props.isCreate ? '新增成功' : '修改成功');
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
    :is-create="props.isCreate"
    :title="drawerTitle"
    :saving="saving"
    size="560px"
    @save="handleSave"
    @cancel="handleCancel"
    @update:visible="emit('update:visible', $event)"
  >
    <template #content>
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-position="top"
      >
        <el-form-item label="项目标题" prop="title">
          <el-input
            v-model="formData.title"
            placeholder="请输入项目标题"
            clearable
          />
        </el-form-item>
        <el-form-item label="项目描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="请输入项目描述"
          />
        </el-form-item>
        <el-form-item label="封面图URL">
          <el-input
            v-model="formData.cover_image"
            placeholder="封面图URL"
            clearable
          />
        </el-form-item>
        <el-form-item label="标签">
          <el-input
            v-model="formData.tags"
            placeholder="多个标签用逗号分隔"
            clearable
          />
        </el-form-item>
        <el-form-item label="项目链接">
          <el-input v-model="formData.url" placeholder="项目链接" clearable />
        </el-form-item>
        <el-form-item label="排序号">
          <el-input-number
            v-model="formData.sort_order"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
    </template>
  </DetailDrawer>
</template>
