<!--
TODO: 菜单组件 UI 优化
搜索框、
轮盘均分展示 每一块是一个三角形  外边打圈 中心小圈 大圆与小圆中间是菜单
-->

<!--
  WheelMenu - 半轮盘菜单组件
  ─────────────────────────────
  固定在页面最右侧，只展示半个轮盘。
  鼠标 hover 展示轮盘，滚动鼠标滚轮旋转轮盘。
  参数：menus (url / nameKey / icon)、size (轮盘直径 200-600px)
-->
<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

// ── Types ─────────────────────────────────────────────────────────────────
export interface WheelMenuItem {
  /** 菜单名称国际化键 (如 menu.home) */
  nameKey: string;
  /** 路由地址 */
  url: string;
  /** 图标 (emoji / 文字) */
  icon?: string;
}

// ── Props ─────────────────────────────────────────────────────────────────
const props = withDefaults(
  defineProps<{
    /** 菜单项列表 */
    menus?: WheelMenuItem[];
    /** 轮盘直径 (px)，范围 200–600 */
    size?: number;
  }>(),
  {
    size: 500,
    menus: () => [
      { nameKey: 'menu.home', url: '/', icon: '🏠' },
      { nameKey: 'menu.threeScene', url: '/three', icon: '🧊' },
      { nameKey: 'menu.components', url: '/components', icon: '📦' },
      { nameKey: 'menu.settings', url: '#', icon: '⚙️' },
      { nameKey: 'menu.user', url: '#', icon: '👤' },
      { nameKey: 'menu.data', url: '#', icon: '📊' },
      { nameKey: 'menu.messages', url: '#', icon: '💬' },
      { nameKey: 'menu.calendar', url: '#', icon: '📅' },
      { nameKey: 'menu.files', url: '#', icon: '📄' },
      { nameKey: 'menu.help', url: '#', icon: '❓' },
    ],
  }
);

// ── Router & i18n ─────────────────────────────────────────────────────────
const router = useRouter();
const route = useRoute();
const { t } = useI18n();

// ── State ─────────────────────────────────────────────────────────────────
const isVisible = ref(true);
const currentRotation = ref(0);
const targetRotation = ref(0);
let rafId: number | null = null;

// ── 配置常量 ──────────────────────────────────────────────────────────────
/** 每个菜单项之间的角度间距 */
const ITEM_GAP_DEG = 36;
/** 插值速度 (0–1)，越小越丝滑 */
const LERP_SPEED = 0.06;
/** 滚轮灵敏度，越小旋转越慢 */
const SCROLL_SENSITIVITY = 0.1;

// ── Computed ──────────────────────────────────────────────────────────────
const clampedSize = computed(() => Math.max(200, Math.min(600, props.size)));
const halfSize = computed(() => clampedSize.value / 2);
/** 菜单项在轮盘上的公转半径 */
const itemRadius = computed(() => clampedSize.value * 0.38);

// ── Animation Loop (requestAnimationFrame 丝滑插值) ──────────────────────
function animate() {
  const diff = targetRotation.value - currentRotation.value;
  if (Math.abs(diff) > 0.01) {
    currentRotation.value += diff * LERP_SPEED;
    rafId = requestAnimationFrame(animate);
  } else {
    currentRotation.value = targetRotation.value;
    rafId = null;
  }
}

function ensureAnimating() {
  if (rafId === null) {
    rafId = requestAnimationFrame(animate);
  }
}

// ── 计算每个菜单项的定位 & 透明度 ─────────────────────────────────────────
function getItemStyle(index: number) {
  const angle = index * ITEM_GAP_DEG + currentRotation.value;
  // 归一化到 0–360
  const norm = ((angle % 360) + 360) % 360;

  // 透明度：0° 处最亮，靠近 ±100° 渐隐
  let opacity = 0;
  if (norm <= 100) {
    opacity = 1 - (norm / 100) * 0.92;
  } else if (norm >= 260) {
    opacity = 1 - ((360 - norm) / 100) * 0.92;
  }
  opacity = Math.max(0, Math.min(1, opacity));

  // 缩放：越靠近边缘越小
  const scale = 0.6 + opacity * 0.4;

  return {
    transform: [
      `rotate(${angle}deg)`,
      `translateX(${-itemRadius.value}px)`,
      `rotate(${-angle}deg)`,
      `scale(${scale})`,
    ].join(' '),
    opacity,
    pointerEvents: (opacity > 0.1 ? 'auto' : 'none') as 'auto' | 'none',
  };
}

function isItemActive(item: WheelMenuItem): boolean {
  return route.path === item.url;
}

// ── Events ────────────────────────────────────────────────────────────────
function handleWheel(e: WheelEvent) {
  e.preventDefault();
  targetRotation.value += e.deltaY * SCROLL_SENSITIVITY;
  ensureAnimating();
}

function handleClick(item: WheelMenuItem) {
  if (item.url && item.url !== '#') {
    router.push(item.url);
  }
}

function show() {
  isVisible.value = true;
}

function hide() {
  isVisible.value = false;
}

function goToCurrent() {
  const currentIndex = props.menus.findIndex((item) => isItemActive(item));
  if (currentIndex === -1) return;

  targetRotation.value = -currentIndex * ITEM_GAP_DEG;
  ensureAnimating();
}

// ── Cleanup ───────────────────────────────────────────────────────────────
onBeforeUnmount(() => {
  if (rafId !== null) cancelAnimationFrame(rafId);
});
</script>

<template>
  <div class="wheel-menu" @mouseleave="hide">
    <!-- ── 触发手柄 (始终可见) ──────────────────────────── -->
    <div class="wheel-menu__trigger" @mouseenter="show">
      <span class="wheel-menu__trigger-line" />
      <span class="wheel-menu__trigger-line" />
      <span class="wheel-menu__trigger-line" />
    </div>

    <!-- ── 半轮盘主体 ─────────────────────────────────── -->
    <div
      class="wheel-menu__body"
      :class="{ 'is-visible': isVisible }"
      :style="{ width: `${halfSize}px`, height: `${clampedSize}px` }"
      @wheel.prevent="handleWheel"
    >
      <!-- 背景弧形 -->
      <div
        class="wheel-menu__arc"
        :style="{ width: `${clampedSize}px`, height: `${clampedSize}px` }"
      />

      <!-- 菜单项原点 (位于 body 右边中心 = 轮盘圆心) -->
      <div class="wheel-menu__origin">
        <div
          v-for="(item, index) in menus"
          :key="index"
          class="wheel-menu__item"
          :class="{ 'is-active': isItemActive(item) }"
          :style="getItemStyle(index)"
          @click="handleClick(item)"
        >
          <span class="wheel-menu__item-icon">{{ item.icon }}</span>
          <span class="wheel-menu__item-name">{{ t(item.nameKey) }}</span>
        </div>
      </div>

      <!-- 中心点 - 点击回到当前 -->
      <div
        class="wheel-menu__center"
        @click="goToCurrent"
        :title="t('menu.backToCurrent')"
      >
        <span class="wheel-menu__center-icon">⌂</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ================================================================
   WheelMenu — 半轮盘导航
   ================================================================ */

.wheel-menu {
  position: fixed;
  right: 0;
  top: 20%;
  transform: translateY(-50%);
  z-index: 9999;
}

/* ── Trigger Tab ───────────────────────────────────────────────── */
.wheel-menu__trigger {
  width: 30px;
  height: 80px;
  background: linear-gradient(
    160deg,
    rgba(64, 158, 255, 0.92),
    rgba(100, 120, 255, 0.88)
  );
  border-radius: 12px 0 0 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  cursor: pointer;
  box-shadow: -2px 0 16px rgba(64, 158, 255, 0.35);
  transition:
    width 0.3s ease,
    box-shadow 0.3s ease;

  .wheel-menu:hover & {
    width: 34px;
    box-shadow: -4px 0 24px rgba(64, 158, 255, 0.55);
  }
}

.wheel-menu__trigger-line {
  display: block;
  width: 14px;
  height: 2px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 2px;
  transition: width 0.3s ease;

  &:nth-child(2) {
    width: 10px;
  }
}

/* ── Wheel Body ────────────────────────────────────────────────── */
.wheel-menu__body {
  position: absolute;
  right: 0px;
  top: 50%;
  transform: translateY(-50%);
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.45s ease;

  &.is-visible {
    opacity: 1;
    pointer-events: auto;
  }
}

/* ── Background Arc ────────────────────────────────────────────── */
.wheel-menu__arc {
  position: absolute;
  left: 0;
  top: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle at 100% 50%,
    rgba(12, 16, 32, 0.94) 0%,
    rgba(18, 22, 42, 0.9) 35%,
    rgba(22, 28, 50, 0.84) 60%,
    rgba(28, 34, 58, 0.65) 85%,
    transparent 100%
  );
  backdrop-filter: blur(20px);
  border: 1px solid rgba(100, 160, 255, 0.12);
  box-shadow:
    inset 0 0 80px rgba(64, 158, 255, 0.04),
    -6px 0 32px rgba(0, 0, 0, 0.35);
}

/* ── Origin Point (wheel center) ───────────────────────────────── */
.wheel-menu__origin {
  position: absolute;
  right: 0;
  top: 50%;
}

/* ── Center Dot ────────────────────────────────────────────────── */
.wheel-menu__center {
  position: absolute;
  right: 0px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    rgba(64, 158, 255, 0.9),
    rgba(100, 120, 255, 0.85)
  );
  box-shadow:
    0 0 16px rgba(64, 158, 255, 0.5),
    inset 0 1px 2px rgba(255, 255, 255, 0.3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-50%) scale(1.15);
    box-shadow:
      0 0 24px rgba(64, 158, 255, 0.7),
      inset 0 1px 2px rgba(255, 255, 255, 0.4);
  }

  &:active {
    transform: translateY(-50%) scale(0.95);
  }
}

.wheel-menu__center-icon {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* ── Menu Item ─────────────────────────────────────────────────── */
.wheel-menu__item {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 18px 8px 12px;
  border-radius: 14px;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  will-change: transform, opacity;
  transition:
    background 0.25s ease,
    box-shadow 0.25s ease;

  &:hover {
    background: rgba(64, 158, 255, 0.22);
    box-shadow: 0 0 20px rgba(64, 158, 255, 0.18);
  }

  &.is-active {
    background: rgba(64, 158, 255, 0.28);
    box-shadow:
      0 0 24px rgba(64, 158, 255, 0.22),
      inset 0 0 8px rgba(64, 158, 255, 0.08);

    .wheel-menu__item-name {
      color: #409eff;
    }

    .wheel-menu__item-icon {
      transform: scale(1.15);
    }
  }
}

.wheel-menu__item-icon {
  font-size: 22px;
  line-height: 1;
  flex-shrink: 0;
  transition: transform 0.25s ease;
}

.wheel-menu__item-name {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.88);
  letter-spacing: 0.5px;
  transition: color 0.25s ease;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}
</style>
