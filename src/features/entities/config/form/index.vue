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

/******************************** 参数配置表单 ********************************/

const props = defineProps<EntityFormProps>();
const emit = defineEmits<EntityFormEmits>();

const formRef = ref<FormInstance>();
const saving = ref(false);
const formData = ref<Record<string, any>>({});

const drawerTitle = computed(() => {
  if (props.isCreate && props.record) return '复制参数配置';
  return props.isCreate ? '新增参数配置' : '编辑参数配置';
});

const rules = computed<FormRules>(() => ({
  configName: [{ required: true, message: '请输入参数名称', trigger: 'blur' }],
  configKey: [{ required: true, message: '请输入参数键名', trigger: 'blur' }],
  configValue: [{ required: true, message: '请输入参数键值', trigger: 'blur' }],
}));

// 同步表单数据
function syncFormState(record?: Record<string, unknown>) {
  formData.value = {
    configName: '',
    configKey: '',
    configValue: '',
    configType: 'Y',
    remark: '',
    ...(record || {}),
  };
}

// 保存
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
    const configId = props.record?.configId ?? props.record?.id;

    if (props.isCreate || !configId) {
      await addEntityRowApi('config', data);
    } else {
      await updateEntityRowApi('config', configId as number | string, data);
    }

    ElMessage.success(props.isCreate ? '新增成功' : '修改成功');
    emit('save');
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '操作失败');
  } finally {
    saving.value = false;
  }
}

function handleCancel() {
  emit('update:visible', false);
  emit('cancel');
}

function handleIndexChange(index: number) {
  const record = props.recordList?.[index] ?? props.record;
  syncFormState(record);
}

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return;
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
    :record-list="props.recordList"
    :initial-index="props.initialIndex"
    :is-create="props.isCreate"
    :title="drawerTitle"
    :saving="saving"
    size="560px"
    @save="handleSave"
    @cancel="handleCancel"
    @index-change="handleIndexChange"
    @update:visible="emit('update:visible', $event)"
  >
    <template #content>
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-position="top"
        class="config-form"
      >
        <el-form-item label="参数名称" prop="configName">
          <el-input
            v-model="formData.configName"
            placeholder="请输入参数名称"
            clearable
          />
        </el-form-item>

        <el-form-item label="参数键名" prop="configKey">
          <el-input
            v-model="formData.configKey"
            placeholder="请输入参数键名"
            clearable
          />
        </el-form-item>

        <el-form-item label="参数键值" prop="configValue">
          <el-input
            v-model="formData.configValue"
            placeholder="请输入参数键值"
            clearable
          />
        </el-form-item>

        <el-form-item label="系统内置">
          <el-select
            v-model="formData.configType"
            placeholder="请选择"
            style="width: 100%"
          >
            <el-option label="是" value="Y" />
            <el-option label="否" value="N" />
          </el-select>
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
    </template>
  </DetailDrawer>
</template>

<style scoped lang="scss">
.config-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }
}
</style>
