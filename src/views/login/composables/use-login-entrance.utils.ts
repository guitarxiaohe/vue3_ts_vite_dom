export interface EntranceAnimationContext {
  isDesktop: boolean;
  hasPlayedEntrance: boolean;
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
    context.isDesktop &&
    !context.hasPlayedEntrance &&
    !context.prefersReducedMotion
  );
}

export function getEntranceClipPathTargets(
  viewport: 'desktop' | 'mobile'
): EntranceClipPathTargets {
  return viewport === 'desktop'
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
