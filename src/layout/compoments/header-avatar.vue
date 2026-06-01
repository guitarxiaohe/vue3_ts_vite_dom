<script setup lang="ts">
import { useImageUrl } from '@/composables/use-image-url';
import { useUserStore } from '@/stores';
import { ElMessage } from 'element-plus';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import UserAvatarInfo from '@/components/user-avatar-info/index.vue';
const { t } = useI18n();
const router = useRouter();
const userStore = useUserStore();
const { ensureImageBaseUrl } = useImageUrl();
void ensureImageBaseUrl();
const avatarSrc = computed(() => userStore.avatar);

/******************************** 登出 ********************************/

function handleLogout() {
  //   disconnect();
  userStore.logout();
  ElMessage.success(t('user.logout'));
  router.push('/login');
}

function handleUserCommand(command: string) {
  if (command === 'logout') {
    handleLogout();
  }
}
</script>
<template>
  <el-dropdown
    trigger="click"
    placement="bottom-end"
    @command="handleUserCommand"
  >
    <button type="button" class="layout-header__user-trigger">
      <UserAvatarInfo
        :enableDrawer="false"
        :src="avatarSrc"
        :name="userStore.displayName"
        :user-id="userStore.userInfo?.userId"
      />
    </button>

    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item disabled>
          <span class="layout-header__user-name">
            {{ userStore.displayName }}
          </span>
        </el-dropdown-item>
        <el-dropdown-item divided command="logout">
          <LogOut :size="15" />
          <span>{{ t('user.logout') }}</span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped lang="scss"></style>
