<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import MultiviewShell from '@/features/multiview/components/multiview-shell.vue';

/******************************** 字段配置管理 ********************************/

const { t } = useI18n();
</script>

<template>
  <MultiviewShell
    entity-key="fieldConfig"
    :title="t('fieldConfig.title')"
    :row-key="'id'"
  />
</template>
