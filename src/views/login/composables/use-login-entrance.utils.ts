export interface EntranceAnimationContext {
  isDesktop: boolean;
  hasPlayed: boolean;
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

export type PullerPose = 'puller' | 'support';

export interface PullerPoseMap {
  black: PullerPose;
  yellow: PullerPose;
  orange: PullerPose;
  purple: PullerPose;
}

export function shouldPlayEntranceAnimation(
  context: EntranceAnimationContext
): boolean {
  return (
    context.isDesktop && !context.hasPlayed && !context.prefersReducedMotion
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
    establish: 0.42,
    pullPrep: 0.34,
    curtainPull: 0.78,
    formRevealDelay: 0.24,
    formReveal: 0.56,
    bounceBack: 0.42,
  };
}

export function getPullerPoseMap(): PullerPoseMap {
  return {
    black: 'puller',
    yellow: 'puller',
    orange: 'support',
    purple: 'support',
  };
}
