<template>
  <transition name="login-entrance-overlay">
    <div
      v-if="visible"
      :ref="bindOverlayRef"
      class="login-entrance-overlay"
      aria-hidden="true"
    >
      <!-------------------------- 幕布层 -------------------------->
      <div :ref="bindCurtainRef" class="login-entrance-overlay__curtain">
        <div class="login-entrance-overlay__edge-highlight" />
      </div>

      <!-------------------------- 动画场景层 -------------------------->
      <div class="login-entrance-overlay__scene">
        <div class="login-entrance-overlay__logo">
          <slot name="logo" />
        </div>

        <div
          :ref="bindSupportGroupRef"
          class="login-entrance-overlay__support-group"
        >
          <slot name="support-characters" />
        </div>

        <div
          :ref="bindBlackPullerRef"
          class="login-entrance-overlay__puller login-entrance-overlay__puller--left"
        >
          <slot name="black-puller" />
        </div>

        <div
          :ref="bindYellowPullerRef"
          class="login-entrance-overlay__puller login-entrance-overlay__puller--right"
        >
          <slot name="yellow-puller" />
        </div>

        <div
          :ref="bindFormRevealRef"
          class="login-entrance-overlay__form-ghost"
        >
          <slot name="form-ghost" />
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue';

/******************************** 组件入参 ********************************/
defineProps<{
  visible: boolean;
}>();

/******************************** DOM 引用透传 ********************************/
const overlayRef = defineModel<HTMLElement | null>('overlayRef', {
  default: null,
});
const curtainRef = defineModel<HTMLElement | null>('curtainRef', {
  default: null,
});
const formRevealRef = defineModel<HTMLElement | null>('formRevealRef', {
  default: null,
});
const blackPullerRef = defineModel<HTMLElement | null>('blackPullerRef', {
  default: null,
});
const yellowPullerRef = defineModel<HTMLElement | null>('yellowPullerRef', {
  default: null,
});
const supportGroupRef = defineModel<HTMLElement | null>('supportGroupRef', {
  default: null,
});

/******************************** DOM 绑定 ********************************/
type OverlayBindableRef = Element | ComponentPublicInstance | null;

const bindOverlayRef = (element: OverlayBindableRef) => {
  overlayRef.value = element as HTMLElement | null;
};
const bindCurtainRef = (element: OverlayBindableRef) => {
  curtainRef.value = element as HTMLElement | null;
};
const bindFormRevealRef = (element: OverlayBindableRef) => {
  formRevealRef.value = element as HTMLElement | null;
};
const bindBlackPullerRef = (element: OverlayBindableRef) => {
  blackPullerRef.value = element as HTMLElement | null;
};
const bindYellowPullerRef = (element: OverlayBindableRef) => {
  yellowPullerRef.value = element as HTMLElement | null;
};
const bindSupportGroupRef = (element: OverlayBindableRef) => {
  supportGroupRef.value = element as HTMLElement | null;
};
</script>

<style scoped lang="scss">
.login-entrance-overlay {
  position: absolute;
  inset: 0;
  z-index: 12;
  overflow: hidden;
  pointer-events: none;
}

.login-entrance-overlay__curtain {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      circle at 20% 20%,
      color-mix(in srgb, var(--color-primary) 18%, transparent) 0%,
      transparent 52%
    ),
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--color-bg-card) 88%, var(--color-primary) 12%) 0%,
      color-mix(in srgb, var(--color-bg-page) 74%, var(--color-primary) 26%) 100%
    );
  border-inline-end: 1px solid
    color-mix(in srgb, var(--color-border) 70%, transparent);
  box-shadow: var(--shadow-lg);
}

.login-entrance-overlay__scene {
  position: absolute;
  inset: 0;
}

.login-entrance-overlay__logo {
  position: absolute;
  top: clamp(1.5rem, 4vw, 3rem);
  left: clamp(1.5rem, 4vw, 3rem);
  z-index: 2;
}

.login-entrance-overlay__support-group {
  position: absolute;
  inset-inline: 0;
  bottom: clamp(7rem, 14vw, 10rem);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 2;
}

.login-entrance-overlay__puller {
  position: absolute;
  bottom: clamp(5rem, 12vw, 8.5rem);
  z-index: 3;
}

.login-entrance-overlay__puller--left {
  left: clamp(8%, 14vw, 16%);
}

.login-entrance-overlay__puller--right {
  right: clamp(8%, 14vw, 16%);
}

.login-entrance-overlay__edge-highlight {
  position: absolute;
  top: 8%;
  right: 0;
  width: 1.5rem;
  height: 84%;
  background: linear-gradient(
    180deg,
    transparent 0%,
    color-mix(in srgb, var(--color-text-primary) 20%, transparent) 18%,
    color-mix(in srgb, var(--color-text-primary) 42%, transparent) 50%,
    color-mix(in srgb, var(--color-text-primary) 20%, transparent) 82%,
    transparent 100%
  );
  filter: blur(8px);
  opacity: 0.85;
}

.login-entrance-overlay__form-ghost {
  position: absolute;
  top: 50%;
  right: clamp(2rem, 7vw, 5rem);
  width: min(32rem, 42vw);
  min-height: min(36rem, 74vh);
  transform: translateY(-50%);
  padding: clamp(1rem, 2vw, 1.5rem);
  border-radius: var(--radius-xl);
  background: color-mix(in srgb, var(--color-bg-card) 72%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-border) 78%, transparent);
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(16px);
  z-index: 1;
}

.login-entrance-overlay-enter-active,
.login-entrance-overlay-leave-active {
  transition:
    opacity var(--transition-normal),
    visibility var(--transition-normal);
}

.login-entrance-overlay-enter-from,
.login-entrance-overlay-leave-to {
  opacity: 0;
  visibility: hidden;
}
</style>
