<template>
  <div class="swagger-page">
    <section class="swagger-page__header">
      <div>
        <h2 class="swagger-page__title">{{ t('tool.swagger.title') }}</h2>
        <p class="swagger-page__subtitle">{{ t('tool.swagger.desc') }}</p>
      </div>
      <el-button @click="openExternal">
        {{ t('tool.swagger.openExternal') }}
      </el-button>
    </section>

    <section class="swagger-page__frame">
      <iframe
        :src="swaggerUrl"
        class="swagger-page__iframe"
        frameborder="0"
        title="Swagger API"
        @error="onIframeError"
      />
      <el-empty v-if="iframeError" :description="t('tool.swagger.loadError')" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

/******************************** 状态 ********************************/

const { t } = useI18n();
const iframeError = ref(false);

const swaggerUrl = `${import.meta.env.VITE_APP_BASE_API || '/dev-api'}/doc.html`;

function openExternal() {
  window.open(swaggerUrl, '_blank');
}

function onIframeError() {
  iframeError.value = true;
}
</script>

<style scoped lang="scss">
.swagger-page {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  background: var(--color-bg-page);
}

.swagger-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.swagger-page__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.swagger-page__subtitle {
  margin: 6px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.swagger-page__frame {
  flex: 1;
  min-height: 0;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  background: #fff;
  box-shadow: 0 10px 30px rgb(15 23 42 / 6%);
}

.swagger-page__iframe {
  width: 100%;
  height: 100%;
  min-height: 700px;
  border: 0;
}

@media (max-width: 720px) {
  .swagger-page {
    padding: 14px;
  }

  .swagger-page__iframe {
    min-height: 500px;
  }
}
</style>
