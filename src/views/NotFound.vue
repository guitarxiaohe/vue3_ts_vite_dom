<template>
<div class='app-container'>
  <h1>{{ t('notFound.title') }}</h1>
  <p>{{ t('notFound.description') }}</p>
</div>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
<style scoped lang='scss'>
</style>
