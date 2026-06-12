import { describe, expect, test, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { useLivekitRoom } from './use-livekit-room';
import type { MeetingRtcTokenResponse } from '@/api/modules/meeting-rtc.type';

const livekitMocks = vi.hoisted(() => {
  const rooms: any[] = [];
  const nextRemoteParticipants: any[] = [];

  const ConnectionState = {
    Disconnected: 'disconnected',
    Connected: 'connected',
    Reconnecting: 'reconnecting',
  };

  const RoomEvent = {
    Connected: 'connected',
    Disconnected: 'disconnected',
    Reconnecting: 'reconnecting',
    Reconnected: 'reconnected',
    ParticipantConnected: 'participantConnected',
    ParticipantDisconnected: 'participantDisconnected',
    ActiveSpeakersChanged: 'activeSpeakersChanged',
    TrackMuted: 'trackMuted',
    TrackUnmuted: 'trackUnmuted',
    TrackSubscribed: 'trackSubscribed',
    TrackUnsubscribed: 'trackUnsubscribed',
  };

  const Track = {
    Kind: {
      Audio: 'audio',
    },
    Source: {
      Microphone: 'microphone',
    },
  };

  class MockRoom {
    handlers = new Map<string, Function[]>();
    remoteParticipants = new Map<string, any>();
    localParticipant = {
      identity: 'user-1',
      name: '本地用户',
      setMicrophoneEnabled: vi.fn().mockResolvedValue(undefined),
    };

    constructor() {
      rooms.push(this);
    }

    on(event: string, handler: Function) {
      const current = this.handlers.get(event) || [];
      current.push(handler);
      this.handlers.set(event, current);
      return this;
    }

    emit(event: string, ...args: any[]) {
      const current = this.handlers.get(event) || [];
      current.forEach((handler) => handler(...args));
    }

    async connect() {
      this.remoteParticipants = new Map(
        nextRemoteParticipants.map((participant) => [
          participant.identity,
          participant,
        ])
      );
      this.emit(RoomEvent.Connected);
    }

    async disconnect() {
      this.emit(RoomEvent.Disconnected);
    }
  }

  return {
    rooms,
    nextRemoteParticipants,
    ConnectionState,
    RoomEvent,
    Track,
    MockRoom,
  };
});

vi.mock('livekit-client', () => ({
  Room: livekitMocks.MockRoom,
  RoomEvent: livekitMocks.RoomEvent,
  Track: livekitMocks.Track,
  ConnectionState: livekitMocks.ConnectionState,
}));

function createTokenInfo(): MeetingRtcTokenResponse {
  return {
    serverUrl: 'ws://localhost:7880',
    roomName: 'meeting-10',
    participantToken: 'token',
    participantIdentity: 'user-1',
    userId: 1,
    displayName: '本地用户',
    host: true,
  };
}

function createRemoteAudioParticipant(identity: string) {
  const attach = vi.fn(() => document.createElement('audio'));
  const detach = vi.fn(() => []);
  const setVolume = vi.fn();
  const track = {
    kind: livekitMocks.Track.Kind.Audio,
    attach,
    detach,
    setVolume,
  };
  const publication = {
    trackSid: `${identity}-audio-track`,
    sid: `${identity}-audio-track`,
    isMuted: false,
    track,
  };
  const participant = {
    identity,
    name: `${identity}-name`,
    getTrackPublication: vi.fn(() => publication),
    trackPublications: new Map([[publication.sid, publication]]),
    setVolume,
  };

  return {
    participant,
    publication,
    track,
    attach,
    detach,
  };
}

describe('useLivekitRoom audio playback', () => {
  beforeEach(() => {
    livekitMocks.rooms.length = 0;
    livekitMocks.nextRemoteParticipants.length = 0;
    document.body.innerHTML = '';
    localStorage.clear();
  });

  test('attaches existing remote audio tracks after joining the room', async () => {
    const remote = createRemoteAudioParticipant('user-2');
    livekitMocks.nextRemoteParticipants.push(remote.participant);
    const livekitRoom = useLivekitRoom();

    await livekitRoom.joinRoom(createTokenInfo());

    expect(remote.attach).toHaveBeenCalledTimes(1);
  });

  test('attaches newly subscribed remote audio tracks', async () => {
    const remote = createRemoteAudioParticipant('user-3');
    const livekitRoom = useLivekitRoom();

    await livekitRoom.joinRoom(createTokenInfo());

    const room = livekitMocks.rooms[0];
    room.emit(
      livekitMocks.RoomEvent.TrackSubscribed,
      remote.track,
      remote.publication,
      remote.participant
    );
    await nextTick();

    expect(remote.attach).toHaveBeenCalledTimes(1);
  });

  test('restores shared mic state and playback volume after refresh', async () => {
    localStorage.setItem(
      'xiaohe:meeting:audio-state',
      JSON.stringify({
        isMicEnabled: false,
        isSpeakerMuted: false,
        playbackVolume: 0.35,
      })
    );

    const livekitRoom = useLivekitRoom();
    await livekitRoom.joinRoom(createTokenInfo());

    const room = livekitMocks.rooms[0];
    expect(room.localParticipant.setMicrophoneEnabled).toHaveBeenLastCalledWith(
      false
    );
    expect(livekitRoom.isMicEnabled.value).toBe(false);
    expect(livekitRoom.playbackVolume.value).toBe(0.35);
  });
});
