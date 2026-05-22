<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import DetailDrawer from '@/features/form-shell/components/form-drawer.vue';
import {
  addEntityRowApi,
  updateEntityRowApi,
} from '@/api/modules/dynamic-entity';
import type { DetailField } from '@/features/form-shell/types/detail';
import type {
  EntityFormEmits,
  EntityFormProps,
} from '@/features/entities/_shared/types';

const props = defineProps<EntityFormProps>();
const emit = defineEmits<EntityFormEmits>();

const saving = ref(false);
const formData = ref<Record<string, unknown>>({});

const drawerTitle = computed(() => {
  if (props.isCreate && props.record) return '复制用户';
  return props.isCreate ? '新增用户' : '编辑用户';
});

const fields: DetailField[] = [
  {
    prop: 'name',
    label: '姓名',
    type: 'text',
    required: true,
    placeholder: '请输入姓名',
  },
  {
    prop: 'open_id',
    label: 'OpenID',
    type: 'text',
    readonly: true,
  },
  {
    prop: 'phone',
    label: '手机号',
    type: 'text',
    placeholder: '请输入手机号',
  },
  {
    prop: 'email',
    label: '邮箱',
    type: 'text',
    placeholder: '请输入邮箱',
  },
  {
    prop: 'gender',
    label: '性别',
    type: 'select',
    options: [
      { label: '男', value: '男' },
      { label: '女', value: '女' },
    ],
  },
  {
    prop: 'avatar',
    label: '头像',
    type: 'picture',
  },
  {
    prop: 'bio',
    label: '个人简介',
    type: 'textarea',
    placeholder: '请输入个人简介',
  },
];

async function handleSave(data: Record<string, unknown>) {
  saving.value = true;
  try {
    const id = props.record?.id;
    if (props.isCreate || !id) {
      await addEntityRowApi('wxUser', data);
    } else {
      await updateEntityRowApi('wxUser', id as number, data);
    }
    ElMessage.success(props.isCreate ? '新增成功' : '修改成功');
    emit('save');
    emit('update:visible', false);
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败');
  } finally {
    saving.value = false;
  }
}

function onCancel() {
  emit('update:visible', false);
  emit('cancel');
}

watch(
  () => props.visible,
  (v) => {
    if (!v) return;
    formData.value = {
      name: '',
      open_id: '',
      phone: '',
      email: '',
      gender: '',
      avatar: '',
      bio: '',
      ...(props.record || {}),
    };
  },
  { immediate: true }
);
</script>

<template>
  <DetailDrawer
    v-model:form-data="formData"
    :record="props.record"
    :visible="props.visible"
    :is-create="props.isCreate"
    :fields="fields"
    :columns="1"
    :saving="saving"
    :title="drawerTitle"
    @save="handleSave"
    @cancel="onCancel"
    @update:visible="emit('update:visible', $event)"
  />
</template>
