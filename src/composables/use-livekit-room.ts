/**
 * LiveKit 实时音视频房间管理 Composable
 *
 * 封装了 LiveKit 房间的核心功能，包括：
 * - 房间连接与断开
 * - 麦克风开关控制
 * - 扬声器音量调节与静音
 * - 参与者列表管理
 * - 远端音频轨道的挂载与卸载
 * - 跨窗口音频状态同步（通过 localStorage）
 *
 * @example
 * ```ts
 * const { joinRoom, leaveRoom, toggleMic, participants } = useLivekitRoom();
 *
 * // 连接房间
 * await joinRoom(tokenInfo);
 *
 * // 切换麦克风
 * await toggleMic();
 * ```
 */
import { getCurrentInstance, onUnmounted, ref, shallowRef } from 'vue';
import {
  Room,
  RoomEvent,
  Track,
  ConnectionState,
  TrackPublication,
  RemoteParticipant,
  LocalParticipant,
  DisconnectReason,
  RemoteTrackPublication,
  RemoteVideoTrack,
  LocalTrackPublication,
  LocalVideoTrack,
} from 'livekit-client';

import type { MeetingRtcTokenResponse } from '@/api/modules/meeting-rtc.type';
import {
  readMeetingSharedAudioState,
  writeMeetingSharedAudioState,
} from '@/utils/meeting-cross-window';

export const MEDIADEVICES_OPTIONS = {
  audio: true,
  video: true,
};

export interface RemoteScreenShareInfo {
  participantIdentity: string;
  participantName: string;
  publication: RemoteTrackPublication;
  track: RemoteVideoTrack;
}

/**
 * 参与者信息接口
 */
export interface ParticipantInfo {
  /** 参与者唯一标识，格式如 "user-123" */
  identity: string;
  /** 参与者显示名称 */
  name: string;
  /** 是否为本地参与者 */
  isLocal: boolean;
  /** 是否正在发言 */
  isSpeaking: boolean;
  /** 麦克风是否静音 */
  isMuted: boolean;
  /** 连接状态 */
  connectionState: ConnectionState;
}

/**
 * LiveKit 房间管理 Composable
 *
 * 提供完整的 LiveKit 房间生命周期管理，支持音视频通话的核心功能。
 * 音频状态通过 localStorage 实现跨窗口同步，确保多窗口场景下状态一致。
 */
export function useLivekitRoom() {
  // 从 localStorage 读取跨窗口共享的音频状态
  const sharedAudioState = readMeetingSharedAudioState(localStorage);

  // ========================= 响应式状态 =========================

  /** LiveKit Room 实例 */
  const room = shallowRef<Room | null>(null);
  /** 当前连接状态 */
  const connectionState = ref<ConnectionState>(ConnectionState.Disconnected);
  /** 所有参与者列表（本地 + 远端） */
  const participants = ref<ParticipantInfo[]>([]);
  /** 当前活跃发言人列表 */
  const activeSpeakers = ref<string[]>([]);
  /** 本地麦克风是否开启 */
  const isMicEnabled = ref(sharedAudioState.isMicEnabled);
  /** 扬声器是否静音 */
  const isSpeakerMuted = ref(sharedAudioState.isSpeakerMuted);
  /** 扬声器播放音量（0-1） */
  const playbackVolume = ref(sharedAudioState.playbackVolume);
  /** 本地参与者实例 */
  const localParticipant = ref<LocalParticipant | null>(null);

  /** 当前本地屏幕共享轨 */
  const localScreenTrack = shallowRef<LocalVideoTrack | null>(null);
  /** 当前本地屏幕共享发布 */
  const localScreenPublication = shallowRef<LocalTrackPublication | null>(null);
  /** 当前远端屏幕共享信息 */
  const remoteScreenShare = shallowRef<RemoteScreenShareInfo | null>(null);
  // ========================= 内部状态 =========================

  /** 定时更新参与者列表的定时器 */
  let updateParticipantsTimer: ReturnType<typeof setInterval> | null = null;
  /** 记录静音前的音量，用于取消静音时恢复 */
  let lastAudiblePlaybackVolume = sharedAudioState.playbackVolume || 1;
  /** AudioContext 是否已恢复（浏览器自动播放策略限制） */
  let audioContextResumed = false;
  /** 已挂载的远端音频元素映射表，用于跟踪和清理 */
  const attachedAudioElements = new Map<
    string,
    { track: Track; element: HTMLMediaElement }
  >();

  // ========================= 跨窗口状态同步 =========================

  /**
   * 从 localStorage 读取共享音频状态并应用到本地响应式变量
   * 当收到 storage 事件时调用，用于同步其他窗口的音频状态变更
   */
  function applySharedAudioStateFromStorage() {
    const nextState = readMeetingSharedAudioState(localStorage);
    isMicEnabled.value = nextState.isMicEnabled;
    isSpeakerMuted.value = nextState.isSpeakerMuted;
    playbackVolume.value = nextState.playbackVolume;
    if (nextState.playbackVolume > 0) {
      lastAudiblePlaybackVolume = nextState.playbackVolume;
    }
    applyPlaybackVolume(nextState.playbackVolume);
  }

  /**
   * 将音频状态变更持久化到 localStorage 并同步到本地响应式变量
   * 同时通知其他窗口状态已更新
   *
   * @param patch - 需要更新的音频状态字段（部分更新）
   * @returns 更新后的完整音频状态
   */
  function persistSharedAudioState(
    patch: Partial<{
      isMicEnabled: boolean;
      isSpeakerMuted: boolean;
      playbackVolume: number;
    }>
  ) {
    const nextState = writeMeetingSharedAudioState(patch, localStorage);
    isMicEnabled.value = nextState.isMicEnabled;
    isSpeakerMuted.value = nextState.isSpeakerMuted;
    playbackVolume.value = nextState.playbackVolume;
    if (nextState.playbackVolume > 0) {
      lastAudiblePlaybackVolume = nextState.playbackVolume;
    }
    return nextState;
  }

  /**
   * 恢复被浏览器挂起的 AudioContext
   * 现代浏览器在用户未与页面交互前会挂起 AudioContext，导致音频无法播放
   * 必须在用户手势（click / tap 等）的调用栈中同步调用才能生效
   */
  function resumeAudioContext() {
    if (audioContextResumed) return;
    try {
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      audioContextResumed = true;
    } catch {
      // 部分环境不支持 AudioContext，静默忽略
    }
  }

  /**
   * 注册一次性全局点击监听，在用户首次与页面交互时请求播放权限
   * 应在组件 mounted 阶段尽早调用，确保后续音频播放不被浏览器拦截
   * 监听器触发一次后自动移除，不会产生额外开销
   */
  function requestPlaybackPermission() {
    const handler = () => {
      resumeAudioContext();
      document.removeEventListener('click', handler, true);
    };
    document.addEventListener('click', handler, true);
  }

  // ========================= 共享屏幕 =========================

  function isScreenSharePublication(publication: TrackPublication) {
    return publication.source === Track.Source.ScreenShare;
  }

  function setRemoteScreenShare(
    participant: RemoteParticipant,
    publication: RemoteTrackPublication,
    track: RemoteVideoTrack
  ) {
    remoteScreenShare.value = {
      participantIdentity: participant.identity,
      participantName: participant.name || participant.identity,
      publication,
      track,
    };
  }

  function clearRemoteScreenShare(publication?: TrackPublication) {
    if (!remoteScreenShare.value) return;
    if (!publication) {
      remoteScreenShare.value = null;
      return;
    }
    if (remoteScreenShare.value.publication.trackSid === publication.trackSid) {
      remoteScreenShare.value = null;
    }
  }

  async function startScreenShare() {
    if (!room.value) {
      throw new Error('尚未加入语音房间');
    }
    if (localScreenTrack.value) {
      return localScreenTrack.value;
    }

    const tracks = await room.value.localParticipant.createScreenTracks({
      audio: false,
      video: true,
    });

    const screenTrack = tracks.find(
      (item) => item.kind === Track.Kind.Video
    ) as LocalVideoTrack | undefined;

    if (!screenTrack) {
      throw new Error('未获取到屏幕视频轨');
    }

    const publication = await room.value.localParticipant.publishTrack(
      screenTrack,
      {
        source: Track.Source.ScreenShare,
      }
    );

    localScreenTrack.value = screenTrack;
    localScreenPublication.value = publication;

    const mediaStreamTrack = screenTrack.mediaStreamTrack;
    mediaStreamTrack?.addEventListener('ended', () => {
      void stopScreenShare();
    });

    return screenTrack;
  }

  async function stopScreenShare() {
    if (room.value && localScreenPublication.value) {
      await room.value.localParticipant.unpublishTrack(
        localScreenTrack.value!,
        true
      );
    }

    localScreenTrack.value?.stop();
    localScreenTrack.value = null;
    localScreenPublication.value = null;
  }
  // ========================= 音频轨道管理 =========================

  /**
   * 解析轨道发布的唯一标识
   * @param publication - 轨道发布对象
   * @returns 轨道的唯一标识符
   */
  function resolvePublicationSid(publication: TrackPublication) {
    return publication.trackSid;
  }

  /**
   * 挂载远端音频轨道到 DOM
   * LiveKit 需要将远端音频轨道附加到 HTMLAudioElement 才能播放
   * 创建的音频元素隐藏且自动播放，挂载到 document.body
   *
   * @param track - 远端音频轨道
   * @param publication - 轨道发布信息
   */
  function attachRemoteAudioTrack(track: Track, publication: TrackPublication) {
    // 只处理音频轨道
    if (track.kind !== Track.Kind.Audio) {
      return;
    }

    const publicationSid = resolvePublicationSid(publication);
    // 避免重复挂载
    if (attachedAudioElements.has(publicationSid)) {
      return;
    }

    // 创建音频元素并挂载到 DOM
    const element = track.attach();
    element.autoplay = true;
    element.style.display = 'none'; // 隐藏音频元素
    document.body.appendChild(element);
    attachedAudioElements.set(publicationSid, { track, element });
  }

  /**
   * 卸载远端音频轨道
   * 从 DOM 移除音频元素并清理引用
   *
   * @param publication - 轨道发布信息
   */
  function detachRemoteAudioTrack(publication: TrackPublication) {
    const publicationSid = resolvePublicationSid(publication);
    const attached = attachedAudioElements.get(publicationSid);
    if (!attached) {
      return;
    }

    // 分离轨道并移除 DOM 元素
    attached.track.detach(attached.element);
    attached.element.remove();
    attachedAudioElements.delete(publicationSid);
  }

  /**
   * 清理所有已挂载的远端音频轨道
   * 在断开连接或离开房间时调用，防止内存泄漏
   */
  function clearAttachedAudioTracks() {
    attachedAudioElements.forEach(({ track, element }) => {
      track.detach(element);
      element.remove();
    });
    attachedAudioElements.clear();
  }

  // ========================= 房间生命周期 =========================

  /**
   * 连接 LiveKit 房间
   *
   * 完整的连接流程：
   * 1. 如果已有连接，先断开
   * 2. 创建 Room 实例并配置音频参数
   * 3. 注册所有房间事件监听
   * 4. 恢复 AudioContext（解决浏览器自动播放限制）
   * 5. 建立 WebSocket 连接
   * 6. 挂载已存在的远端音频轨道
   * 7. 发布本地麦克风
   * 8. 启动定时器定期更新参与者列表
   *
   * @param tokenInfo - 包含服务器地址和参与者令牌的认证信息
   */
  async function joinRoom(tokenInfo: MeetingRtcTokenResponse) {
    // 如果已有连接，先断开
    if (room.value) {
      await leaveRoom();
    }

    // 创建 Room 实例，启用自适应流和动态编码
    const newRoom = new Room({
      adaptiveStream: true, // 根据网络状况自动调整流质量
      dynacast: true, // 动态编码，只发送被订阅的轨道
      audioCaptureDefaults: {
        echoCancellation: true, // 回声消除
        noiseSuppression: true, // 噪声抑制
        autoGainControl: true, // 自动增益控制
      },
    });

    // ==================== 注册房间事件 ====================

    // 连接成功
    newRoom.on(RoomEvent.Connected, () => {
      connectionState.value = ConnectionState.Connected;
      updateParticipantsList();
    });

    // 断开连接
    newRoom.on(RoomEvent.Disconnected, (_reason?: DisconnectReason) => {
      clearAttachedAudioTracks();
      connectionState.value = ConnectionState.Disconnected;
      participants.value = [];
      activeSpeakers.value = [];
    });

    // 网络重连中
    newRoom.on(RoomEvent.Reconnecting, () => {
      connectionState.value = ConnectionState.Reconnecting;
    });

    // 重连成功
    newRoom.on(RoomEvent.Reconnected, () => {
      connectionState.value = ConnectionState.Connected;
    });

    // 新参与者加入
    newRoom.on(
      RoomEvent.ParticipantConnected,
      (participant: RemoteParticipant) => {
        applyPlaybackVolume(playbackVolume.value, participant);
        updateParticipantsList();
      }
    );

    // 参与者离开
    newRoom.on(
      RoomEvent.ParticipantDisconnected,
      (_participant: RemoteParticipant) => {
        updateParticipantsList();
      }
    );

    // 活跃发言人变化
    newRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      activeSpeakers.value = speakers.map((p) => p.identity);
      updateParticipantsList();
    });

    // 轨道静音
    newRoom.on(RoomEvent.TrackMuted, (_pub: TrackPublication, _participant) => {
      updateParticipantsList();
    });

    // 轨道取消静音
    newRoom.on(
      RoomEvent.TrackUnmuted,
      (_pub: TrackPublication, _participant) => {
        updateParticipantsList();
      }
    );

    newRoom.on(
      RoomEvent.TrackSubscribed,
      (
        track: Track,
        publication: TrackPublication,
        participant: RemoteParticipant
      ) => {
        if (
          track.kind === Track.Kind.Video &&
          isScreenSharePublication(publication)
        ) {
          setRemoteScreenShare(
            participant,
            publication as RemoteTrackPublication,
            track as RemoteVideoTrack
          );
          updateParticipantsList();
          return;
        }

        attachRemoteAudioTrack(track, publication);
        updateParticipantsList();
      }
    );

    newRoom.on(
      RoomEvent.TrackUnsubscribed,
      (
        track: Track,
        publication: TrackPublication,
        _participant: RemoteParticipant
      ) => {
        if (
          track.kind === Track.Kind.Video &&
          isScreenSharePublication(publication)
        ) {
          clearRemoteScreenShare(publication);
          updateParticipantsList();
          return;
        }

        detachRemoteAudioTrack(publication);
        updateParticipantsList();
      }
    );

    newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
      if (
        remoteScreenShare.value?.participantIdentity === participant.identity
      ) {
        remoteScreenShare.value = null;
      }
      updateParticipantsList();
    });

    // ==================== 建立连接 ====================

    // 恢复 AudioContext（joinRoom 通常由用户手势触发，此时恢复可确保音频播放）
    resumeAudioContext();
    await newRoom.connect(tokenInfo.serverUrl, tokenInfo.participantToken);

    // 挂载已存在的远端参与者音频轨道
    newRoom.remoteParticipants.forEach((participant) => {
      applyPlaybackVolume(playbackVolume.value, participant);
      participant.trackPublications.forEach((publication) => {
        if (publication.track) {
          if (
            publication.track.kind === Track.Kind.Video &&
            isScreenSharePublication(publication)
          ) {
            setRemoteScreenShare(
              participant,
              publication as RemoteTrackPublication,
              publication.track as RemoteVideoTrack
            );
            return;
          }
          attachRemoteAudioTrack(publication.track, publication);
        }
      });
    });

    // 发布本地麦克风轨道
    await newRoom.localParticipant.setMicrophoneEnabled(isMicEnabled.value);

    // 更新响应式状态
    room.value = newRoom;
    localParticipant.value = newRoom.localParticipant;
    applyPlaybackVolume(playbackVolume.value);

    // 启动定时器，每 2 秒更新一次参与者列表（兜底机制）
    updateParticipantsTimer = setInterval(updateParticipantsList, 2000);

    updateParticipantsList();
  }

  /**
   * 离开房间并清理资源
   *
   * 清理流程：
   * 1. 停止定时器
   * 2. 卸载所有音频轨道
   * 3. 断开 WebSocket 连接
   * 4. 重置所有状态
   */
  async function leaveRoom() {
    // 停止定时器
    if (updateParticipantsTimer) {
      clearInterval(updateParticipantsTimer);
      updateParticipantsTimer = null;
    }

    if (room.value) {
      await stopScreenShare();
      clearAttachedAudioTracks();
      await room.value.disconnect();
      // 重置所有状态
      room.value = null;
      localParticipant.value = null;
      remoteScreenShare.value = null;
      participants.value = [];
      activeSpeakers.value = [];
      connectionState.value = ConnectionState.Disconnected;
    }
  }

  /**
   * 页面关闭前同步释放本地轨道
   * 避免 Chrome 刷新后短时间内重复占用麦克风设备
   */
  function prepareForPageUnload() {
    if (updateParticipantsTimer) {
      clearInterval(updateParticipantsTimer);
      updateParticipantsTimer = null;
    }

    if (!room.value) {
      return;
    }

    try {
      room.value.localParticipant.trackPublications.forEach((publication) => {
        const track = publication.track;
        if (!track) {
          return;
        }
        track.stop();
      });
    } catch {
      // 页面卸载阶段静默忽略
    }

    try {
      localScreenTrack.value?.stop();
    } catch {
      // 页面卸载阶段静默忽略
    }

    clearAttachedAudioTracks();
    remoteScreenShare.value = null;
    localScreenTrack.value = null;
    localScreenPublication.value = null;
    participants.value = [];
    activeSpeakers.value = [];
    connectionState.value = ConnectionState.Disconnected;

    try {
      room.value.disconnect();
    } catch {
      // 页面卸载阶段静默忽略
    }

    room.value = null;
    localParticipant.value = null;
  }

  // ========================= 音频控制 =========================

  /**
   * 切换麦克风开关
   * 同时将状态持久化到 localStorage 以实现跨窗口同步
   */
  async function toggleMic() {
    if (!room.value) return;

    const enabled = !isMicEnabled.value;
    await room.value.localParticipant.setMicrophoneEnabled(enabled);
    persistSharedAudioState({ isMicEnabled: enabled });
  }

  /**
   * 调整扬声器音量
   * 音量值会被归一化到 0-1 范围，并同步到所有远端参与者
   *
   * @param volume - 目标音量值（会被自动归一化到 0-1）
   */
  function setPlaybackVolume(volume: number) {
    const normalized = Math.max(0, Math.min(1, volume));
    persistSharedAudioState({
      playbackVolume: normalized,
      isSpeakerMuted: normalized === 0,
    });
    applyPlaybackVolume(normalized);
  }

  /**
   * 切换扬声器静音
   * 静音时记录当前音量，取消静音时恢复到之前的音量
   */
  function toggleSpeakerMute() {
    if (isSpeakerMuted.value) {
      // 取消静音：恢复到之前记录的音量
      setPlaybackVolume(lastAudiblePlaybackVolume || 1);
      return;
    }
    // 静音前记录当前音量
    if (playbackVolume.value > 0) {
      lastAudiblePlaybackVolume = playbackVolume.value;
    }
    setPlaybackVolume(0);
  }

  // ========================= 参与者管理 =========================

  /**
   * 更新参与者列表
   * 合并本地参与者和远端参与者，更新发言状态和静音状态
   * 由定时器和各种房间事件触发
   */
  function updateParticipantsList() {
    if (!room.value) {
      participants.value = [];
      return;
    }

    const list: ParticipantInfo[] = [];

    // 添加本地参与者
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

    // 添加远端参与者
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
   * 将播放音量同步到远端参与者
   * LiveKit 的 setVolume API 控制远端音频的播放音量
   *
   * @param volume - 音量值（0-1）
   * @param participant - 指定参与者，不传则应用到所有远端参与者
   */
  function applyPlaybackVolume(
    volume: number,
    participant?: RemoteParticipant
  ) {
    const targets = participant
      ? [participant]
      : [...(room.value?.remoteParticipants.values() || [])];
    targets.forEach((item) => {
      item.setVolume(volume);
    });
  }

  // ========================= 工具方法 =========================

  /**
   * 根据 identity 获取参与者信息
   *
   * @param identity - 参与者唯一标识
   * @returns 参与者信息，未找到返回 undefined
   */
  function getParticipantInfo(identity: string): ParticipantInfo | undefined {
    return participants.value.find((p) => p.identity === identity);
  }

  /**
   * 从参与者 identity 中解析用户 ID
   * identity 格式约定为 "user-{userId}"，如 "user-123"
   *
   * @param identity - 参与者唯一标识
   * @returns 用户 ID，解析失败返回 null
   */
  function parseUserIdFromIdentity(identity: string): number | null {
    if (identity.startsWith('user-')) {
      const userId = parseInt(identity.substring(5), 10);
      return isNaN(userId) ? null : userId;
    }
    return null;
  }

  // ========================= 跨窗口事件监听 =========================

  /**
   * 处理 localStorage 变更事件
   * 当其他窗口修改了音频状态时，同步到当前窗口
   */
  function handleStorageChange(event: StorageEvent) {
    // 只处理 localStorage 的变更
    if (event.storageArea !== localStorage) {
      return;
    }
    // 只关注音频状态的 key
    if (event.key && event.key !== 'xiaohe:meeting:audio-state') {
      return;
    }
    applySharedAudioStateFromStorage();
  }

  // 注册 storage 事件监听，实现跨窗口状态同步
  window.addEventListener('storage', handleStorageChange);

  // 在组件卸载时清理资源
  if (getCurrentInstance()) {
    onUnmounted(() => {
      window.removeEventListener('storage', handleStorageChange);
      leaveRoom();
    });
  }

  // ========================= 返回公共 API =========================

  return {
    // 状态
    /** LiveKit Room 实例 */
    room,
    /** 当前连接状态 */
    connectionState,
    /** 所有参与者列表 */
    participants,
    /** 当前活跃发言人列表 */
    activeSpeakers,
    /** 本地麦克风是否开启 */
    isMicEnabled,
    /** 扬声器是否静音 */
    isSpeakerMuted,
    /** 扬声器播放音量 */
    playbackVolume,
    /** 本地参与者实例 */
    localParticipant,
    /** 当前本地屏幕共享轨 */
    localScreenTrack,
    /** 当前远端屏幕共享信息 */
    remoteScreenShare,

    // 方法
    /** 连接房间 */
    joinRoom,
    /** 离开房间 */
    leaveRoom,
    /** 页面关闭前同步释放本地轨道 */
    prepareForPageUnload,
    /** 切换麦克风 */
    toggleMic,
    /** 设置播放音量 */
    setPlaybackVolume,
    /** 切换扬声器静音 */
    toggleSpeakerMute,
    /** 获取参与者信息 */
    getParticipantInfo,
    /** 从 identity 解析用户 ID */
    parseUserIdFromIdentity,
    /** 请求播放权限（应在组件 mounted 时调用） */
    requestPlaybackPermission,
    /** 开始本地屏幕共享 */
    startScreenShare,
    /** 停止本地屏幕共享 */
    stopScreenShare,
  };
}
