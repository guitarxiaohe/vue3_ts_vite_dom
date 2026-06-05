import gsap from 'gsap';
import { nextTick, onMounted, onUnmounted, ref, type Ref } from 'vue';

import {
  getEntranceClipPathTargets,
  getEntranceTimings,
  getPullerPoseMap,
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
  stageAnchorRef: Ref<MaybeElement>;
}

const BLACK_PULLER_LEFT = 240;
const YELLOW_PULLER_LEFT = 310;
const BLACK_LINE_START = 109;
const YELLOW_LINE_START = 118;

function isDesktopViewport(): boolean {
  return window.innerWidth >= DESKTOP_MIN_WIDTH;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useLoginEntrance(stageAnchorRef: Ref<MaybeElement>) {
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
    stageAnchorRef,
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
      stageAnchorRef: stageAnchor,
    } = Object.fromEntries(
      Object.entries(elementRefs).map(([key, elementRef]) => [
        key,
        elementRef.value,
      ])
    ) as Record<keyof EntranceElementRefs, MaybeElement>;

    if (
      !overlay ||
      !curtain ||
      !formReveal ||
      !blackPuller ||
      !yellowPuller ||
      !supportGroup ||
      !stageAnchor
    ) {
      skipAnimation();
      return;
    }

    const clipPathTargets = getEntranceClipPathTargets(isDesktop);
    const timings = getEntranceTimings();
    const pullerPoseMap = getPullerPoseMap();
    const stageTravelX = Math.round(window.innerWidth * 0.3);
    const stageRect = stageAnchor.getBoundingClientRect();
    const curtainBoundaryX = Math.round(window.innerWidth * 0.5);
    const blackLineWidth = Math.max(
      curtainBoundaryX - stageRect.left - BLACK_PULLER_LEFT - BLACK_LINE_START,
      112
    );
    const yellowLineWidth = Math.max(
      curtainBoundaryX -
        stageRect.left -
        YELLOW_PULLER_LEFT -
        YELLOW_LINE_START +
        8,
      104
    );
    const pullerTargets = [
      pullerPoseMap.black === 'puller' ? blackPuller : null,
      pullerPoseMap.yellow === 'puller' ? yellowPuller : null,
    ].filter((element): element is HTMLElement => Boolean(element));
    const supportTargets =
      pullerPoseMap.orange === 'support' || pullerPoseMap.purple === 'support'
        ? [supportGroup]
        : [];

    gsap.set(overlay, { autoAlpha: 1, pointerEvents: 'auto' });
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
    gsap.set(pullerTargets, {
      x: 0,
      y: 0,
      rotation: 0,
      transformOrigin: 'center center',
    });
    gsap.set(supportTargets, {
      left: stageRect.left,
      top: stageRect.top,
      width: stageRect.width,
      height: stageRect.height,
      x: stageTravelX,
      y: 54,
      scale: 1.46,
      autoAlpha: 1,
      transformOrigin: 'center bottom',
    });
    supportGroup.style.setProperty(
      '--black-puller-left',
      `${BLACK_PULLER_LEFT}px`
    );
    supportGroup.style.setProperty(
      '--yellow-puller-left',
      `${YELLOW_PULLER_LEFT}px`
    );
    supportGroup.style.setProperty('--black-line-width', `${blackLineWidth}px`);
    supportGroup.style.setProperty(
      '--yellow-line-width',
      `${yellowLineWidth}px`
    );

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
      .to(supportTargets, {
        y: 46,
        duration: timings.establish,
      })
      .to(
        pullerTargets,
        {
          x: (index) => (index === 0 ? -22 : -14),
          y: -10,
          rotation: (index) => (index === 0 ? -12 : -8),
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
        supportTargets,
        {
          x: 0,
          y: 0,
          scale: 1,
          duration: timings.curtainPull + 0.1,
          ease: 'power3.inOut',
        },
        '<'
      )
      .to(
        pullerTargets,
        {
          x: (index) => (index === 0 ? -36 : -26),
          y: -14,
          rotation: (index) => (index === 0 ? -16 : -11),
          duration: timings.curtainPull,
          ease: 'power3.inOut',
        },
        '<'
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
        pullerTargets,
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
        supportTargets,
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
