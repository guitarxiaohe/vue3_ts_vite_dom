import { ref, shallowRef, onUnmounted } from 'vue';
import {
  Room,
  RoomEvent,
  Track,
  ConnectionState,
  TrackPublication,
  RemoteParticipant,
  LocalParticipant,
  DisconnectReason,
} from 'livekit-client';
import type { MeetingRtcTokenResponse } from '@/api/modules/meeting-rtc.type';

export interface ParticipantInfo {
  identity: string;
  name: string;
  isLocal: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  connectionState: ConnectionState;
}

export function useLivekitRoom() {
  const room = shallowRef<Room | null>(null);
  const connectionState = ref<ConnectionState>(ConnectionState.Disconnected);
  const participants = ref<ParticipantInfo[]>([]);
  const activeSpeakers = ref<string[]>([]);
  const isMicEnabled = ref(true);
  const isSpeakerMuted = ref(false);
  const playbackVolume = ref(1);
  const localParticipant = ref<LocalParticipant | null>(null);

  let updateParticipantsTimer: ReturnType<typeof setInterval> | null = null;
  let lastAudiblePlaybackVolume = 1;
  const attachedAudioElements = new Map<
    string,
    { track: Track; element: HTMLMediaElement }
  >();

  function resolvePublicationSid(publication: TrackPublication) {
    return publication.trackSid;
  }

  function attachRemoteAudioTrack(track: Track, publication: TrackPublication) {
    if (track.kind !== Track.Kind.Audio) {
      return;
    }

    const publicationSid = resolvePublicationSid(publication);
    if (attachedAudioElements.has(publicationSid)) {
      return;
    }

    const element = track.attach();
    element.autoplay = true;
    element.style.display = 'none';
    document.body.appendChild(element);
    attachedAudioElements.set(publicationSid, { track, element });
  }

  function detachRemoteAudioTrack(publication: TrackPublication) {
    const publicationSid = resolvePublicationSid(publication);
    const attached = attachedAudioElements.get(publicationSid);
    if (!attached) {
      return;
    }

    attached.track.detach(attached.element);
    attached.element.remove();
    attachedAudioElements.delete(publicationSid);
  }

  function clearAttachedAudioTracks() {
    attachedAudioElements.forEach(({ track, element }) => {
      track.detach(element);
      element.remove();
    });
    attachedAudioElements.clear();
  }

  /**
   * 连接房间
   */
  async function joinRoom(tokenInfo: MeetingRtcTokenResponse) {
    if (room.value) {
      await leaveRoom();
    }

    const newRoom = new Room({
      adaptiveStream: true,
      dynacast: true,
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // 注册事件
    newRoom.on(RoomEvent.Connected, () => {
      connectionState.value = ConnectionState.Connected;
      updateParticipantsList();
    });

    newRoom.on(RoomEvent.Disconnected, (_reason?: DisconnectReason) => {
      clearAttachedAudioTracks();
      connectionState.value = ConnectionState.Disconnected;
      participants.value = [];
      activeSpeakers.value = [];
    });

    newRoom.on(RoomEvent.Reconnecting, () => {
      connectionState.value = ConnectionState.Reconnecting;
    });

    newRoom.on(RoomEvent.Reconnected, () => {
      connectionState.value = ConnectionState.Connected;
    });

    newRoom.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      applyPlaybackVolume(playbackVolume.value, participant);
      updateParticipantsList();
    });

    newRoom.on(RoomEvent.ParticipantDisconnected, (_participant: RemoteParticipant) => {
      updateParticipantsList();
    });

    newRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      activeSpeakers.value = speakers.map((p) => p.identity);
      updateParticipantsList();
    });

    newRoom.on(RoomEvent.TrackMuted, (_pub: TrackPublication, _participant) => {
      updateParticipantsList();
    });

    newRoom.on(RoomEvent.TrackUnmuted, (_pub: TrackPublication, _participant) => {
      updateParticipantsList();
    });

    newRoom.on(
      RoomEvent.TrackSubscribed,
      (track: Track, publication: TrackPublication) => {
        attachRemoteAudioTrack(track, publication);
        updateParticipantsList();
      }
    );

    newRoom.on(
      RoomEvent.TrackUnsubscribed,
      (_track: Track, publication: TrackPublication) => {
        detachRemoteAudioTrack(publication);
        updateParticipantsList();
      }
    );

    // 连接房间
    await newRoom.connect(tokenInfo.serverUrl, tokenInfo.participantToken);
    newRoom.remoteParticipants.forEach((participant) => {
      applyPlaybackVolume(playbackVolume.value, participant);
      participant.trackPublications.forEach((publication) => {
        if (publication.track) {
          attachRemoteAudioTrack(publication.track, publication);
        }
      });
    });

    // 发布本地麦克风
    await newRoom.localParticipant.setMicrophoneEnabled(true);

    room.value = newRoom;
    localParticipant.value = newRoom.localParticipant;
    isMicEnabled.value = true;

    // 定期更新参与者列表
    updateParticipantsTimer = setInterval(updateParticipantsList, 2000);

    updateParticipantsList();
  }

  /**
   * 离开房间
   */
  async function leaveRoom() {
    if (updateParticipantsTimer) {
      clearInterval(updateParticipantsTimer);
      updateParticipantsTimer = null;
    }

    if (room.value) {
      clearAttachedAudioTracks();
      await room.value.disconnect();
      room.value = null;
      localParticipant.value = null;
      participants.value = [];
      activeSpeakers.value = [];
      connectionState.value = ConnectionState.Disconnected;
    }
  }

  /**
   * 切换麦克风
   */
  async function toggleMic() {
    if (!room.value) return;

    const enabled = !isMicEnabled.value;
    await room.value.localParticipant.setMicrophoneEnabled(enabled);
    isMicEnabled.value = enabled;
  }

  /**
   * 调整扬声器音量
   */
  function setPlaybackVolume(volume: number) {
    const normalized = Math.max(0, Math.min(1, volume));
    playbackVolume.value = normalized;
    isSpeakerMuted.value = normalized === 0;
    if (normalized > 0) {
      lastAudiblePlaybackVolume = normalized;
    }
    applyPlaybackVolume(normalized);
  }

  /**
   * 切换扬声器静音
   */
  function toggleSpeakerMute() {
    if (isSpeakerMuted.value) {
      setPlaybackVolume(lastAudiblePlaybackVolume || 1);
      return;
    }
    if (playbackVolume.value > 0) {
      lastAudiblePlaybackVolume = playbackVolume.value;
    }
    setPlaybackVolume(0);
  }

  /**
   * 更新参与者列表
   */
  function updateParticipantsList() {
    if (!room.value) {
      participants.value = [];
      return;
    }

    const list: ParticipantInfo[] = [];

    // 本地参与者
    if (room.value.localParticipant) {
      const local = room.value.localParticipant;
      list.push({
        identity: local.identity,
        name: local.name || local.identity,
        isLocal: true,
        isSpeaking: activeSpeakers.value.includes(local.identity),
        isMuted: !isMicEnabled.value,
        connectionState: connectionState.value,
      });
    }

    // 远端参与者
    room.value.remoteParticipants.forEach((participant) => {
      const audioPub = participant.getTrackPublication(Track.Source.Microphone);
      list.push({
        identity: participant.identity,
        name: participant.name || participant.identity,
        isLocal: false,
        isSpeaking: activeSpeakers.value.includes(participant.identity),
        isMuted: audioPub ? audioPub.isMuted : true,
        connectionState: ConnectionState.Connected,
      });
    });

    participants.value = list;
  }

  /**
   * 将播放音量同步到远端音频
   */
  function applyPlaybackVolume(volume: number, participant?: RemoteParticipant) {
    const targets = participant
      ? [participant]
      : [...(room.value?.remoteParticipants.values() || [])];
    targets.forEach((item) => {
      item.setVolume(volume);
    });
  }

  /**
   * 获取参与者信息
   */
  function getParticipantInfo(identity: string): ParticipantInfo | undefined {
    return participants.value.find((p) => p.identity === identity);
  }

  /**
   * 解析用户 ID
   */
  function parseUserIdFromIdentity(identity: string): number | null {
    if (identity.startsWith('user-')) {
      const userId = parseInt(identity.substring(5), 10);
      return isNaN(userId) ? null : userId;
    }
    return null;
  }

  onUnmounted(() => {
    leaveRoom();
  });

  return {
    room,
    connectionState,
    participants,
    activeSpeakers,
    isMicEnabled,
    isSpeakerMuted,
    playbackVolume,
    localParticipant,
    joinRoom,
    leaveRoom,
    toggleMic,
    setPlaybackVolume,
    toggleSpeakerMute,
    getParticipantInfo,
    parseUserIdFromIdentity,
  };
}
