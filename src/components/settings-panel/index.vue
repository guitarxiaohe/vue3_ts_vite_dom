<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSystemStore, type ThemeMode, type InterfaceMode } from '@/stores';
import {
  Sun,
  Moon,
  Monitor,
  Globe,
  Settings,
  Layout,
  ChevronRight,
  Navigation,
} from 'lucide-vue-next';

const { t } = useI18n();
const systemStore = useSystemStore();

const showSettings = ref(false);

const getThemeIcon = computed(() => {
  if (systemStore.currentTheme === 'light') return Sun;
  if (systemStore.currentTheme === 'dark') return Moon;
  return Monitor;
});

const handleThemeChange = (mode: ThemeMode) => {
  systemStore.changeTheme(mode);
};

const handleLocaleChange = (locale: 'zh-CN' | 'en-US' | 'zh-TW') => {
  systemStore.changeLocale(locale);
};

const handleInterfaceModeChange = (mode: InterfaceMode) => {
  systemStore.changeInterfaceMode(mode);
};

const interfaceModeOptions = computed(() => [
  {
    label: t('interfaceMode.simple'),
    value: 'simple' as InterfaceMode,
    desc: t('interfaceMode.simpleDesc'),
  },
  {
    label: t('interfaceMode.conventional'),
    value: 'conventional' as InterfaceMode,
    desc: t('interfaceMode.conventionalDesc'),
  },
]);
</script>

<template>
  <div
    class="settings-panel"
    :class="{ 'is-simple': systemStore.isSimpleMode }"
  >
    <template v-if="systemStore.isSimpleMode">
      <div class="floating-trigger" @click="showSettings = true">
        <Settings :size="20" />
      </div>
    </template>

    <template v-else>
      <div class="settings-panel__triggers">
        <el-dropdown trigger="click" @command="handleThemeChange">
          <div class="trigger-item">
            <component :is="getThemeIcon" :size="18" />
          </div>
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
          <div class="trigger-item">
            <Globe :size="18" />
          </div>
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

        <div class="trigger-item" @click="showSettings = true">
          <Settings :size="18" />
        </div>
      </div>
    </template>

    <el-drawer
      v-model="showSettings"
      :title="t('interfaceMode.switchMode')"
      direction="rtl"
      size="320px"
      append-to-body
    >
      <div class="settings-drawer">
        <div class="settings-section">
          <div class="section-title">
            <Layout :size="16" />
            <span>{{ t('interfaceMode.switchMode') }}</span>
          </div>

          <div class="interface-mode-list">
            <div
              v-for="option in interfaceModeOptions"
              :key="option.value"
              class="interface-mode-item"
              :class="{
                'is-active': systemStore.interfaceMode === option.value,
              }"
              @click="handleInterfaceModeChange(option.value)"
            >
              <div class="mode-info">
                <div class="mode-label">{{ option.label }}</div>
                <div class="mode-desc">{{ option.desc }}</div>
              </div>
              <ChevronRight
                v-if="systemStore.interfaceMode === option.value"
                :size="16"
                class="mode-check"
              />
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="section-title">
            <component :is="getThemeIcon" :size="16" />
            <span>{{ t('theme.switchTheme') }}</span>
          </div>

          <div class="theme-options">
            <div
              v-for="option in systemStore.themeOptions"
              :key="option.value"
              class="theme-option"
              :class="{
                'is-active': systemStore.currentTheme === option.value,
              }"
              @click="handleThemeChange(option.value)"
            >
              {{ option.label }}
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="section-title">
            <Globe :size="16" />
            <span>{{ t('locale.switchLanguage') }}</span>
          </div>

          <div class="locale-options">
            <div
              v-for="option in systemStore.localeOptions"
              :key="option.value"
              class="locale-option"
              :class="{
                'is-active': systemStore.currentLocale === option.value,
              }"
              @click="handleLocaleChange(option.value)"
            >
              {{ option.label }}
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="section-title">
            <Navigation :size="16" />
            <span>{{ t('breadcrumb.setting') }}</span>
          </div>

          <div class="breadcrumb-setting">
            <span class="breadcrumb-label">
              {{
                systemStore.showBreadcrumb
                  ? t('breadcrumb.show')
                  : t('breadcrumb.hide')
              }}
            </span>
            <el-switch
              v-model="systemStore.showBreadcrumb"
              :active-text="t('breadcrumb.show')"
              :inactive-text="t('breadcrumb.hide')"
              inline-prompt
            />
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style lang="scss" scoped>
.settings-panel {
  &.is-simple {
    position: fixed;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    z-index: 1000;
  }
}

.floating-trigger {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-card);
  border-radius: 0.5rem 0 0 0.5rem;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s;
  color: var(--el-text-color-secondary);

  &:hover {
    width: 52px;
    background-color: #6c3ff5;
    color: #fff;
    box-shadow: -4px 0 12px rgba(108, 63, 245, 0.3);
  }
}

.settings-panel__triggers {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .trigger-item {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--el-text-color-secondary);

    &:hover {
      background-color: var(--el-fill-color-light);
      color: var(--color-text-primary);
    }
  }
}

.settings-drawer {
  padding: 0 1rem;
}

.settings-section {
  margin-bottom: 2rem;

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-primary);
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
}

.interface-mode-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .interface-mode-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid var(--el-border-color-lighter);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      background-color: var(--el-fill-color-light);
    }

    &.is-active {
      border-color: #6c3ff5;
      background-color: rgba(108, 63, 245, 0.05);

      .mode-label {
        color: #6c3ff5;
      }

      .mode-check {
        color: #6c3ff5;
      }
    }

    .mode-info {
      .mode-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-text-primary);
        margin-bottom: 0.25rem;
      }

      .mode-desc {
        font-size: 0.75rem;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

.theme-options,
.locale-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  .theme-option,
  .locale-option {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    border: 1px solid var(--el-border-color-lighter);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      background-color: var(--el-fill-color-light);
    }

    &.is-active {
      border-color: #6c3ff5;
      background-color: #6c3ff5;
      color: #fff;
    }
  }
}

.breadcrumb-setting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--el-border-color-lighter);

  .breadcrumb-label {
    font-size: 0.875rem;
    color: var(--color-text-primary);
  }
}
</style>
