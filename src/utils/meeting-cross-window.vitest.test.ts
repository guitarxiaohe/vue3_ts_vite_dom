import { beforeEach, describe, expect, test } from 'vitest';

import {
  claimMeetingRtcOwner,
  ensureMeetingClientId,
  isMeetingRtcOwner,
  readMeetingRtcOwner,
  readMeetingSharedAudioState,
  releaseMeetingRtcOwner,
  writeMeetingSharedAudioState,
} from './meeting-cross-window';

describe('meeting cross-window helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test('ensureMeetingClientId should reuse the same tab id across refreshes', () => {
    const first = ensureMeetingClientId(sessionStorage);
    const second = ensureMeetingClientId(sessionStorage);

    expect(first).toBeTruthy();
    expect(second).toBe(first);
  });

  test('rtc owner should expire and allow another tab to take over', () => {
    const owner = claimMeetingRtcOwner(10, 'tab-a', localStorage, 1000);

    expect(owner.meetingId).toBe(10);
    expect(isMeetingRtcOwner(10, 'tab-a', localStorage, 1000)).toBe(true);
    expect(isMeetingRtcOwner(10, 'tab-b', localStorage, 1000)).toBe(false);
    expect(readMeetingRtcOwner(localStorage, 20000)).toBeNull();
  });

  test('releaseMeetingRtcOwner should only clear the matching tab owner', () => {
    claimMeetingRtcOwner(10, 'tab-a', localStorage, 1000);

    releaseMeetingRtcOwner('tab-b', localStorage);
    expect(isMeetingRtcOwner(10, 'tab-a', localStorage, 1000)).toBe(true);

    releaseMeetingRtcOwner('tab-a', localStorage);
    expect(readMeetingRtcOwner(localStorage, 1000)).toBeNull();
  });

  test('shared audio state should persist normalized mic and playback preferences', () => {
    writeMeetingSharedAudioState(
      {
        isMicEnabled: false,
        isSpeakerMuted: true,
        playbackVolume: 2,
      },
      localStorage
    );

    expect(readMeetingSharedAudioState(localStorage)).toEqual({
      isMicEnabled: false,
      isSpeakerMuted: true,
      playbackVolume: 1,
    });
  });
});
