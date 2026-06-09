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
  if (props.isCreate && props.record) return '复制项目';
  return props.isCreate ? '新增项目' : '编辑项目';
});

const fields: DetailField[] = [
  {
    prop: 'title',
    label: '项目标题',
    type: 'text',
    required: true,
    placeholder: '请输入项目标题',
  },
  {
    prop: 'company_name',
    label: '公司名称',
    type: 'text',
    placeholder: '请输入公司名称',
  },
  {
    prop: 'description',
    label: '项目描述',
    type: 'textarea',
    placeholder: '请输入项目描述',
  },
  {
    prop: 'cover_image',
    label: '封面图',
    type: 'picture',
  },
  {
    prop: 'images',
    label: '项目图片',
    type: 'picture',
  },
  {
    prop: 'tags',
    label: '标签',
    type: 'text',
    placeholder: '多个标签用逗号分隔',
  },
  {
    prop: 'url',
    label: '项目链接',
    type: 'text',
    placeholder: '请输入项目链接',
  },
  {
    prop: 'sort_order',
    label: '排序号',
    type: 'number',
  },
];

async function handleSave(data: Record<string, unknown>) {
  saving.value = true;
  try {
    const id = props.record?.id;
    if (props.isCreate || !id) {
      await addEntityRowApi('wxProject', data);
    } else {
      await updateEntityRowApi('wxProject', id as number, data);
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
      title: '',
      company_name: '',
      description: '',
      cover_image: '',
      images: '',
      tags: '',
      url: '',
      sort_order: 0,
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
