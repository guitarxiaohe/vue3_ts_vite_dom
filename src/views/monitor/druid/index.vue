<template>
  <div class="druid-page">
    <section class="druid-page__header">
      <div>
        <h2 class="druid-page__title">Druid {{ t('monitor.druid.title') }}</h2>
        <p class="druid-page__subtitle">{{ t('monitor.druid.desc') }}</p>
      </div>
      <el-button @click="openExternal">
        {{ t('monitor.druid.openExternal') }}
      </el-button>
    </section>

    <section class="druid-page__frame">
      <iframe
        :src="druidUrl"
        class="druid-page__iframe"
        frameborder="0"
        title="Druid Monitor"
        @error="onIframeError"
      />
      <el-empty
        v-if="iframeError"
        :description="t('monitor.druid.loadError')"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

/******************************** 状态 ********************************/

const { t } = useI18n();
const iframeError = ref(false);

const druidUrl = `${import.meta.env.VITE_APP_BASE_API || '/dev-api'}/druid/index.html`;

function openExternal() {
  window.open(druidUrl, '_blank');
}

function onIframeError() {
  iframeError.value = true;
}
</script>

<style scoped lang="scss">
.druid-page {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  background: var(--color-bg-page);
}

.druid-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.druid-page__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.druid-page__subtitle {
  margin: 6px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.druid-page__frame {
  flex: 1;
  min-height: 0;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  background: #fff;
  box-shadow: 0 10px 30px rgb(15 23 42 / 6%);
}

.druid-page__iframe {
  width: 100%;
  height: 100%;
  min-height: 700px;
  border: 0;
}

@media (max-width: 720px) {
  .druid-page {
    padding: 14px;
  }
  .druid-page__iframe {
    min-height: 500px;
  }
}
</style>
