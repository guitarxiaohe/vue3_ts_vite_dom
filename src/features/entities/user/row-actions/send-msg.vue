<script setup lang="ts">
import type { EntityFormField } from '../../_shared/types';
import type { RowActionRuntimeActions } from '../../_shared/row-actions-types';
import DetailDrawer from '@/features/form-shell/components/form-drawer.vue';

import { ref } from 'vue';
import { sendMsg, type SendMsg } from '../form/service';

/******************************** 组件入参 ********************************/

const props = defineProps<{
  row: Record<string, any>;
  actions: RowActionRuntimeActions;
}>();
const visible = ref(false);
const loading = ref(false);

const formData = ref<SendMsg>({
  userId: '',
  type: 'notice',
  title: '',
  text: '',
  path: '',
  params: {},
});
const formField: EntityFormField[] = [
  {
    prop: 'type',
    label: '发送类型',
    type: 'select',
    options: [
      { label: '紧急', value: 'notice' },
      { label: '一般', value: 'system' },
      { label: '警告', value: 'alert' },
    ],
  },
  {
    prop: 'title',
    label: '标题',
    type: 'text',
  },
  {
    prop: 'text',
    label: '内容',
    type: 'textarea',
  },
  {
    prop: 'path',
    label: '跳转路径',
    type: 'text',
  },
];
/******************************** 事件方法 ********************************/

const onOpen = () => {
  formData.value.userId = props.row.userId;
  visible.value = true;
};
const save = () => {
  formData.value.userId = props.row.userId;

  sendMsg(formData.value).finally(() => {
    loading.value = false;
  });
};

const onCancel = () => {
  visible.value = false;
};
</script>

<template>
  <el-button type="primary" link size="small" @click.stop="onOpen">
    发送消息
  </el-button>
  <DetailDrawer
    append-to-body
    v-model:form-data="formData"
    :record="props.row"
    :visible="visible"
    :fields="formField"
    :saving="loading"
    title="发送消息"
    @save="save"
    @cancel="onCancel"
  />
</template>
