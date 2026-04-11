<template>
  <div class="common-layout">
    <el-container>
      <el-header>{{ t('layout.header') }}</el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
