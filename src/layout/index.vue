<script lang="ts" setup>
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { LogOut } from 'lucide-vue-next';
import { useSystemStore, useUserStore } from '@/stores';
import ConventionalMenu from '@/components/conventional-menu/index.vue';
import NoticeBar from '@/components/notice-bar/index.vue';
import NotifyBell from '@/components/notify-bell/index.vue';
import { useWebSocket } from '@/composables/use-websocket';
import { getRecentWsLogsApi } from '@/api/modules/ws-log';
import { useNotificationStore } from '@/stores';

const { t } = useI18n();
const router = useRouter();
const systemStore = useSystemStore();
const userStore = useUserStore();
const notificationStore = useNotificationStore();

const { connect, disconnect } = useWebSocket();

/******************************** 初始化 WebSocket + 历史消息 ********************************/

onMounted(async () => {
  // 加载最近消息日志
  try {
    const res = (await getRecentWsLogsApi()) as any;
    if (res.code === 200 && Array.isArray(res.data)) {
      notificationStore.initFromLogs(res.data);
    }
  } catch {
    // 忽略
  }
  // 建立 WebSocket 连接
  connect();
});

onUnmounted(() => {
  disconnect();
});

/******************************** 登出 ********************************/

function handleLogout() {
  disconnect();
  userStore.logout();
  ElMessage.success(t('user.logout'));
  router.push('/login');
}
</script>

<template>
  <div class="common-layout">
    <el-container>
      <ConventionalMenu v-if="systemStore.isConventionalMode" />

      <el-container>
        <!-------------------------- 顶部栏 -------------------------->
        <el-header class="layout-header">
          <span class="layout-header__brand">XiaoHe</span>

          <div class="layout-header__right">
            <NotifyBell />
            <button class="layout-header__logout" @click="handleLogout">
              <LogOut :size="16" />
              <span>{{ t('user.logout') }}</span>
            </button>
          </div>
        </el-header>

        <NoticeBar />

        <el-main>
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style lang="scss" scoped>
.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--color-bg-card);
}

.layout-header__brand {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 0.5px;
}

.layout-header__right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.layout-header__logout {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    color: var(--color-danger);
    border-color: var(--color-danger);
    background: var(--color-danger-light, rgba(245, 108, 108, 0.08));
  }
}
</style>
