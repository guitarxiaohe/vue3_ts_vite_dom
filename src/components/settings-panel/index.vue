<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import {
  Check,
  ChevronDown,
  Globe,
  Monitor,
  Moon,
  PanelLeft,
  PanelTop,
  Save,
  Settings,
  Sun,
} from 'lucide-vue-next';
import {
  useSystemStore,
  type AnimationSpeed,
  type NavigationMode,
  type PageTransition,
  type ThemeMode,
} from '@/stores';

const props = withDefaults(
  defineProps<{
    floating?: boolean;
  }>(),
  {
    floating: false,
  }
);

const { t } = useI18n();
const systemStore = useSystemStore();

const showSettings = ref(false);
const saving = ref(false);
const isFloating = computed(() => props.floating || systemStore.isSimpleMode);

const themeColorOptions = [
  '#5E6AD2',
  '#1E88E5',
  '#2BB8C5',
  '#31C46B',
  '#FF8A00',
  '#FF4D4F',
  '#EC4899',
];

const getThemeIcon = computed(() => {
  if (systemStore.currentTheme === 'light') return Sun;
  if (systemStore.currentTheme === 'dark') return Moon;
  return Monitor;
});

const themeModeOptions = computed(() => [
  {
    label: t('theme.light'),
    value: 'light' as ThemeMode,
    icon: Sun,
  },
  {
    label: t('theme.dark'),
    value: 'dark' as ThemeMode,
    icon: Moon,
  },
  {
    label: t('theme.auto'),
    value: 'auto' as ThemeMode,
    icon: Monitor,
  },
]);

const navigationModeOptions = computed(() => [
  {
    label: t('settingsDrawer.sideNav'),
    value: 'side' as NavigationMode,
    icon: PanelLeft,
  },
  {
    label: t('settingsDrawer.topNav'),
    value: 'top' as NavigationMode,
    icon: PanelTop,
  },
]);

const transitionOptions = computed(() => [
  { label: t('settingsDrawer.transitionFade'), value: 'fade' },
  { label: t('settingsDrawer.transitionSlide'), value: 'slide' },
  { label: t('settingsDrawer.transitionZoom'), value: 'zoom' },
  { label: t('settingsDrawer.transitionNone'), value: 'none' },
]);

const speedOptions = computed(() => [
  { label: t('settingsDrawer.speedSlow'), value: 'slow' },
  { label: t('settingsDrawer.speedNormal'), value: 'normal' },
  { label: t('settingsDrawer.speedFast'), value: 'fast' },
]);

const handleThemeChange = (mode: ThemeMode) => {
  systemStore.changeTheme(mode);
};

const handleLocaleChange = (locale: 'zh-CN' | 'en-US' | 'zh-TW') => {
  systemStore.changeLocale(locale);
};

const handleNavigationModeChange = (mode: NavigationMode) => {
  systemStore.changeNavigationMode(mode);
};

const handleSaveSettings = async () => {
  saving.value = true;
  try {
    await systemStore.saveSettingsNow();
    ElMessage.success(t('settingsDrawer.saveSuccess'));
  } catch {
    ElMessage.error(t('common.failed'));
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div class="settings-panel" :class="{ 'is-floating': isFloating }">
    <template v-if="isFloating">
      <button
        type="button"
        class="floating-trigger"
        :aria-label="t('settingsDrawer.title')"
        @click="showSettings = true"
      >
        <Settings :size="20" />
      </button>
    </template>

    <template v-else>
      <div class="settings-panel__triggers">
        <el-dropdown trigger="click" @command="handleThemeChange">
          <button type="button" class="trigger-item">
            <component :is="getThemeIcon" :size="18" />
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="option in systemStore.themeOptions"
                :key="option.value"
                :command="option.value"
                :class="{
                  'is-active': systemStore.currentTheme === option.value,
                }"
              >
                {{ option.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-dropdown trigger="click" @command="handleLocaleChange">
          <button type="button" class="trigger-item">
            <Globe :size="18" />
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="option in systemStore.localeOptions"
                :key="option.value"
                :command="option.value"
                :class="{
                  'is-active': systemStore.currentLocale === option.value,
                }"
              >
                {{ option.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <button
          type="button"
          class="trigger-item"
          :aria-label="t('settingsDrawer.title')"
          @click="showSettings = true"
        >
          <Settings :size="18" />
        </button>
      </div>
    </template>

    <el-drawer
      v-model="showSettings"
      direction="rtl"
      size="300px"
      append-to-body
      class="settings-drawer-root"
      :with-header="false"
    >
      <div class="settings-drawer">
        <!-------------------------- 抽屉头部 -------------------------->
        <header class="settings-drawer__header">
          <div>
            <h2 class="settings-drawer__title">
              {{ t('settingsDrawer.title') }}
            </h2>
            <p class="settings-drawer__subtitle">
              {{ t('settingsDrawer.subtitle') }}
            </p>
          </div>
          <button
            type="button"
            class="settings-drawer__close"
            :aria-label="t('common.close')"
            @click="showSettings = false"
          >
            ×
          </button>
        </header>

        <!-------------------------- 主题模式 -------------------------->
        <section class="settings-section">
          <h3 class="settings-section__title">
            1. {{ t('settingsDrawer.themeMode') }}
          </h3>
          <div class="settings-card-grid">
            <button
              v-for="option in themeModeOptions"
              :key="option.value"
              type="button"
              class="settings-option-card"
              :class="{
                'is-active': systemStore.currentTheme === option.value,
              }"
              @click="handleThemeChange(option.value)"
            >
              <component :is="option.icon" :size="22" />
              <span>{{ option.label }}</span>
              <Check
                v-if="systemStore.currentTheme === option.value"
                :size="13"
                class="settings-option-card__check"
              />
            </button>
          </div>
        </section>

        <!-------------------------- 主题色 -------------------------->
        <section class="settings-section">
          <h3 class="settings-section__title">
            2. {{ t('settingsDrawer.themeColor') }}
          </h3>
          <div class="settings-color-list">
            <button
              v-for="color in themeColorOptions"
              :key="color"
              type="button"
              class="settings-color"
              :class="{ 'is-active': systemStore.themeColor === color }"
              :style="{ backgroundColor: color }"
              :aria-label="color"
              @click="systemStore.changeThemeColor(color)"
            >
              <Check v-if="systemStore.themeColor === color" :size="14" />
            </button>
          </div>
        </section>

        <!-------------------------- 导航模式 -------------------------->
        <section class="settings-section">
          <h3 class="settings-section__title">
            3. {{ t('settingsDrawer.navigationMode') }}
          </h3>
          <div class="settings-segmented">
            <button
              v-for="option in navigationModeOptions"
              :key="option.value"
              type="button"
              class="settings-segmented__item"
              :class="{
                'is-active': systemStore.navigationMode === option.value,
              }"
              @click="handleNavigationModeChange(option.value)"
            >
              <component :is="option.icon" :size="20" />
              <span>{{ option.label }}</span>
            </button>
          </div>
        </section>

        <!-------------------------- 语言设置 -------------------------->
        <section class="settings-section">
          <h3 class="settings-section__title">
            4. {{ t('settingsDrawer.language') }}
          </h3>
          <div class="settings-pills">
            <button
              v-for="option in systemStore.localeOptions"
              :key="option.value"
              type="button"
              class="settings-pill"
              :class="{
                'is-active': systemStore.currentLocale === option.value,
              }"
              @click="handleLocaleChange(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </section>

        <!-------------------------- 界面显示 -------------------------->
        <section class="settings-section">
          <h3 class="settings-section__title">
            5. {{ t('settingsDrawer.display') }}
          </h3>
          <div class="settings-switch-list">
            <div class="settings-switch-row">
              <span>{{ t('settingsDrawer.showBreadcrumb') }}</span>
              <el-switch v-model="systemStore.showBreadcrumb" />
            </div>
            <div class="settings-switch-row">
              <span>{{ t('settingsDrawer.fixedHeader') }}</span>
              <el-switch v-model="systemStore.fixedHeader" />
            </div>
          </div>
        </section>

        <!-------------------------- 动效设置 -------------------------->
        <section class="settings-section">
          <h3 class="settings-section__title">
            6. {{ t('settingsDrawer.animation') }}
          </h3>
          <div class="settings-form-list">
            <label class="settings-form-row">
              <span>{{ t('settingsDrawer.pageTransition') }}</span>
              <el-select
                v-model="systemStore.pageTransition"
                size="small"
                class="settings-select"
                :suffix-icon="ChevronDown"
              >
                <el-option
                  v-for="option in transitionOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value as PageTransition"
                />
              </el-select>
            </label>
            <label class="settings-form-row">
              <span>{{ t('settingsDrawer.animationSpeed') }}</span>
              <el-select
                v-model="systemStore.animationSpeed"
                size="small"
                class="settings-select"
                :suffix-icon="ChevronDown"
              >
                <el-option
                  v-for="option in speedOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value as AnimationSpeed"
                />
              </el-select>
            </label>
          </div>
        </section>

        <el-button
          class="settings-drawer__save"
          type="primary"
          :loading="saving"
          @click="handleSaveSettings"
        >
          <Save :size="15" />
          <span>{{ t('settingsDrawer.save') }}</span>
        </el-button>
      </div>
    </el-drawer>
  </div>
</template>

<style lang="scss" scoped>
.settings-panel {
  &.is-floating {
    position: fixed;
    top: 50%;
    right: 0;
    z-index: var(--z-dropdown);
    transform: translateY(-50%);
  }
}

.floating-trigger,
.trigger-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast),
    width var(--transition-normal);
}

.floating-trigger {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md) 0 0 var(--radius-md);
  background-color: var(--color-bg-card);
  box-shadow: var(--shadow-md);

  &:hover {
    width: 52px;
    background-color: var(--color-primary);
    color: var(--color-bg-card);
  }
}

.settings-panel__triggers {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.trigger-item {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);

  &:hover {
    background-color: var(--color-bg-hover);
    color: var(--color-text-primary);
  }
}

:global(.settings-drawer-root .el-drawer__body) {
  padding: 0;
}

.settings-drawer {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 18px;
  background: var(--color-bg-card);
}

.settings-drawer__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin-bottom: 18px;
}

.settings-drawer__title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 700;
  line-height: 24px;
}

.settings-drawer__subtitle {
  margin: 2px 0 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 18px;
}

.settings-drawer__close {
  border: 0;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 22px;
  line-height: 24px;
  cursor: pointer;
}

.settings-section {
  margin-bottom: 18px;
}

.settings-section__title {
  margin: 0 0 10px;
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 700;
  line-height: 20px;
}

.settings-card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.settings-option-card {
  position: relative;
  display: flex;
  min-height: 68px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  font-size: 12px;
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    color var(--transition-fast),
    box-shadow var(--transition-fast);

  &.is-active {
    border-color: var(--color-primary);
    color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-bg);
  }
}

.settings-option-card__check {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 2px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: var(--color-bg-card);
}

.settings-color-list {
  display: flex;
  align-items: center;
  gap: 10px;
}

.settings-color {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 2px solid transparent;
  border-radius: var(--radius-full);
  color: var(--color-bg-card);
  cursor: pointer;
  box-shadow: 0 0 0 1px var(--color-border);

  &.is-active {
    box-shadow: 0 0 0 3px var(--color-primary-bg);
    border-color: var(--color-bg-card);
  }
}

.settings-segmented,
.settings-pills {
  display: flex;
  gap: 10px;
}

.settings-segmented__item,
.settings-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    background-color var(--transition-fast),
    color var(--transition-fast);

  &.is-active {
    border-color: var(--color-primary);
    background: var(--color-primary);
    color: var(--color-bg-card);
  }
}

.settings-segmented__item {
  flex: 1;
  gap: 8px;
  height: 44px;
  font-size: 13px;
}

.settings-pill {
  min-width: 74px;
  height: 32px;
  font-size: 12px;
}

.settings-switch-list,
.settings-form-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings-switch-row,
.settings-form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  color: var(--color-text-primary);
  font-size: 12px;
  line-height: 24px;
}

.settings-select {
  width: 136px;
}

.settings-drawer__save {
  width: 100%;
  height: 38px;
  margin-top: auto;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  box-shadow: var(--shadow-md);

  :deep(span) {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
}
</style>
