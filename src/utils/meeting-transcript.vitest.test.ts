import { describe, expect, test } from 'vitest';

import { buildSpeakerTranscriptLines } from './meeting-transcript';

describe('meeting transcript helpers', () => {
  test('should avoid duplicating cumulative partial text for the same speaker', () => {
    const lines = buildSpeakerTranscriptLines([
      {
        id: 'transcript-1',
        label: '管理员提到',
        text: '好了。Wow.',
        timestamp: 1,
      },
      {
        id: 'transcript-2',
        label: '测试 1 提到',
        text: '我是测试哦。',
        timestamp: 2,
      },
      {
        id: 'pending-user-1',
        label: '管理员补充',
        text: '好了。Wow.Good.各位小伙伴，可以听到吗？',
        timestamp: 3,
        pending: true,
      },
    ]);

    expect(lines).toEqual([
      expect.objectContaining({
        displayLabel: '管理员',
        text: '好了。Wow.Good.各位小伙伴，可以听到吗？',
        pending: true,
      }),
      expect.objectContaining({
        displayLabel: '测试 1',
        text: '我是测试哦。',
        pending: false,
      }),
    ]);
  });

  test('should merge overlapped chunk boundaries for the same speaker', () => {
    const lines = buildSpeakerTranscriptLines([
      {
        id: 'transcript-1',
        label: '管理员提到',
        text: '各位小伙伴，可以听到吗？',
        timestamp: 1,
      },
      {
        id: 'transcript-2',
        label: '管理员提到',
        text: '可以听到吗？啊。嗯。',
        timestamp: 2,
      },
    ]);

    expect(lines).toEqual([
      expect.objectContaining({
        displayLabel: '管理员',
        text: '各位小伙伴，可以听到吗？啊。嗯。',
      }),
    ]);
  });
});
