<script setup lang="ts">
import { computed } from 'vue';
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

const showFloatingSettings = computed(
  () => systemStore.isSimpleMode || systemStore.navigationMode === 'top'
);
</script>

<template>
  <el-config-provider :locale="elementLocale">
    <SettingsPanel v-if="showFloatingSettings" floating />
    <router-view></router-view>
  </el-config-provider>
</template>
