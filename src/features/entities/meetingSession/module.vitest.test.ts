import { describe, expect, test } from 'vitest';

import meetingSessionModule from './module';

describe('meetingSession module', () => {
  test('should expose dismissMeeting row action only for active meetings', () => {
    const dismissAction = meetingSessionModule.rowActions?.customButtons?.find(
      (item) => item.key === 'dismissMeeting'
    );

    expect(dismissAction).toBeDefined();
    expect(
      dismissAction?.visible?.({ status: 'ACTIVE' }, { refresh() {} })
    ).toBe(true);
    expect(
      dismissAction?.visible?.({ status: 'ENDED' }, { refresh() {} })
    ).toBe(false);
  });
});
