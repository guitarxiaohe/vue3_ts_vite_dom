<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import SettingsPanel from '@/components/settings-panel/index.vue';
import {
  House,
  Box,
  Package,
  Settings,
  MessageSquare,
  FileText,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const isCollapse = ref(false);

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value;
};

const menuItems = [
  {
    index: '/',
    nameKey: 'menu.home',
    icon: House,
  },
  {
    index: '/three',
    nameKey: 'menu.threeScene',
    icon: Box,
  },
  {
    index: '/components',
    nameKey: 'menu.components',
    icon: Package,
  },
  {
    index: 'system',
    nameKey: 'menu.settings',
    icon: Settings,
    children: [
      { index: '/settings/user', nameKey: 'menu.user' },
      { index: '/settings/data', nameKey: 'menu.data' },
    ],
  },
  {
    index: 'message',
    nameKey: 'menu.messages',
    icon: MessageSquare,
    children: [
      { index: '/messages/list', nameKey: 'menu.messages' },
      { index: '/messages/calendar', nameKey: 'menu.calendar' },
    ],
  },
  {
    index: '/files',
    nameKey: 'menu.files',
    icon: FileText,
  },
  {
    index: '/help',
    nameKey: 'menu.help',
    icon: HelpCircle,
  },
];

const defaultActive = computed(() => route.path);

const handleSelect = (index: string) => {
  if (!index.startsWith('/')) return;
  router.push(index);
};
</script>

<template>
  <div class="conventional-menu" :class="{ 'is-collapse': isCollapse }">
    <div class="conventional-menu__logo">
      <span class="logo-icon">✨</span>
      <span v-show="!isCollapse" class="logo-text">YourBrand</span>
    </div>

    <el-scrollbar class="conventional-menu__scroll">
      <el-menu
        :default-active="defaultActive"
        :collapse="isCollapse"
        :collapse-transition="false"
        :unique-opened="true"
        background-color="transparent"
        text-color="var(--color-text-primary)"
        active-text-color="#6c3ff5"
        @select="handleSelect"
      >
        <template v-for="item in menuItems" :key="item.index">
          <el-sub-menu v-if="item.children" :index="item.index">
            <template #title>
              <component :is="item.icon" :size="18" class="menu-icon" />
              <span>{{ t(item.nameKey) }}</span>
            </template>
            <el-menu-item
              v-for="child in item.children"
              :key="child.index"
              :index="child.index"
            >
              {{ t(child.nameKey) }}
            </el-menu-item>
          </el-sub-menu>

          <el-menu-item v-else :index="item.index">
            <component :is="item.icon" :size="18" class="menu-icon" />
            <template #title>{{ t(item.nameKey) }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>

    <div class="conventional-menu__footer">
      <SettingsPanel v-show="!isCollapse" />
      <div class="collapse-btn" @click="toggleCollapse">
        <ChevronLeft v-if="!isCollapse" :size="18" />
        <ChevronRight v-else :size="18" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.conventional-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 200px;
  height: 100vh;
  background-color: var(--color-bg-card);
  border-right: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  z-index: 100;
  transition: width 0.3s;

  &.is-collapse {
    width: 64px;

    .conventional-menu__logo {
      justify-content: center;
      padding: 1.25rem 0;
    }
  }
}

.conventional-menu__logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: all 0.3s;

  .logo-icon {
    width: 2rem;
    height: 2rem;
    min-width: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #6c3ff5 0%, #5b2ee3 100%);
    border-radius: 0.5rem;
    font-size: 1rem;
  }

  .logo-text {
    font-weight: 600;
    font-size: 1rem;
    color: var(--color-text-primary);
    white-space: nowrap;
  }
}

.conventional-menu__scroll {
  flex: 1;
  overflow: hidden;

  :deep(.el-menu) {
    border-right: none;

    .el-menu-item,
    .el-sub-menu__title {
      height: 48px;
      line-height: 48px;
      margin: 4px 8px;
      border-radius: 8px;

      &:hover {
        background-color: var(--el-fill-color-light);
      }
    }

    .el-menu-item.is-active {
      background-color: rgba(108, 63, 245, 0.1);
    }

    .el-sub-menu {
      .el-menu {
        .el-menu-item {
          padding-left: 52px !important;
        }
      }
    }

    .menu-icon {
      margin-right: 8px;
      color: var(--el-text-color-secondary);
    }

    .el-menu-item.is-active .menu-icon {
      color: #6c3ff5;
    }
  }
}

.conventional-menu__footer {
  display: flex;
  align-items: center;
  //   justify-content: space-between;
  padding: 0.5rem;
  border-top: 1px solid var(--el-border-color-lighter);

  .collapse-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--el-text-color-secondary);
    flex-shrink: 0;

    &:hover {
      background-color: var(--el-fill-color-light);
      color: var(--color-text-primary);
    }
  }
}
</style>
