# Login Entrance Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a one-time GSAP-powered login entrance animation where the black and yellow characters pull the right-side foreground layer from the far right to a 50/50 split, then bounce back to their normal pose while preserving the existing login interactions.

**Architecture:** Keep the existing login page as the stable final state and add a reusable overlay component on top of it for the entrance sequence. Drive the sequence from a focused composable backed by small pure utility helpers so timing, clip-path targets, and motion gating are testable before wiring them into the Vue view.

**Tech Stack:** Vue 3 `<script setup>`, TypeScript, SCSS, GSAP, Vitest, vue-i18n, existing login character components

---

## File Map

- Modify: `package.json`
  - Add `gsap`, `vitest`, and `jsdom` plus `test` / `test:run` scripts.
- Create: `vitest.config.ts`
  - Provide alias resolution for `@`, Vue plugin support, and `jsdom` test environment.
- Create: `src/views/login/composables/use-login-entrance.utils.ts`
  - Hold pure animation helpers: motion gating, desktop/mobile clip-path targets, and named timeline timings.
- Create: `src/views/login/composables/use-login-entrance.utils.vitest.test.ts`
  - Use the Vitest naming pattern `src/**/*.vitest.test.ts` so the repo's existing `node:test` files stay out of the Vitest run.
  - Cover the pure helper behavior first.
- Create: `src/views/login/composables/use-login-entrance.ts`
  - Build and clean up the GSAP timeline, expose `overlayVisible`, `interactionLocked`, and refs for the overlay and form targets.
- Create: `src/views/login/components/login-entrance-overlay.vue`
  - Render the full-screen foreground layer, the pull edge, and the two puller pose states.
- Modify: `src/views/login/index.vue`
  - Integrate the overlay, pause character interactions while the entrance plays, and resume existing blink / eye / typing logic after the bounce-back completes.

## Task 1: Prepare GSAP And Test Tooling

**Files:**

- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Add the dependency and script changes**

Update `package.json` with these exact blocks:

```json
{
  "scripts": {
    "dev": "vite",
    "test": "vitest",
    "test:run": "vitest run",
    "type-check": "vue-tsc -b --pretty false",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "pre-commit:check": "pnpm type-check && pnpm format:check",
    "build": "vue-tsc -b && vite build",
    "build:prod": "vue-tsc -b && vite build --mode production",
    "preview": "vite preview",
    "prepare": "husky"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "element-plus": "^2.5.0",
    "gsap": "^3.12.7",
    "lucide-vue-next": "^1.0.0",
    "pinia": "^2.1.7"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.5",
    "@vue/tsconfig": "^0.9.0",
    "jsdom": "^26.1.0",
    "typescript": "~5.9.3",
    "vite": "^8.0.1",
    "vitest": "^4.1.8",
    "vue-tsc": "^3.2.5"
  }
}
```

- [ ] **Step 2: Add the Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.vitest.test.ts'],
    passWithNoTests: true,
  },
});
```

- [ ] **Step 3: Install and smoke-test the runner**

Run: `pnpm install`

Expected: install completes and `gsap`, `vitest`, and `jsdom` are added to the lockfile.

Run: `pnpm test:run`

Expected: the command starts Vitest successfully; it may fail on this step with either `No test files found` or existing unresolved tests, but it must not fail with `command not found`.

- [ ] **Step 4: Commit the tooling setup**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts
git commit -m "build: add login animation test tooling"
```

## Task 2: Test And Build The Pure Entrance Motion Helpers

**Files:**

- Create: `src/views/login/composables/use-login-entrance.utils.ts`
- Create: `src/views/login/composables/use-login-entrance.utils.vitest.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/views/login/composables/use-login-entrance.utils.vitest.test.ts`:

```ts
import {
  getEntranceClipPathTargets,
  getEntranceTimings,
  shouldPlayEntranceAnimation,
} from './use-login-entrance.utils';

test('shouldPlayEntranceAnimation only allows first desktop playback when motion is enabled', () => {
  expect(
    shouldPlayEntranceAnimation({
      hasPlayed: false,
      isDesktop: true,
      prefersReducedMotion: false,
    })
  ).toBe(true);

  expect(
    shouldPlayEntranceAnimation({
      hasPlayed: true,
      isDesktop: true,
      prefersReducedMotion: false,
    })
  ).toBe(false);

  expect(
    shouldPlayEntranceAnimation({
      hasPlayed: false,
      isDesktop: false,
      prefersReducedMotion: false,
    })
  ).toBe(false);

  expect(
    shouldPlayEntranceAnimation({
      hasPlayed: false,
      isDesktop: true,
      prefersReducedMotion: true,
    })
  ).toBe(false);
});

test('getEntranceClipPathTargets returns a full-screen start state and a 50/50 desktop end state', () => {
  expect(getEntranceClipPathTargets(true)).toEqual({
    from: 'inset(0 0% 0 0 round 0px)',
    to: 'inset(0 50% 0 0 round 0px)',
  });
});

test('getEntranceClipPathTargets returns the mobile fallback target', () => {
  expect(getEntranceClipPathTargets(false)).toEqual({
    from: 'inset(0 0% 0 0 round 0px)',
    to: 'inset(0 0 58% 0 round 0px)',
  });
});

test('getEntranceTimings keeps the pull, reveal, and bounce phases aligned with the approved spec', () => {
  expect(getEntranceTimings()).toEqual({
    establish: 0.35,
    pullPrep: 0.25,
    curtainPull: 0.5,
    formRevealDelay: 0.2,
    formReveal: 0.45,
    bounceBack: 0.35,
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/views/login/composables/use-login-entrance.utils.vitest.test.ts`

Expected: FAIL with module resolution errors because `use-login-entrance.utils.ts` does not exist yet.

- [ ] **Step 3: Write the minimal helper implementation**

Create `src/views/login/composables/use-login-entrance.utils.ts`:

```ts
export interface EntranceAnimationContext {
  hasPlayed: boolean;
  isDesktop: boolean;
  prefersReducedMotion: boolean;
}

export interface EntranceClipPathTargets {
  from: string;
  to: string;
}

export interface EntranceTimings {
  establish: number;
  pullPrep: number;
  curtainPull: number;
  formRevealDelay: number;
  formReveal: number;
  bounceBack: number;
}

export function shouldPlayEntranceAnimation(
  context: EntranceAnimationContext
): boolean {
  return (
    !context.hasPlayed && context.isDesktop && !context.prefersReducedMotion
  );
}

export function getEntranceClipPathTargets(
  isDesktop: boolean
): EntranceClipPathTargets {
  return isDesktop
    ? {
        from: 'inset(0 0% 0 0 round 0px)',
        to: 'inset(0 50% 0 0 round 0px)',
      }
    : {
        from: 'inset(0 0% 0 0 round 0px)',
        to: 'inset(0 0 58% 0 round 0px)',
      };
}

export function getEntranceTimings(): EntranceTimings {
  return {
    establish: 0.35,
    pullPrep: 0.25,
    curtainPull: 0.5,
    formRevealDelay: 0.2,
    formReveal: 0.45,
    bounceBack: 0.35,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test:run src/views/login/composables/use-login-entrance.utils.vitest.test.ts`

Expected: PASS with 4 passing tests.

- [ ] **Step 5: Commit the helper layer**

```bash
git add src/views/login/composables/use-login-entrance.utils.ts src/views/login/composables/use-login-entrance.utils.vitest.test.ts
git commit -m "test: cover login entrance motion helpers"
```

## Task 3: Add The Overlay Component And GSAP Composable

**Files:**

- Create: `src/views/login/components/login-entrance-overlay.vue`
- Create: `src/views/login/composables/use-login-entrance.ts`
- Modify: `src/views/login/composables/use-login-entrance.utils.ts`
- Modify: `src/views/login/composables/use-login-entrance.utils.vitest.test.ts`

- [ ] **Step 1: Extend the failing tests for pose metadata**

Append these tests to `src/views/login/composables/use-login-entrance.utils.vitest.test.ts`:

```ts
import { getPullerPoseMap } from './use-login-entrance.utils';

test('getPullerPoseMap marks black and yellow as the active pullers', () => {
  expect(getPullerPoseMap()).toEqual({
    black: 'puller',
    yellow: 'puller',
    orange: 'support',
    purple: 'support',
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:run src/views/login/composables/use-login-entrance.utils.vitest.test.ts`

Expected: FAIL with `getPullerPoseMap is not exported`.

- [ ] **Step 3: Add the pose helper and build the runtime composable**

Update `src/views/login/composables/use-login-entrance.utils.ts` with:

```ts
export interface PullerPoseMap {
  black: 'puller';
  yellow: 'puller';
  orange: 'support';
  purple: 'support';
}

export function getPullerPoseMap(): PullerPoseMap {
  return {
    black: 'puller',
    yellow: 'puller',
    orange: 'support',
    purple: 'support',
  };
}
```

Create `src/views/login/composables/use-login-entrance.ts`:

```ts
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { gsap } from 'gsap';
import {
  getEntranceClipPathTargets,
  getEntranceTimings,
  shouldPlayEntranceAnimation,
} from './use-login-entrance.utils';

export function useLoginEntrance() {
  const overlayRef = ref<HTMLElement | null>(null);
  const curtainRef = ref<HTMLElement | null>(null);
  const formRevealRef = ref<HTMLElement | null>(null);
  const blackPullerRef = ref<HTMLElement | null>(null);
  const yellowPullerRef = ref<HTMLElement | null>(null);
  const supportGroupRef = ref<HTMLElement | null>(null);
  const overlayVisible = ref(true);
  const interactionLocked = ref(true);
  const hasPlayed = ref(false);
  const isDesktop = ref(window.innerWidth > 1024);
  const prefersReducedMotion = ref(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  let timeline: gsap.core.Timeline | null = null;
  const handleResize = () => {
    isDesktop.value = window.innerWidth > 1024;
  };

  const shouldAnimate = computed(() =>
    shouldPlayEntranceAnimation({
      hasPlayed: hasPlayed.value,
      isDesktop: isDesktop.value,
      prefersReducedMotion: prefersReducedMotion.value,
    })
  );

  const cleanupTimeline = () => {
    timeline?.kill();
    timeline = null;
  };

  const completeImmediately = () => {
    interactionLocked.value = false;
    overlayVisible.value = false;
    hasPlayed.value = true;
  };

  const play = () => {
    if (!curtainRef.value || !formRevealRef.value) {
      completeImmediately();
      return;
    }

    const timings = getEntranceTimings();
    const clipPath = getEntranceClipPathTargets(isDesktop.value);

    gsap.set(curtainRef.value, { clipPath: clipPath.from });
    gsap.set(formRevealRef.value, { autoAlpha: 0, y: 24 });
    gsap.set([blackPullerRef.value, yellowPullerRef.value], {
      transformOrigin: '50% 100%',
    });

    timeline = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: () => {
        interactionLocked.value = false;
        overlayVisible.value = false;
        hasPlayed.value = true;
      },
    });

    timeline
      .to({}, { duration: timings.establish })
      .to(
        [blackPullerRef.value, yellowPullerRef.value],
        { x: -18, rotation: -10, duration: timings.pullPrep },
        'prep'
      )
      .to(
        supportGroupRef.value,
        { x: -6, duration: timings.pullPrep * 0.8 },
        'prep+=0.06'
      )
      .to(
        curtainRef.value,
        { clipPath: clipPath.to, duration: timings.curtainPull },
        'pull'
      )
      .to(
        formRevealRef.value,
        {
          autoAlpha: 1,
          y: 0,
          duration: timings.formReveal,
          ease: 'power2.out',
        },
        `pull+=${timings.formRevealDelay}`
      )
      .to(
        [blackPullerRef.value, yellowPullerRef.value],
        {
          x: 0,
          rotation: 0,
          y: -10,
          duration: timings.bounceBack,
          ease: 'back.out(1.4)',
        },
        'release'
      )
      .to(
        [blackPullerRef.value, yellowPullerRef.value],
        { y: 0, duration: timings.bounceBack * 0.5, ease: 'power2.out' },
        'release+=0.12'
      );
  };

  onMounted(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    if (!shouldAnimate.value) {
      completeImmediately();
      return;
    }
    play();
  });

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    cleanupTimeline();
  });

  return {
    blackPullerRef,
    curtainRef,
    formRevealRef,
    interactionLocked,
    overlayRef,
    overlayVisible,
    supportGroupRef,
    yellowPullerRef,
  };
}
```

Create `src/views/login/components/login-entrance-overlay.vue`:

```vue
<template>
  <div
    v-show="visible"
    ref="overlayRef"
    class="login-entrance-overlay"
    aria-hidden="true"
  >
    <div ref="curtainRef" class="login-entrance-overlay__curtain">
      <div class="login-entrance-overlay__branding">
        <div class="login-entrance-overlay__logo">
          <slot name="logo" />
        </div>
      </div>

      <div class="login-entrance-overlay__scene">
        <div ref="supportGroupRef" class="login-entrance-overlay__support">
          <slot name="support-characters" />
        </div>

        <div
          ref="blackPullerRef"
          class="login-entrance-overlay__puller login-entrance-overlay__puller--black"
        >
          <slot name="black-puller" />
        </div>

        <div
          ref="yellowPullerRef"
          class="login-entrance-overlay__puller login-entrance-overlay__puller--yellow"
        >
          <slot name="yellow-puller" />
        </div>

        <div class="login-entrance-overlay__edge" />
      </div>
    </div>

    <div ref="formRevealRef" class="login-entrance-overlay__form-ghost">
      <slot name="form-ghost" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean;
}>();

const overlayRef = defineModel<HTMLElement | null>('overlayRef');
const curtainRef = defineModel<HTMLElement | null>('curtainRef');
const formRevealRef = defineModel<HTMLElement | null>('formRevealRef');
const blackPullerRef = defineModel<HTMLElement | null>('blackPullerRef');
const yellowPullerRef = defineModel<HTMLElement | null>('yellowPullerRef');
const supportGroupRef = defineModel<HTMLElement | null>('supportGroupRef');
</script>

<style scoped lang="scss">
.login-entrance-overlay {
  position: absolute;
  inset: 0;
  z-index: 30;
  pointer-events: none;
}

.login-entrance-overlay__curtain {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #6c3ff5 0%, #5b2ee3 50%, #4a1ed1 100%);
}

.login-entrance-overlay__scene {
  position: relative;
  width: 100%;
  height: 100%;
}

.login-entrance-overlay__puller,
.login-entrance-overlay__support {
  position: absolute;
  bottom: 0;
}

.login-entrance-overlay__edge {
  position: absolute;
  top: 0;
  right: 0;
  width: 56px;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.12) 100%
  );
}

.login-entrance-overlay__form-ghost {
  position: absolute;
  inset: 0 0 0 auto;
  width: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test:run src/views/login/composables/use-login-entrance.utils.vitest.test.ts`

Expected: PASS with the new pose-map test included.

- [ ] **Step 5: Commit the overlay runtime layer**

```bash
git add src/views/login/components/login-entrance-overlay.vue src/views/login/composables/use-login-entrance.ts src/views/login/composables/use-login-entrance.utils.ts src/views/login/composables/use-login-entrance.utils.vitest.test.ts
git commit -m "feat: add login entrance overlay runtime"
```

## Task 4: Integrate The Entrance Sequence Into The Login Page

**Files:**

- Modify: `src/views/login/index.vue`
- Test: `src/views/login/composables/use-login-entrance.utils.vitest.test.ts`

- [ ] **Step 1: Write the failing behavior assertion by extending helper coverage**

Append this regression test to `src/views/login/composables/use-login-entrance.utils.vitest.test.ts`:

```ts
import { shouldPlayEntranceAnimation } from './use-login-entrance.utils';

test('shouldPlayEntranceAnimation keeps desktop-first behavior when the animation was already consumed', () => {
  expect(
    shouldPlayEntranceAnimation({
      hasPlayed: true,
      isDesktop: true,
      prefersReducedMotion: false,
    })
  ).toBe(false);
});
```

This test should already express the one-time playback contract before the page wiring is changed.

- [ ] **Step 2: Run the test to verify the current utility contract still passes before integration**

Run: `pnpm test:run src/views/login/composables/use-login-entrance.utils.vitest.test.ts`

Expected: PASS. This confirms the one-time playback rule is locked before editing the view.

- [ ] **Step 3: Wire the overlay and interaction lock into `src/views/login/index.vue`**

Add these imports near the top of `<script setup>`:

```ts
import { useLoginEntrance } from './composables/use-login-entrance';
import LoginEntranceOverlay from './components/login-entrance-overlay.vue';
```

Add these refs and computed gates after the existing login refs:

```ts
const {
  blackPullerRef,
  curtainRef,
  formRevealRef,
  interactionLocked,
  overlayRef,
  overlayVisible,
  supportGroupRef,
  yellowPullerRef,
} = useLoginEntrance();

const shouldFreezeCharacterInteraction = computed(
  () => interactionLocked.value
);
```

Gate the existing character transforms and peeking / looking watchers so they early-return while the entrance is locked:

```ts
const getCharacterTransform = (character: string) => {
  if (shouldFreezeCharacterInteraction.value) {
    if (character === 'black') return 'skewX(5deg)';
    if (character === 'yellow') return 'skewX(0deg)';
    if (character === 'purple') return 'skewX(0deg)';
    return 'skewX(0deg)';
  }

  // existing switch body stays here
};

watch(isTyping, (newVal) => {
  if (shouldFreezeCharacterInteraction.value) return;
  // existing watcher body stays here
});
```

Insert the overlay just inside `.login-container`:

```vue
<LoginEntranceOverlay
  v-model:overlay-ref="overlayRef"
  v-model:curtain-ref="curtainRef"
  v-model:form-reveal-ref="formRevealRef"
  v-model:black-puller-ref="blackPullerRef"
  v-model:yellow-puller-ref="yellowPullerRef"
  v-model:support-group-ref="supportGroupRef"
  :visible="overlayVisible"
>
  <template #logo>
    <div class="logo-area">
      <div class="logo-icon">
        <Sparkles :size="16" />
      </div>
      <span>YourBrand</span>
    </div>
  </template>

  <template #support-characters>
    <div class="characters-wrapper">
      <div class="character-purple" />
      <div class="character-orange" />
    </div>
  </template>

  <template #black-puller>
    <div class="character-black" />
  </template>

  <template #yellow-puller>
    <div class="character-yellow" />
  </template>

  <template #form-ghost>
    <div class="login-form-wrapper">
      <div class="form-header">
        <h1>{{ t('login.welcomeBack') }}</h1>
        <p>{{ t('login.enterDetails') }}</p>
      </div>
    </div>
  </template>
</LoginEntranceOverlay>
```

Add the container positioning needed for the overlay:

```scss
.login-container {
  position: relative;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
}
```

- [ ] **Step 4: Run verification**

Run: `pnpm test:run src/views/login/composables/use-login-entrance.utils.vitest.test.ts`

Expected: PASS.

Run: `pnpm type-check`

Expected: PASS.

Run: `pnpm dev`

Expected manual checks in the browser:

- first load shows the full-screen overlay
- black and yellow pull together from the far right
- the curtain stops at a 50/50 split
- the form fades in after the pull begins
- black and yellow bounce back to the normal pose
- mouse-follow and blink behavior resume after the overlay disappears

- [ ] **Step 5: Commit the page integration**

```bash
git add src/views/login/index.vue
git commit -m "feat: animate login entrance reveal"
```

## Task 5: Final Verification And Cleanup

**Files:**

- Modify: `src/views/login/index.vue` (only if the manual QA reveals timing or layout regressions)

- [ ] **Step 1: Re-run the focused checks**

Run:

```bash
pnpm test:run src/views/login/composables/use-login-entrance.utils.vitest.test.ts
pnpm type-check
pnpm format:check
```

Expected: all commands pass.

- [ ] **Step 2: Re-check the browser behavior on desktop and mobile widths**

Manual browser checklist:

- Desktop at `>1024px`: animation ends in a stable 50/50 layout.
- Mobile at `<=1024px`: page degrades to the existing stacked layout without broken overlay leftovers.
- Reduced motion: temporarily enable `prefers-reduced-motion: reduce`, reload, and confirm the page goes straight to final state.

- [ ] **Step 3: Commit any final timing polish**

```bash
git add src/views/login/index.vue src/views/login/components/login-entrance-overlay.vue src/views/login/composables/use-login-entrance.ts
git commit -m "fix: polish login entrance motion"
```

## Self-Review

- Spec coverage:
  - Full-screen foreground first: handled by Task 3 overlay component and Task 4 integration.
  - Pull from the far right to 50/50: covered by Task 2 clip-path helpers and Task 3 GSAP timeline.
  - Black + yellow pull together: covered by Task 3 pose helper and runtime timeline.
  - Bounce back to the original pose: covered by Task 3 timeline release phase and Task 4 manual verification.
  - Preserve current login interactions: covered by Task 4 interaction lock and resume checks.
  - Reduced-motion fallback: covered by Task 2 gating helper and Task 5 manual QA.
- Placeholder scan:
  - No `TODO`, `TBD`, or open-ended “handle this later” instructions remain.
- Type consistency:
  - Shared names stay aligned across tasks: `shouldPlayEntranceAnimation`, `getEntranceClipPathTargets`, `getEntranceTimings`, `getPullerPoseMap`, `useLoginEntrance`.
