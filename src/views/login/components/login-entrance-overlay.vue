<template>
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
      <div class="login-entrance-overlay__bg-grid" />
      <div
        class="login-entrance-overlay__blur login-entrance-overlay__blur--one"
      />
      <div
        class="login-entrance-overlay__blur login-entrance-overlay__blur--two"
      />

      <div class="login-entrance-overlay__logo">
        <slot name="logo" />
      </div>

      <div
        :ref="bindSupportGroupRef"
        class="login-entrance-overlay__support-group"
      >
        <slot name="support-characters" />

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
      </div>

      <div :ref="bindFormRevealRef" class="login-entrance-overlay__form-ghost">
        <slot name="form-ghost" />
      </div>
    </div>
  </div>
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
  pointer-events: auto;
}

.login-entrance-overlay__curtain {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #6c3ff5 0%, #5b2ee3 50%, #4a1ed1 100%);
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
  top: 3rem;
  left: 3rem;
  z-index: 2;
}

.login-entrance-overlay__support-group {
  position: absolute;
  left: 0;
  top: 0;
  --black-puller-left: 15rem;
  --yellow-puller-left: 19.375rem;
  --black-line-width: 7rem;
  --yellow-line-width: 6.9rem;
  z-index: 2;
}

.login-entrance-overlay__puller {
  position: absolute;
  bottom: 0;
  z-index: 3;
}

.login-entrance-overlay__puller--left {
  left: var(--black-puller-left);
}

.login-entrance-overlay__puller--right {
  left: var(--yellow-puller-left);
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

.login-entrance-overlay__bg-grid {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(
    rgba(255, 255, 255, 0.05) 1px,
    transparent 1px
  );
  background-size: 20px 20px;
  pointer-events: none;
}

.login-entrance-overlay__blur {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.login-entrance-overlay__blur--one {
  top: 25%;
  right: 25%;
  width: 16rem;
  height: 16rem;
  background: rgba(255, 255, 255, 0.1);
  filter: blur(64px);
}

.login-entrance-overlay__blur--two {
  bottom: 25%;
  left: 25%;
  width: 24rem;
  height: 24rem;
  background: rgba(255, 255, 255, 0.05);
  filter: blur(96px);
}

.login-entrance-overlay__form-ghost {
  position: absolute;
  top: 50%;
  right: clamp(2rem, 7vw, 5rem);
  width: min(32rem, 42vw);
  min-height: min(36rem, 74vh);
  transform: translateY(-50%);
  padding: 0;
  border-radius: 0;
  background: transparent;
  border: none;
  box-shadow: none;
  backdrop-filter: none;
  z-index: 1;
  pointer-events: none;
}

.is-dark .login-entrance-overlay__curtain {
  background: linear-gradient(135deg, #1a1040 0%, #140a35 50%, #0d0624 100%);
}
</style>
