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

/******************************** 通知公告表单 ********************************/

const props = defineProps<EntityFormProps>();
const emit = defineEmits<EntityFormEmits>();

const formRef = ref<FormInstance>();
const saving = ref(false);
const formData = ref<Record<string, any>>({});

const drawerTitle = computed(() => {
  if (props.isCreate && props.record) return '复制通知公告';
  return props.isCreate ? '新增通知公告' : '编辑通知公告';
});

const rules = computed<FormRules>(() => ({
  noticeTitle: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
  noticeType: [
    { required: true, message: '请选择公告类型', trigger: 'change' },
  ],
}));

// 同步表单数据
function syncFormState(record?: Record<string, unknown>) {
  formData.value = {
    noticeTitle: '',
    noticeType: '1',
    noticeContent: '',
    status: '0',
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
    const noticeId = props.record?.noticeId ?? props.record?.id;

    if (props.isCreate || !noticeId) {
      await addEntityRowApi('notice', data);
    } else {
      await updateEntityRowApi('notice', noticeId as number | string, data);
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
        class="notice-form"
      >
        <el-form-item label="公告标题" prop="noticeTitle">
          <el-input
            v-model="formData.noticeTitle"
            placeholder="请输入公告标题"
            clearable
          />
        </el-form-item>

        <el-form-item label="公告类型" prop="noticeType">
          <el-select
            v-model="formData.noticeType"
            placeholder="请选择公告类型"
            style="width: 100%"
          >
            <el-option label="通知" value="1" />
            <el-option label="公告" value="2" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-switch
            v-model="formData.status"
            active-value="0"
            inactive-value="1"
          />
        </el-form-item>

        <el-form-item label="公告内容">
          <el-input
            v-model="formData.noticeContent"
            type="textarea"
            :rows="6"
            placeholder="请输入公告内容"
          />
        </el-form-item>
      </el-form>
    </template>
  </DetailDrawer>
</template>

<style scoped lang="scss">
.notice-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }
}
</style>
