<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { updateProfilePasswordApi } from '@/api/modules/user';
import { useUserStore } from '@/stores';

const userStore = useUserStore();
const { t } = useI18n();

const loading = ref(false);
const formRef = ref();
const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const visible = computed(() => userStore.needUpdatePassword);
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,12}$/;

const rules = {
  oldPassword: [
    {
      required: true,
      message: t('passwordDialog.oldPasswordRequired'),
      trigger: 'blur',
    },
  ],
  newPassword: [
    {
      required: true,
      message: t('passwordDialog.newPasswordRequired'),
      trigger: 'blur',
    },
    {
      validator: (
        _rule: unknown,
        value: string,
        callback: (error?: Error) => void
      ) => {
        if (!passwordPattern.test(String(value ?? ''))) {
          callback(new Error(t('passwordDialog.passwordRule')));
          return;
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    {
      required: true,
      message: t('passwordDialog.confirmPasswordRequired'),
      trigger: 'blur',
    },
    {
      validator: (
        _rule: unknown,
        value: string,
        callback: (error?: Error) => void
      ) => {
        if (String(value ?? '') !== form.newPassword) {
          callback(new Error(t('passwordDialog.confirmPasswordMismatch')));
          return;
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
};

watch(visible, (nextVisible) => {
  if (!nextVisible) {
    form.oldPassword = '';
    form.newPassword = '';
    form.confirmPassword = '';
    formRef.value?.clearValidate?.();
  }
});

async function handleSubmit() {
  if (loading.value) {
    return;
  }

  try {
    await formRef.value?.validate?.();
  } catch {
    return;
  }

  loading.value = true;
  try {
    const response = await updateProfilePasswordApi({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
    });
    if (response.code === 200) {
      userStore.markPasswordUpdated();
      ElMessage.success(response.msg || t('passwordDialog.updateSuccess'));
    }
  } finally {
    loading.value = false;
  }
}

function handleLogout() {
  userStore.logout();
  window.location.href = '/login';
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="t('passwordDialog.title')"
    width="460px"
    append-to-body
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    destroy-on-close
  >
    <p class="password-dialog__desc">
      {{ t('passwordDialog.description') }}
    </p>
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item :label="t('passwordDialog.oldPassword')" prop="oldPassword">
        <el-input
          v-model="form.oldPassword"
          type="password"
          show-password
          autocomplete="current-password"
        />
      </el-form-item>
      <el-form-item :label="t('passwordDialog.newPassword')" prop="newPassword">
        <el-input
          v-model="form.newPassword"
          type="password"
          show-password
          autocomplete="new-password"
        />
      </el-form-item>
      <el-form-item
        :label="t('passwordDialog.confirmPassword')"
        prop="confirmPassword"
      >
        <el-input
          v-model="form.confirmPassword"
          type="password"
          show-password
          autocomplete="new-password"
          @keyup.enter="handleSubmit"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="password-dialog__footer">
        <el-button @click="handleLogout">
          {{ t('passwordDialog.logout') }}
        </el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ t('passwordDialog.submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.password-dialog__desc {
  margin: 0 0 16px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.password-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
