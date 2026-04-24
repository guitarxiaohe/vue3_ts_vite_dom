<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import SettingsPanel from '@/components/settings-panel/index.vue';
import {
  fetchRouterTree,
  ROUTER_TREE_QUERY_KEY,
} from '@/api/modules/menu';
import type { SysRouter } from '@/types/menu';
import { resolveMenuIcon } from '@/features/entities/menu/form/menu-icons';
import type { ConventionalMenuItem } from './index.type';
import MenuBranch from './menu-branch.vue';

/******************************** 基础状态 ********************************/

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const isCollapse = ref<boolean>(false);

const {
  data: menuTreeData,
  isFetching: menuLoading,
  error: menuError,
} = useQuery({
  queryKey: ROUTER_TREE_QUERY_KEY,
  queryFn: fetchRouterTree,
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  retry: 0,
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchOnWindowFocus: false,
});

const defaultActive = computed<string>(() => route.path);

const menuItems = computed<ConventionalMenuItem[]>(() => {
  return buildMenuItems(menuTreeData.value ?? []);
});

/******************************** 交互方法 ********************************/

// 切换菜单收起状态
function toggleCollapse(): void {
  isCollapse.value = !isCollapse.value;
}

// 菜单点击跳转
function handleSelect(index: string): void {
  if (/^https?:\/\//.test(index)) {
    window.open(index, '_blank', 'noopener,noreferrer');
    return;
  }

  if (!index.startsWith('/')) {
    return;
  }

  router.push(index);
}

/******************************** 菜单映射 ********************************/

// 解析菜单展示名称
function resolveMenuTitle(routeItem: SysRouter): string {
  return (
    routeItem.meta?.title ||
    routeItem.parentName ||
    routeItem.name ||
    ''
  );
}

// 规范化菜单路径
function normalizeMenuIndex(routeItem: SysRouter): string {
  const link = String(routeItem.meta?.link ?? '').trim();
  const path = String(routeItem.path ?? '').trim();

  if (link) {
    return link;
  }

  if (!path) {
    return `menu-${routeItem.menuId ?? routeItem.name ?? Date.now()}`;
  }

  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.replace(/^\/+/, '');

  if (!normalizedPath) {
    return `menu-${routeItem.menuId ?? routeItem.name ?? Date.now()}`;
  }

  if (normalizedPath.startsWith('multiview/')) {
    return `/${normalizedPath}`;
  }

  return `/multiview/${normalizedPath}`;
}

// 构建侧边栏菜单树
function buildMenuItems(menus: SysRouter[]): ConventionalMenuItem[] {
  return menus.flatMap((menu) => {
    if (menu.hidden || menu.menuType === 'F') {
      return [];
    }

    const currentIndex = normalizeMenuIndex(menu);
    const children = buildMenuItems(menu.children ?? []);
    const title = resolveMenuTitle(menu);

    if (!title && children.length) {
      return children;
    }

    const menuItem: ConventionalMenuItem = {
      menuId: Number(menu.menuId ?? 0),
      index: currentIndex,
      title,
      icon: menu.meta?.icon ? resolveMenuIcon(menu.meta.icon) : null,
      children,
    };

    if (!menuItem.title) {
      return children;
    }

    return [menuItem];
  });
}
</script>

<template>
  <el-aside :class="{ 'is-collapse': isCollapse }">
    <div class="conventional-menu" :class="{ 'is-collapse': isCollapse }">
      <!-------------------------- 品牌区 -------------------------->
      <div class="conventional-menu__logo">
        <span class="logo-icon">✨</span>
        <span v-show="!isCollapse" class="logo-text">YourBrand</span>
      </div>

      <!-------------------------- 菜单区 -------------------------->
      <el-scrollbar v-loading="menuLoading" class="conventional-menu__scroll">
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
          <MenuBranch
            v-for="item in menuItems"
            :key="item.menuId"
            :item="item"
          />
        </el-menu>

        <el-empty
          v-if="!menuLoading && !menuItems.length"
          :description="menuError ? t('common.failed') : t('common.noData')"
        />
      </el-scrollbar>

      <!-------------------------- 底部区 -------------------------->
      <div class="conventional-menu__footer">
        <SettingsPanel v-show="!isCollapse" />
        <div class="collapse-btn" @click="toggleCollapse">
          <ChevronLeft v-if="!isCollapse" :size="18" />
          <ChevronRight v-else :size="18" />
        </div>
      </div>
    </div>
  </el-aside>
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
