<script lang="ts" setup>
import { useSystemStore } from '@/stores';

import ConventionalMenu from '@/components/conventional-menu/index.vue';
const systemStore = useSystemStore();
</script>
<template>
  <div class="common-layout">
    <el-container>
      <ConventionalMenu v-if="systemStore.isConventionalMode" />

      <el-container>
        <el-header>Header</el-header>

        <el-main>
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>
