<template>
  <div class="server-page">
    <!-------------------------- 页面头部 -------------------------->
    <section class="server-page__header">
      <div>
        <h2 class="server-page__title">{{ t('monitor.server.title') }}</h2>
        <p class="server-page__subtitle">{{ t('monitor.server.desc') }}</p>
      </div>
      <el-button :loading="loading" @click="refreshData">
        {{ t('common.refresh') }}
      </el-button>
    </section>

    <!-------------------------- 系统信息卡片 -------------------------->
    <section class="server-page__cards">
      <el-card shadow="never" class="server-page__card">
        <template #header>
          <div class="server-page__card-title">
            <h3>{{ t('monitor.server.cpu') }}</h3>
            <span class="server-page__card-desc">
              {{ serverData.cpu?.cpuNum ?? '--' }}
              {{ t('monitor.server.cores') }}
            </span>
          </div>
        </template>
        <div class="server-page__gauge">
          <el-progress
            type="dashboard"
            :percentage="serverData.cpu?.used ?? 0"
            :color="progressCpuColor"
            :stroke-width="14"
          >
            <template #default="{ percentage }">
              <span class="server-page__gauge-value">{{ percentage }}%</span>
              <span class="server-page__gauge-label">CPU</span>
            </template>
          </el-progress>
        </div>
        <div class="server-page__stats">
          <div class="server-page__stat">
            <span class="server-page__stat-label">System</span>
            <span class="server-page__stat-value"
              >{{ serverData.cpu?.sys ?? '--' }}%</span
            >
          </div>
          <div class="server-page__stat">
            <span class="server-page__stat-label">User</span>
            <span class="server-page__stat-value"
              >{{ serverData.cpu?.user ?? '--' }}%</span
            >
          </div>
          <div class="server-page__stat">
            <span class="server-page__stat-label">IOWait</span>
            <span class="server-page__stat-value"
              >{{ serverData.cpu?.iowait ?? '--' }}%</span
            >
          </div>
        </div>
      </el-card>

      <el-card shadow="never" class="server-page__card">
        <template #header>
          <div class="server-page__card-title">
            <h3>{{ t('monitor.server.memory') }}</h3>
            <span class="server-page__card-desc">
              {{ serverData.mem?.total ?? '--' }} GB
              {{ t('monitor.server.total') }}
            </span>
          </div>
        </template>
        <div class="server-page__gauge">
          <el-progress
            type="dashboard"
            :percentage="serverData.mem?.usage ?? 0"
            :color="progressMemColor"
            :stroke-width="14"
          >
            <template #default="{ percentage }">
              <span class="server-page__gauge-value">{{ percentage }}%</span>
              <span class="server-page__gauge-label">MEM</span>
            </template>
          </el-progress>
        </div>
        <div class="server-page__stats">
          <div class="server-page__stat">
            <span class="server-page__stat-label">{{
              t('monitor.server.used')
            }}</span>
            <span class="server-page__stat-value"
              >{{ serverData.mem?.used ?? '--' }} GB</span
            >
          </div>
          <div class="server-page__stat">
            <span class="server-page__stat-label">{{
              t('monitor.server.free')
            }}</span>
            <span class="server-page__stat-value"
              >{{ serverData.mem?.free ?? '--' }} GB</span
            >
          </div>
        </div>
      </el-card>

      <el-card shadow="never" class="server-page__card">
        <template #header>
          <div class="server-page__card-title">
            <h3>JVM</h3>
            <span class="server-page__card-desc"
              >{{ serverData.jvm?.total ?? '--' }} MB</span
            >
          </div>
        </template>
        <div class="server-page__gauge">
          <el-progress
            type="dashboard"
            :percentage="serverData.jvm?.usage ?? 0"
            :color="progressJvmColor"
            :stroke-width="14"
          >
            <template #default="{ percentage }">
              <span class="server-page__gauge-value">{{ percentage }}%</span>
              <span class="server-page__gauge-label">JVM</span>
            </template>
          </el-progress>
        </div>
        <div class="server-page__stats">
          <div class="server-page__stat">
            <span class="server-page__stat-label">Max</span>
            <span class="server-page__stat-value"
              >{{ serverData.jvm?.max ?? '--' }} MB</span
            >
          </div>
          <div class="server-page__stat">
            <span class="server-page__stat-label">{{
              t('monitor.server.free')
            }}</span>
            <span class="server-page__stat-value"
              >{{ serverData.jvm?.free ?? '--' }} MB</span
            >
          </div>
        </div>
      </el-card>
    </section>

    <!-------------------------- 系统信息 -------------------------->
    <section class="server-page__info-grid">
      <el-card shadow="never" class="server-page__info-card">
        <template #header>
          <h3>{{ t('monitor.server.sysInfo') }}</h3>
        </template>
        <dl class="server-page__info-list">
          <div class="server-page__info-item">
            <dt>{{ t('monitor.server.computerName') }}</dt>
            <dd>{{ serverData.sys?.computerName ?? '--' }}</dd>
          </div>
          <div class="server-page__info-item">
            <dt>{{ t('monitor.server.os') }}</dt>
            <dd>{{ serverData.sys?.osName ?? '--' }}</dd>
          </div>
          <div class="server-page__info-item">
            <dt>{{ t('monitor.server.osArch') }}</dt>
            <dd>{{ serverData.sys?.osArch ?? '--' }}</dd>
          </div>
          <div class="server-page__info-item">
            <dt>IP</dt>
            <dd>{{ serverData.sys?.computerIp ?? '--' }}</dd>
          </div>
          <div class="server-page__info-item">
            <dt>{{ t('monitor.server.userDir') }}</dt>
            <dd>{{ serverData.sys?.userDir ?? '--' }}</dd>
          </div>
          <div class="server-page__info-item">
            <dt>Java</dt>
            <dd>{{ serverData.jvm?.version ?? '--' }}</dd>
          </div>
          <div class="server-page__info-item">
            <dt>Java Home</dt>
            <dd>{{ serverData.jvm?.home ?? '--' }}</dd>
          </div>
        </dl>
      </el-card>

      <!-------------------------- 磁盘信息 -------------------------->
      <el-card shadow="never" class="server-page__info-card">
        <template #header>
          <h3>{{ t('monitor.server.disk') }}</h3>
        </template>
        <div class="server-page__disk-list">
          <div
            v-for="(disk, index) in serverData.sysFiles ?? []"
            :key="index"
            class="server-page__disk-item"
          >
            <div class="server-page__disk-header">
              <span class="server-page__disk-name">{{
                disk.dirName ?? '--'
              }}</span>
              <span class="server-page__disk-type">{{
                disk.sysTypeName ?? '--'
              }}</span>
            </div>
            <el-progress
              :percentage="Number(disk.usage ?? 0)"
              :color="diskProgressColor(Number(disk.usage ?? 0))"
              :stroke-width="18"
              :text-inside="true"
            >
              <span class="server-page__disk-text">
                {{ disk.free ?? '--' }} / {{ disk.total ?? '--' }}
              </span>
            </el-progress>
          </div>
        </div>
      </el-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getServerInfo } from '@/api/modules/monitor';

/******************************** 基础状态 ********************************/

const { t } = useI18n();
const loading = ref(false);

const serverData = reactive<{
  cpu: Record<string, any>;
  mem: Record<string, any>;
  jvm: Record<string, any>;
  sys: Record<string, any>;
  sysFiles: Record<string, any>[];
}>({
  cpu: {},
  mem: {},
  jvm: {},
  sys: {},
  sysFiles: [],
});

/******************************** 进度条颜色 ********************************/

const progressCpuColor = computed(() => {
  const v = Number(serverData.cpu?.used ?? 0);
  if (v >= 90) return '#f56c6c';
  if (v >= 70) return '#e6a23c';
  return '#409eff';
});

const progressMemColor = computed(() => {
  const v = Number(serverData.mem?.usage ?? 0);
  if (v >= 90) return '#f56c6c';
  if (v >= 70) return '#e6a23c';
  return '#67c23a';
});

const progressJvmColor = computed(() => {
  const v = Number(serverData.jvm?.usage ?? 0);
  if (v >= 90) return '#f56c6c';
  if (v >= 70) return '#e6a23c';
  return '#409eff';
});

function diskProgressColor(usage: number) {
  if (usage >= 90) return '#f56c6c';
  if (usage >= 70) return '#e6a23c';
  return '#67c23a';
}

/******************************** 数据加载 ********************************/

async function fetchData() {
  loading.value = true;
  try {
    const response = (await getServerInfo()) as any;
    if (response?.data) {
      Object.assign(serverData, response.data);
    }
  } catch (e) {
    console.error('Failed to fetch server info:', e);
  } finally {
    loading.value = false;
  }
}

function refreshData() {
  fetchData();
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.server-page {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  background: var(--color-bg-page);
}

.server-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.server-page__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.server-page__subtitle {
  margin: 6px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
}

/******************************** 卡片 ********************************/

.server-page__cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(280px, 1fr));
  gap: 18px;
}

.server-page__card {
  border-radius: 18px;
  border: 1px solid var(--el-border-color-light);
  box-shadow: 0 10px 30px rgb(15 23 42 / 6%);

  :deep(.el-card__header) {
    padding: 16px 24px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-card__body) {
    padding: 24px;
  }
}

.server-page__card-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
}

.server-page__card-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.server-page__gauge {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.server-page__gauge-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text-primary);
}

.server-page__gauge-label {
  display: block;
  font-size: 11px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.server-page__stats {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.server-page__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.server-page__stat-label {
  font-size: 11px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.server-page__stat-value {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
}

/******************************** 信息列表 ********************************/

.server-page__info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.server-page__info-card {
  border-radius: 18px;
  border: 1px solid var(--el-border-color-light);
  box-shadow: 0 10px 30px rgb(15 23 42 / 6%);

  :deep(.el-card__header) {
    padding: 16px 24px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-primary);
    }
  }

  :deep(.el-card__body) {
    padding: 20px 24px;
  }
}

.server-page__info-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  margin: 0;
}

.server-page__info-item {
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);

  dt {
    font-size: 11px;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  dd {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    word-break: break-all;
  }
}

/******************************** 磁盘 ********************************/

.server-page__disk-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.server-page__disk-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.server-page__disk-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.server-page__disk-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.server-page__disk-type {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.server-page__disk-text {
  font-size: 12px;
}

/******************************** 响应式 ********************************/

@media (max-width: 1080px) {
  .server-page__cards {
    grid-template-columns: repeat(2, minmax(240px, 1fr));
  }
  .server-page__info-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .server-page {
    padding: 14px;
  }
  .server-page__cards {
    grid-template-columns: minmax(0, 1fr);
  }
  .server-page__info-list {
    grid-template-columns: 1fr;
  }
}
</style>
