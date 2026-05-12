<template>
  <div class="cache-page">
    <!-------------------------- 页面头部 -------------------------->
    <section class="cache-page__header">
      <div>
        <h2 class="cache-page__title">{{ t('monitor.cache.title') }}</h2>
        <p class="cache-page__subtitle">{{ t('monitor.cache.desc') }}</p>
      </div>
      <el-button :loading="loading" @click="refreshData">
        {{ t('common.refresh') }}
      </el-button>
    </section>

    <!-------------------------- 概览卡片 -------------------------->
    <section class="cache-page__cards">
      <el-card shadow="never" class="cache-page__card">
        <div class="cache-page__kv">
          <span class="cache-page__kv-label"
            >Redis {{ t('monitor.cache.version') }}</span
          >
          <span class="cache-page__kv-value">{{
            cacheStats.redisVersion
          }}</span>
        </div>
      </el-card>
      <el-card shadow="never" class="cache-page__card">
        <div class="cache-page__kv">
          <span class="cache-page__kv-label">{{
            t('monitor.cache.keys')
          }}</span>
          <span class="cache-page__kv-value cache-page__kv-value--highlight">{{
            cacheData.dbSize ?? '--'
          }}</span>
        </div>
      </el-card>
      <el-card shadow="never" class="cache-page__card">
        <div class="cache-page__kv">
          <span class="cache-page__kv-label">{{
            t('monitor.cache.uptime')
          }}</span>
          <span class="cache-page__kv-value"
            >{{ cacheStats.uptimeInDays }}{{ t('monitor.cache.days') }}</span
          >
        </div>
      </el-card>
      <el-card shadow="never" class="cache-page__card">
        <div class="cache-page__kv">
          <span class="cache-page__kv-label">{{
            t('monitor.cache.connected')
          }}</span>
          <span class="cache-page__kv-value">{{
            cacheStats.connectedClients
          }}</span>
        </div>
      </el-card>
    </section>

    <!-------------------------- 内存与持久化 -------------------------->
    <section class="cache-page__row">
      <el-card shadow="never" class="cache-page__info-card">
        <template #header>
          <h3>{{ t('monitor.cache.memory') }}</h3>
        </template>
        <dl class="cache-page__list">
          <div class="cache-page__list-item">
            <dt>used_memory_human</dt>
            <dd>{{ cacheStats.usedMemoryHuman }}</dd>
          </div>
          <div class="cache-page__list-item">
            <dt>used_memory_rss_human</dt>
            <dd>{{ cacheStats.usedMemoryRssHuman }}</dd>
          </div>
          <div class="cache-page__list-item">
            <dt>used_memory_peak_human</dt>
            <dd>{{ cacheStats.usedMemoryPeakHuman }}</dd>
          </div>
          <div class="cache-page__list-item">
            <dt>mem_fragmentation_ratio</dt>
            <dd>{{ cacheStats.memFragmentationRatio }}</dd>
          </div>
          <div class="cache-page__list-item">
            <dt>maxmemory_human</dt>
            <dd>{{ cacheStats.maxmemoryHuman ?? 'unlimited' }}</dd>
          </div>
        </dl>
      </el-card>

      <el-card shadow="never" class="cache-page__info-card">
        <template #header>
          <h3>{{ t('monitor.cache.persistence') }}</h3>
        </template>
        <dl class="cache-page__list">
          <div class="cache-page__list-item">
            <dt>rdb_last_save_time</dt>
            <dd>{{ cacheStats.rdbLastSaveTime }}</dd>
          </div>
          <div class="cache-page__list-item">
            <dt>rdb_changes_since_last_save</dt>
            <dd>{{ cacheStats.rdbChangesSinceLastSave }}</dd>
          </div>
          <div class="cache-page__list-item">
            <dt>aof_enabled</dt>
            <dd>
              <el-tag
                :type="cacheStats.aofEnabled === '1' ? 'success' : 'info'"
                size="small"
              >
                {{ cacheStats.aofEnabled === '1' ? 'ON' : 'OFF' }}
              </el-tag>
            </dd>
          </div>
          <div class="cache-page__list-item">
            <dt>loading</dt>
            <dd>
              <el-tag
                :type="cacheStats.loading === '1' ? 'warning' : 'success'"
                size="small"
              >
                {{ cacheStats.loading === '1' ? 'Loading' : 'Ready' }}
              </el-tag>
            </dd>
          </div>
        </dl>
      </el-card>
    </section>

    <!-------------------------- 命令统计 -------------------------->
    <section class="cache-page__commands">
      <el-card shadow="never" class="cache-page__info-card">
        <template #header>
          <h3>{{ t('monitor.cache.commandStats') }}</h3>
        </template>
        <div class="cache-page__command-grid">
          <div
            v-for="cmd in cacheData.commandStats ?? []"
            :key="cmd.name"
            class="cache-page__command-item"
          >
            <span class="cache-page__command-name">{{ cmd.name }}</span>
            <span class="cache-page__command-value">{{ cmd.value }}</span>
          </div>
        </div>
        <el-empty
          v-if="!cacheData.commandStats?.length"
          :description="t('common.noData')"
        />
      </el-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getCacheInfo } from '@/api/modules/monitor';

/******************************** 类型 ********************************/

interface CacheCommandStat {
  name: string;
  value: string;
}

/******************************** 基础状态 ********************************/

const { t } = useI18n();
const loading = ref(false);

const cacheData = reactive<{
  info: Record<string, any>;
  dbSize: number | null;
  commandStats: CacheCommandStat[];
}>({
  info: {},
  dbSize: null,
  commandStats: [],
});

/******************************** 缓存统计计算 ********************************/

const cacheStats = computed(() => {
  const info = cacheData.info ?? {};
  const getVal = (key: string) => String(info[key] ?? '--');

  const sec = Number(getVal('uptime_in_seconds'));
  const uptimeDays = Number.isNaN(sec) ? '--' : (sec / 86400).toFixed(1);

  return {
    redisVersion: getVal('redis_version'),
    uptimeInDays: uptimeDays,
    connectedClients: getVal('connected_clients'),
    usedMemoryHuman: getVal('used_memory_human'),
    usedMemoryRssHuman: getVal('used_memory_rss_human'),
    usedMemoryPeakHuman: getVal('used_memory_peak_human'),
    memFragmentationRatio: getVal('mem_fragmentation_ratio'),
    maxmemoryHuman: getVal('maxmemory_human'),
    rdbLastSaveTime: getVal('rdb_last_save_time'),
    rdbChangesSinceLastSave: getVal('rdb_changes_since_last_save'),
    aofEnabled: getVal('aof_enabled'),
    loading: getVal('loading'),
  };
});

/******************************** 数据加载 ********************************/

async function fetchData() {
  loading.value = true;
  try {
    const response = (await getCacheInfo()) as any;
    if (response?.data) {
      cacheData.info = response.data.info ?? {};
      cacheData.dbSize = response.data.dbSize ?? null;
      cacheData.commandStats = response.data.commandStats ?? [];
    }
  } catch (e) {
    console.error('Failed to fetch cache info:', e);
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
.cache-page {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  background: var(--color-bg-page);
}

.cache-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.cache-page__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.cache-page__subtitle {
  margin: 6px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
}

/******************************** 概览卡片 ********************************/

.cache-page__cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 18px;
}

.cache-page__card {
  text-align: center;
  border-radius: 18px;
  border: 1px solid var(--el-border-color-light);
  box-shadow: 0 10px 30px rgb(15 23 42 / 6%);

  :deep(.el-card__body) {
    padding: 28px 24px;
  }
}

.cache-page__kv {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cache-page__kv-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.cache-page__kv-value {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-text-primary);
}

.cache-page__kv-value--highlight {
  color: var(--color-primary);
}

/******************************** 行区块 ********************************/

.cache-page__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.cache-page__info-card {
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

.cache-page__list {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
}

.cache-page__list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &:last-child {
    border-bottom: 0;
  }

  dt {
    font-size: 12px;
    color: var(--color-text-secondary);
    font-family: 'SF Mono', 'Cascadia Code', monospace;
  }

  dd {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
}

/******************************** 命令统计 ********************************/

.cache-page__commands {
  display: flex;
  flex-direction: column;
}

.cache-page__command-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 8px;
}

.cache-page__command-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--color-bg-page);
  border: 1px solid var(--el-border-color-lighter);
}

.cache-page__command-name {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-family: 'SF Mono', 'Cascadia Code', monospace;
}

.cache-page__command-value {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
}

/******************************** 响应式 ********************************/

@media (max-width: 1080px) {
  .cache-page__cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 720px) {
  .cache-page {
    padding: 14px;
  }
  .cache-page__cards {
    grid-template-columns: 1fr;
  }
  .cache-page__row {
    grid-template-columns: 1fr;
  }
}
</style>
