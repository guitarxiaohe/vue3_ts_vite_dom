import gsap from 'gsap';
import { nextTick, onMounted, onUnmounted, ref, type Ref } from 'vue';

import {
  getEntranceClipPathTargets,
  getEntranceTimings,
  shouldPlayEntranceAnimation,
} from './use-login-entrance.utils';

const DESKTOP_MIN_WIDTH = 1024;

type MaybeElement = HTMLElement | null;

interface EntranceElementRefs {
  overlayRef: Ref<MaybeElement>;
  curtainRef: Ref<MaybeElement>;
  formRevealRef: Ref<MaybeElement>;
  blackPullerRef: Ref<MaybeElement>;
  yellowPullerRef: Ref<MaybeElement>;
  supportGroupRef: Ref<MaybeElement>;
}

function isDesktopViewport(): boolean {
  return window.innerWidth >= DESKTOP_MIN_WIDTH;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useLoginEntrance() {
  /******************************** DOM 引用 ********************************/
  const overlayRef = ref<MaybeElement>(null);
  const curtainRef = ref<MaybeElement>(null);
  const formRevealRef = ref<MaybeElement>(null);
  const blackPullerRef = ref<MaybeElement>(null);
  const yellowPullerRef = ref<MaybeElement>(null);
  const supportGroupRef = ref<MaybeElement>(null);

  /******************************** 状态与实例 ********************************/
  const overlayVisible = ref(true);
  const interactionLocked = ref(true);
  const hasPlayed = ref(false);

  let isDesktop = false;
  let timeline: gsap.core.Timeline | null = null;

  const elementRefs: EntranceElementRefs = {
    overlayRef,
    curtainRef,
    formRevealRef,
    blackPullerRef,
    yellowPullerRef,
    supportGroupRef,
  };

  // 统一跳过动画后的界面状态。
  const skipAnimation = () => {
    timeline?.kill();
    timeline = null;
    overlayVisible.value = false;
    interactionLocked.value = false;
  };

  // 校验节点后创建一次性时间线。
  const buildTimeline = () => {
    const {
      overlayRef: overlay,
      curtainRef: curtain,
      formRevealRef: formReveal,
      blackPullerRef: blackPuller,
      yellowPullerRef: yellowPuller,
      supportGroupRef: supportGroup,
    } = Object.fromEntries(
      Object.entries(elementRefs).map(([key, elementRef]) => [key, elementRef.value])
    ) as Record<keyof EntranceElementRefs, MaybeElement>;

    if (
      !overlay ||
      !curtain ||
      !formReveal ||
      !blackPuller ||
      !yellowPuller ||
      !supportGroup
    ) {
      skipAnimation();
      return;
    }

    const clipPathTargets = getEntranceClipPathTargets(isDesktop);
    const timings = getEntranceTimings();

    gsap.set(overlay, { autoAlpha: 1 });
    gsap.set(curtain, {
      clipPath: clipPathTargets.from,
      transformOrigin: 'left center',
      xPercent: 0,
    });
    gsap.set(formReveal, {
      autoAlpha: 0,
      y: 28,
      scale: 0.98,
      transformOrigin: 'center center',
    });
    gsap.set([blackPuller, yellowPuller], {
      x: 0,
      y: 0,
      rotation: 0,
      transformOrigin: 'center center',
    });
    gsap.set(supportGroup, {
      x: 0,
      y: 10,
      autoAlpha: 0,
      transformOrigin: 'center center',
    });

    timeline = gsap.timeline({
      defaults: {
        ease: 'power2.out',
      },
      onComplete: () => {
        hasPlayed.value = true;
        interactionLocked.value = false;
        overlayVisible.value = false;
      },
    });

    timeline
      .to(supportGroup, {
        autoAlpha: 1,
        y: 0,
        duration: timings.establish,
      })
      .to(
        [blackPuller, yellowPuller],
        {
          x: (index) => (index === 0 ? -18 : 18),
          y: -8,
          rotation: (index) => (index === 0 ? -8 : 8),
          duration: timings.pullPrep,
          ease: 'power1.inOut',
        },
        '<'
      )
      .to(
        curtain,
        {
          clipPath: clipPathTargets.to,
          duration: timings.curtainPull,
          ease: 'power3.inOut',
        },
        '<0.08'
      )
      .to(
        formReveal,
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: timings.formReveal,
        },
        `>-${timings.formRevealDelay}`
      )
      .to(
        [blackPuller, yellowPuller],
        {
          x: 0,
          y: 0,
          rotation: 0,
          duration: timings.bounceBack,
          ease: 'back.out(1.6)',
        },
        '<'
      )
      .to(
        supportGroup,
        {
          y: 0,
          duration: timings.bounceBack,
        },
        '<'
      )
      .set(overlay, {
        pointerEvents: 'none',
      });
  };

  // 只在桌面且未播放场景下启动动画。
  const playEntrance = async () => {
    isDesktop = isDesktopViewport();

    if (
      !shouldPlayEntranceAnimation({
        isDesktop,
        hasPlayed: hasPlayed.value,
        prefersReducedMotion: prefersReducedMotion(),
      })
    ) {
      skipAnimation();
      return;
    }

    overlayVisible.value = true;
    interactionLocked.value = true;
    await nextTick();
    buildTimeline();
  };

  // 仅维护桌面判断，避免移动端后续误触发动画。
  const handleResize = () => {
    isDesktop = isDesktopViewport();
  };

  onMounted(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    void playEntrance();
  });

  onUnmounted(() => {
    timeline?.kill();
    timeline = null;
    window.removeEventListener('resize', handleResize);
  });

  return {
    overlayRef,
    curtainRef,
    formRevealRef,
    blackPullerRef,
    yellowPullerRef,
    supportGroupRef,
    overlayVisible,
    interactionLocked,
    hasPlayed,
  };
}
