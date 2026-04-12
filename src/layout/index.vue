<script lang="ts" setup>
import { useSystemStore } from '@/stores';

import ConventionalMenu from '@/components/conventional-menu/index.vue';
const systemStore = useSystemStore();
</script>
<template>
  <div class="common-layout">
    <el-container>
      <el-header>Header</el-header>
      <el-container>
        <el-aside>
          <ConventionalMenu v-if="systemStore.isConventionalMode" />
        </el-aside>
        <el-main>
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>
