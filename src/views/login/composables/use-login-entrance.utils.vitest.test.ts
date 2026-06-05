import { describe, expect, test } from 'vitest';

import {
  getEntranceClipPathTargets,
  getEntranceTimings,
  shouldPlayEntranceAnimation,
} from './use-login-entrance.utils';

describe('use-login-entrance.utils', () => {
  test('shouldPlayEntranceAnimation returns true for desktop first play with no reduced motion', () => {
    expect(
      shouldPlayEntranceAnimation({
        isDesktop: true,
        hasPlayedEntrance: false,
        prefersReducedMotion: false,
      })
    ).toBe(true);
  });

  test('shouldPlayEntranceAnimation returns false when already played', () => {
    expect(
      shouldPlayEntranceAnimation({
        isDesktop: true,
        hasPlayedEntrance: true,
        prefersReducedMotion: false,
      })
    ).toBe(false);
  });

  test('shouldPlayEntranceAnimation returns false on mobile', () => {
    expect(
      shouldPlayEntranceAnimation({
        isDesktop: false,
        hasPlayedEntrance: false,
        prefersReducedMotion: false,
      })
    ).toBe(false);
  });

  test('shouldPlayEntranceAnimation returns false when reduced motion is preferred', () => {
    expect(
      shouldPlayEntranceAnimation({
        isDesktop: true,
        hasPlayedEntrance: false,
        prefersReducedMotion: true,
      })
    ).toBe(false);
  });

  test('getEntranceClipPathTargets returns desktop clip-path targets', () => {
    expect(getEntranceClipPathTargets('desktop')).toEqual({
      from: 'inset(0 0% 0 0 round 0px)',
      to: 'inset(0 50% 0 0 round 0px)',
    });
  });

  test('getEntranceClipPathTargets returns mobile clip-path targets', () => {
    expect(getEntranceClipPathTargets('mobile')).toEqual({
      from: 'inset(0 0% 0 0 round 0px)',
      to: 'inset(0 0 58% 0 round 0px)',
    });
  });

  test('getEntranceTimings returns the expected motion timings', () => {
    expect(getEntranceTimings()).toEqual({
      establish: 0.35,
      pullPrep: 0.25,
      curtainPull: 0.5,
      formRevealDelay: 0.2,
      formReveal: 0.45,
      bounceBack: 0.35,
    });
  });
});
