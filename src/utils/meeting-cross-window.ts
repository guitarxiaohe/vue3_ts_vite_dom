export interface MeetingSharedAudioState {
  isMicEnabled: boolean;
  isSpeakerMuted: boolean;
  playbackVolume: number;
}

export interface MeetingRtcOwner {
  meetingId: number;
  clientId: string;
  updatedAt: number;
}

export const MEETING_SHARED_AUDIO_KEY = 'xiaohe:meeting:audio-state';
export const MEETING_RTC_OWNER_KEY = 'xiaohe:meeting:rtc-owner';
export const MEETING_CLIENT_ID_KEY = 'xiaohe:meeting:client-id';
export const MEETING_RTC_OWNER_TTL_MS = 15000;

const DEFAULT_SHARED_AUDIO_STATE: MeetingSharedAudioState = {
  isMicEnabled: true,
  isSpeakerMuted: false,
  playbackVolume: 1,
};

function safeJsonParse<T>(rawValue: string | null): T | null {
  if (!rawValue) {
    return null;
  }
  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
}

function clampPlaybackVolume(value: unknown) {
  const normalized = Number(value);
  if (Number.isNaN(normalized)) {
    return DEFAULT_SHARED_AUDIO_STATE.playbackVolume;
  }
  return Math.max(0, Math.min(1, normalized));
}

function normalizeSharedAudioState(
  value: Partial<MeetingSharedAudioState> | null | undefined
): MeetingSharedAudioState {
  const playbackVolume = clampPlaybackVolume(value?.playbackVolume);
  const isSpeakerMuted =
    typeof value?.isSpeakerMuted === 'boolean'
      ? value.isSpeakerMuted
      : playbackVolume === 0;

  return {
    isMicEnabled:
      typeof value?.isMicEnabled === 'boolean'
        ? value.isMicEnabled
        : DEFAULT_SHARED_AUDIO_STATE.isMicEnabled,
    isSpeakerMuted,
    playbackVolume,
  };
}

function normalizeRtcOwner(
  value: Partial<MeetingRtcOwner> | null | undefined
): MeetingRtcOwner | null {
  const meetingId = Number(value?.meetingId);
  const updatedAt = Number(value?.updatedAt);
  const clientId = String(value?.clientId || '').trim();
  if (meetingId <= 0 || !clientId || Number.isNaN(updatedAt) || updatedAt <= 0) {
    return null;
  }
  return {
    meetingId,
    clientId,
    updatedAt,
  };
}

function createMeetingClientId() {
  return `meeting-tab-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ensureMeetingClientId(storage: Storage) {
  const cached = storage.getItem(MEETING_CLIENT_ID_KEY);
  if (cached) {
    return cached;
  }
  const nextId = createMeetingClientId();
  storage.setItem(MEETING_CLIENT_ID_KEY, nextId);
  return nextId;
}

export function readMeetingSharedAudioState(storage: Storage) {
  return normalizeSharedAudioState(
    safeJsonParse<MeetingSharedAudioState>(storage.getItem(MEETING_SHARED_AUDIO_KEY))
  );
}

export function writeMeetingSharedAudioState(
  patch: Partial<MeetingSharedAudioState>,
  storage: Storage
) {
  const nextState = normalizeSharedAudioState({
    ...readMeetingSharedAudioState(storage),
    ...patch,
  });
  storage.setItem(MEETING_SHARED_AUDIO_KEY, JSON.stringify(nextState));
  return nextState;
}

export function readMeetingRtcOwner(storage: Storage, now = Date.now()) {
  const owner = normalizeRtcOwner(
    safeJsonParse<MeetingRtcOwner>(storage.getItem(MEETING_RTC_OWNER_KEY))
  );
  if (!owner) {
    return null;
  }
  if (now - owner.updatedAt > MEETING_RTC_OWNER_TTL_MS) {
    storage.removeItem(MEETING_RTC_OWNER_KEY);
    return null;
  }
  return owner;
}

export function claimMeetingRtcOwner(
  meetingId: number,
  clientId: string,
  storage: Storage,
  now = Date.now()
) {
  const owner: MeetingRtcOwner = {
    meetingId,
    clientId,
    updatedAt: now,
  };
  storage.setItem(MEETING_RTC_OWNER_KEY, JSON.stringify(owner));
  return owner;
}

export function isMeetingRtcOwner(
  meetingId: number,
  clientId: string,
  storage: Storage,
  now = Date.now()
) {
  const owner = readMeetingRtcOwner(storage, now);
  return !!owner && owner.meetingId === meetingId && owner.clientId === clientId;
}

export function releaseMeetingRtcOwner(
  clientId: string,
  storage: Storage,
  meetingId?: number | null
) {
  const owner = normalizeRtcOwner(
    safeJsonParse<MeetingRtcOwner>(storage.getItem(MEETING_RTC_OWNER_KEY))
  );
  if (!owner) {
    return;
  }
  if (owner.clientId !== clientId) {
    return;
  }
  if (meetingId && owner.meetingId !== meetingId) {
    return;
  }
  storage.removeItem(MEETING_RTC_OWNER_KEY);
}
