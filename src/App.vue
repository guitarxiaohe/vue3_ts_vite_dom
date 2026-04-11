<script setup lang="ts">
import { computed } from 'vue';
import Menu from '@/components/menu/index.vue';
import { useLocale } from '@/composables/useLocale';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import en from 'element-plus/es/locale/lang/en';
import zhTw from 'element-plus/es/locale/lang/zh-tw';

const { currentLocale } = useLocale();

const elementLocale = computed(() => {
  const localeMap: Record<string, any> = {
    'zh-CN': zhCn,
    'en-US': en,
    'zh-TW': zhTw,
  };
  return localeMap[currentLocale.value] || zhCn;
});
</script>

<template>
  <el-config-provider :locale="elementLocale">
    <Menu />
    <router-view></router-view>
  </el-config-provider>
</template>
