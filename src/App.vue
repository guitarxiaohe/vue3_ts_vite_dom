<script setup lang="ts">
import { computed } from 'vue';
import PlateMenu from '@/components/plate-menu/index.vue';
import SettingsPanel from '@/components/settings-panel/index.vue';
import { useSystemStore } from '@/stores';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import en from 'element-plus/es/locale/lang/en';
import zhTw from 'element-plus/es/locale/lang/zh-tw';

const systemStore = useSystemStore();

const elementLocale = computed(() => {
  const localeMap: Record<string, any> = {
    'zh-CN': zhCn,
    'en-US': en,
    'zh-TW': zhTw,
  };
  return localeMap[systemStore.currentLocale] || zhCn;
});
</script>

<template>
  <el-config-provider :locale="elementLocale">
    <PlateMenu v-if="systemStore.isSimpleMode" />
    <SettingsPanel v-if="systemStore.isSimpleMode" />
    <router-view></router-view>
  </el-config-provider>
</template>
