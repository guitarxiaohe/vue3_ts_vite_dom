import { describe, expect, test } from 'vitest';

import {
  getEntranceClipPathTargets,
  getEntranceTimings,
  getPullerPoseMap,
  shouldPlayEntranceAnimation,
} from './use-login-entrance.utils';

describe('use-login-entrance.utils', () => {
  test('shouldPlayEntranceAnimation returns true for desktop first play with no reduced motion', () => {
    expect(
      shouldPlayEntranceAnimation({
        isDesktop: true,
        hasPlayed: false,
        prefersReducedMotion: false,
      })
    ).toBe(true);
  });

  test('shouldPlayEntranceAnimation returns false when already played', () => {
    expect(
      shouldPlayEntranceAnimation({
        isDesktop: true,
        hasPlayed: true,
        prefersReducedMotion: false,
      })
    ).toBe(false);
  });

  test('shouldPlayEntranceAnimation returns false on mobile', () => {
    expect(
      shouldPlayEntranceAnimation({
        isDesktop: false,
        hasPlayed: false,
        prefersReducedMotion: false,
      })
    ).toBe(false);
  });

  test('shouldPlayEntranceAnimation returns false when reduced motion is preferred', () => {
    expect(
      shouldPlayEntranceAnimation({
        isDesktop: true,
        hasPlayed: false,
        prefersReducedMotion: true,
      })
    ).toBe(false);
  });

  test('getEntranceClipPathTargets returns desktop clip-path targets', () => {
    expect(getEntranceClipPathTargets(true)).toEqual({
      from: 'inset(0 0% 0 0 round 0px)',
      to: 'inset(0 50% 0 0 round 0px)',
    });
  });

  test('getEntranceClipPathTargets returns mobile clip-path targets', () => {
    expect(getEntranceClipPathTargets(false)).toEqual({
      from: 'inset(0 0% 0 0 round 0px)',
      to: 'inset(0 0 58% 0 round 0px)',
    });
  });

  test('getEntranceTimings returns the expected motion timings', () => {
    expect(getEntranceTimings()).toEqual({
      establish: 0.42,
      pullPrep: 0.34,
      curtainPull: 0.78,
      formRevealDelay: 0.24,
      formReveal: 0.56,
      bounceBack: 0.42,
    });
  });

  test('getPullerPoseMap returns the expected puller and support roles', () => {
    expect(getPullerPoseMap()).toEqual({
      black: 'puller',
      yellow: 'puller',
      orange: 'support',
      purple: 'support',
    });
  });
});
