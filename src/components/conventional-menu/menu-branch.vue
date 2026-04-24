<script setup lang="ts">
import type { ConventionalMenuItem } from './index.type';

/******************************** 组件入参 ********************************/

const props = defineProps<{
  item: ConventionalMenuItem;
}>();
</script>

<template>
  <el-sub-menu
    v-if="props.item.children?.length"
    :index="`submenu-${props.item.menuId}`"
  >
    <template #title>
      <component
        :is="props.item.icon"
        v-if="props.item.icon"
        :size="18"
        class="menu-icon"
      />
      <span>{{ props.item.title }}</span>
    </template>

    <!-------------------------- 子级菜单 -------------------------->
    <MenuBranch
      v-for="child in props.item.children"
      :key="child.menuId"
      :item="child"
    />
  </el-sub-menu>

  <el-menu-item v-else :index="props.item.index">
    <component
      :is="props.item.icon"
      v-if="props.item.icon"
      :size="18"
      class="menu-icon"
    />
    <template #title>{{ props.item.title }}</template>
  </el-menu-item>
</template>
