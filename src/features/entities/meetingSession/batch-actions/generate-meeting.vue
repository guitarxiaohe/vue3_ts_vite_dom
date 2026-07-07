<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { reactive, ref } from 'vue';
import { generateMeetingLinkApi } from '@/api/modules/meeting-public';

const props = defineProps<{
  selectedRows: Record<string, any>[];
  selectedKeys: string[];
  entityKey: string;
  clearSelection?: () => void;
  refresh: () => void;
}>();

const loading = ref(false);
const dialogVisible = ref(false);

const formRef = ref();
const form = reactive({
  title: '',
  scheduledStartAt: '',
  scheduledEndAt: '',
});

const rules = {
  title: [{ required: true, message: '请输入会议标题', trigger: 'blur' }],
  scheduledStartAt: [
    { required: true, message: '请选择开始时间', trigger: 'change' },
  ],
  scheduledEndAt: [
    { required: true, message: '请选择结束时间', trigger: 'change' },
  ],
};

function openDialog() {
  form.title = '';
  form.scheduledStartAt = '';
  form.scheduledEndAt = '';
  dialogVisible.value = true;
}

async function handleConfirm() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  if (loading.value) return;
  loading.value = true;
  try {
    await generateMeetingLinkApi({
      title: form.title,
      scheduledStartAt: form.scheduledStartAt,
      scheduledEndAt: form.scheduledEndAt,
    });
    props.refresh();
    ElMessage.success('链接生成完成');
    dialogVisible.value = false;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <el-button type="primary" @click.stop="openDialog"> 生成会议链接 </el-button>

  <el-dialog
    v-model="dialogVisible"
    title="生成会议链接"
    width="480px"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="会议标题" prop="title">
        <el-input
          v-model="form.title"
          placeholder="请输入会议标题"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="开始时间" prop="scheduledStartAt">
        <el-date-picker
          v-model="form.scheduledStartAt"
          type="datetime"
          placeholder="请选择开始时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="结束时间" prop="scheduledEndAt">
        <el-date-picker
          v-model="form.scheduledEndAt"
          type="datetime"
          placeholder="请选择结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleConfirm">
        确定生成
      </el-button>
    </template>
  </el-dialog>
</template>
