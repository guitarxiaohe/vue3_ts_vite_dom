<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import DetailDrawer from '@/features/form-shell/components/form-drawer.vue';
import { mapEntityFormFields } from '@/features/entities/_shared/form-field-adapter';
import { getUserFormFields } from './constants';
import { getEntityTableConfig } from '@/utils/entity-config';
import type {
  EntityFormEmits,
  EntityFormProps,
} from '@/features/entities/_shared/types';
import {
  createUser,
  editUser,
  getUserFormOptions,
  type CreateUserPayload,
  type EditUserPayload,
} from './service';

/******************************** 类型定义 ********************************/

/******************************** 组件入参 ********************************/

const props = defineProps<EntityFormProps>();
const emit = defineEmits<EntityFormEmits>();

const { t } = useI18n();

/******************************** 表单状态 ********************************/

const submitLoading = ref<boolean>(false);
const optionsLoading = ref<boolean>(false);
const formData = ref<Record<string, unknown>>({});
const roleOptions = ref<Array<{ label: string; value: string | number }>>([]);
const postOptions = ref<Array<{ label: string; value: string | number }>>([]);
const formFields = computed(() =>
  mapEntityFormFields(
    getUserFormFields(t, roleOptions.value, postOptions.value)
  )
);
const formChildren = computed(
  () => getEntityTableConfig(props.entityKey ?? 'user').children ?? []
);

const drawerTitle = computed(() => {
  if (props.isCreate && props.record) {
    return `${t('common.copy')}${t('menu.user')}`;
  }
  return props.isCreate
    ? `${t('common.add')}${t('menu.user')}`
    : `${t('common.edit')}${t('menu.user')}`;
});

// 标准化角色 ID 列表
function normalizeRoleIds(value: unknown): Array<number | string> {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : item))
    .filter((item) => item !== '' && item != null) as Array<number | string>;
}

function normalizePostIds(value: unknown): Array<number | string> {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        return record.postId ?? record.value ?? '';
      }
      return typeof item === 'string' ? item.trim() : item;
    })
    .filter((item) => item !== '' && item != null) as Array<number | string>;
}

// 标准化头像上传值
function normalizeAvatarValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value.trim() || undefined;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return String(record.url ?? record.fileUrl ?? '').trim() || undefined;
  }

  return undefined;
}

// 加载用户可绑定角色与已选角色
async function loadUserPermissionOptions() {
  if (!props.visible) return;

  optionsLoading.value = true;
  try {
    const userId = props.isCreate ? undefined : props.record?.userId;
    const response = await getUserFormOptions(userId as number | string);
    const roles = Array.isArray(response.roles) ? response.roles : [];
    const posts = Array.isArray(response.posts) ? response.posts : [];
    roleOptions.value = roles.map((role) => ({
      label: String(role.roleName ?? role.roleKey ?? role.roleId ?? ''),
      value: role.roleId ?? '',
    }));
    postOptions.value = posts.map((post) => ({
      label: String(post.postName ?? post.postCode ?? post.postId ?? ''),
      value: post.postId ?? '',
    }));

    const selectedRoleIds = normalizeRoleIds(response.roleIds);
    const selectedPostIds = normalizePostIds(response.postIds);
    if (!props.isCreate && response.data) {
      formData.value = {
        ...props.record,
        ...response.data,
        roleIds: selectedRoleIds,
        postIds: selectedPostIds,
      };
      return;
    }

    formData.value = {
      ...formData.value,
      roleIds: selectedRoleIds,
      postIds: selectedPostIds,
    };
  } finally {
    optionsLoading.value = false;
  }
}

// 提交部门表单
async function handleSave(data: Record<string, unknown>) {
  submitLoading.value = true;

  try {
    const payload: CreateUserPayload = {
      deptId: data.deptId as number | string,
      userName: String(data.userName ?? '').trim(),
      nickName: String(data.nickName ?? '').trim(),
      email: String(data.email ?? '').trim() || undefined,
      phonenumber: String(data.phonenumber ?? '').trim() || undefined,
      sex: String(data.sex ?? '').trim() || undefined,
      avatar: normalizeAvatarValue(data.avatar),
      status: String(data.status ?? '0'),
      roleIds: normalizeRoleIds(data.roleIds),
      postIds: normalizePostIds(data.postIds),
      remark: String(data.remark ?? '').trim() || undefined,
    };
    await createUser(payload);
    emit('save');
    emit('update:visible', false);
  } finally {
    submitLoading.value = false;
  }
}

const handEdit = async (data: Record<string, unknown>) => {
  try {
    const payload: EditUserPayload = {
      userId: String(data.userId),
      deptId: data.deptId as number | string,
      userName: String(data.userName ?? '').trim(),
      nickName: String(data.nickName ?? '').trim(),
      email: String(data.email ?? '').trim() || undefined,
      phonenumber: String(data.phonenumber ?? '').trim() || undefined,
      sex: String(data.sex ?? '').trim() || undefined,
      avatar: normalizeAvatarValue(data.avatar),

      status: String(data.status ?? '0'),
      roleIds: normalizeRoleIds(data.roleIds),
      postIds: normalizePostIds(data.postIds),
      remark: String(data.remark ?? '').trim() || undefined,
    };
    await editUser(payload);
    emit('save');
    emit('update:visible', false);
  } finally {
    submitLoading.value = false;
  }
};

// 关闭抽屉
function onCancel() {
  emit('update:visible', false);
  emit('cancel');
}

const save = (data: Record<string, unknown>) => {
  props.isCreate ? handleSave(data) : handEdit(data);
};

/******************************** 监听 ********************************/

watch(
  () => [props.visible, props.record?.userId, props.isCreate] as const,
  () => {
    if (props.visible) {
      void loadUserPermissionOptions();
    }
  },
  { immediate: true }
);
</script>

<template>
  <DetailDrawer
    v-model:form-data="formData"
    :record="props.record"
    :record-list="props.recordList"
    :initial-index="props.initialIndex"
    :visible="props.visible"
    :is-create="props.isCreate"
    :fields="formFields"
    :columns="1"
    :saving="submitLoading || optionsLoading"
    :title="drawerTitle"
    :child-tables="formChildren"
    @save="save"
    @cancel="onCancel"
    @update:visible="emit('update:visible', $event)"
  />
</template>
