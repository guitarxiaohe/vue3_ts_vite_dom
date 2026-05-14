<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import PlateMenu from '@/components/plate-menu/index.vue';
import SettingsPanel from '@/components/settings-panel/index.vue';
import { useSystemStore } from '@/stores';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import en from 'element-plus/es/locale/lang/en';
import zhTw from 'element-plus/es/locale/lang/zh-tw';

/******************************** 全局加载条 ********************************/

const router = useRouter();
const loading = ref(false);
let loadTimer: ReturnType<typeof setTimeout> | null = null;

router.beforeEach((_to, _from, next) => {
  if (loadTimer) clearTimeout(loadTimer);
  loading.value = true;
  next();
});

router.afterEach(() => {
  loadTimer = setTimeout(() => {
    loading.value = false;
  }, 300);
});

/******************************** Element Plus 国际化 ********************************/

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
    <!-------------------------- 全局加载条 -------------------------->
    <div v-if="loading" class="global-loading-bar" />

    <PlateMenu v-if="systemStore.isSimpleMode" />
    <SettingsPanel v-if="systemStore.isSimpleMode" />
    <router-view />
  </el-config-provider>
</template>

<style lang="scss">
/******************************** 全局加载条 ********************************/

.global-loading-bar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  width: 100%;
  height: 3px;
  background: transparent;

  &::after {
    content: '';
    display: block;
    height: 100%;
    width: 40%;
    background: var(--color-primary, #6c3ff5);
    animation: global-loading-slide 1.2s ease-in-out infinite;
    border-radius: 0 2px 2px 0;
  }
}

@keyframes global-loading-slide {
  0% {
    transform: translateX(-100%);
    width: 40%;
  }
  50% {
    width: 60%;
  }
  100% {
    transform: translateX(250%);
    width: 30%;
  }
}
</style>
