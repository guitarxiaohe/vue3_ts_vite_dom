import { computed, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMeetingStore, usePresenceStore, useUserStore } from '@/stores';
import type { ParticipantInfo } from '@/composables/use-livekit-room';
import type { CmsMeetingParticipant } from '@/api/modules/meeting.type';

/******************************** 类型定义 ********************************/

interface UseMeetingParticipantsOptions {
  /** 当前正在发言的用户 ID（用于高亮脉冲效果） */
  activeSpeakerUserId: Ref<string | null>;
  /** 新加入会议的用户 ID（用于加入高亮动画） */
  joinedHighlightUserId: Ref<string | null>;
  /** RTC 房间内实时参与者列表 */
  rtcParticipants: Ref<ParticipantInfo[]>;
}

/******************************** 参会者逻辑 ********************************/

/**
 * 会议参会者管理 Composable
 *
 * 封装参会者列表的展示逻辑，包括：
 * - 参会者过滤（排除已拒绝的参会者）
 * - RTC 状态关联（是否进入房间、是否正在发言、麦克风是否静音）
 * - 在线状态判断（通过 Presence Store）
 * - 参会者状态标签（已连接 / 等待中 / 已拒绝 / 缺席）
 * - 邀请弹窗可选成员列表
 * - 主持人权限判断（是否可邀请、是否可结束会议）
 *
 * @param options - 外部传入的响应式状态（发言用户 ID、新加入用户 ID、RTC 参与者列表）
 * @returns 参会者相关的响应式数据和工具方法
 */
export function useMeetingParticipants(options: UseMeetingParticipantsOptions) {
  const { activeSpeakerUserId, joinedHighlightUserId, rtcParticipants } =
    options;

  const { t } = useI18n();
  const meetingStore = useMeetingStore();
  const presenceStore = usePresenceStore();
  const userStore = useUserStore();

  /******************************** 基础计算属性 ********************************/

  /** 当前会议详情（来自 Store） */
  const meetingDetail = computed(() => meetingStore.meetingDetail);
  /** 当前登录用户信息 */
  const currentUser = computed(() => userStore.userInfo);
  /** 当前登录用户的标准化 ID 字符串 */
  const currentUserId = computed(() =>
    meetingStore.toNumericId(currentUser.value?.userId)
  );
  /** 会议是否已终止（CLOSED_SUCCESS / CLOSE_FAILED / ENDED） */
  const isMeetingEnded = computed(() =>
    meetingStore.isTerminalStatus(meetingDetail.value?.session.status)
  );

  /** 当前用户是否为主持人（比较 hostUserId 与当前用户 ID） */
  const isHost = computed(
    () =>
      !!meetingDetail.value &&
      meetingStore.toNumericId(meetingDetail.value.session.hostUserId) ===
        currentUserId.value
  );

  /******************************** 参会者过滤 ********************************/

  /**
   * 会中实际展示的参会人列表
   * 排除邀请状态为 DECLINED（已拒绝）的参会者
   */
  const visibleMeetingParticipants = computed(() =>
    (meetingDetail.value?.participants ?? []).filter(
      (participant: CmsMeetingParticipant) =>
        participant.inviteStatus !== 'DECLINED'
    )
  );

  /******************************** RTC 实时信息查询 ********************************/

  /**
   * 根据用户 ID 获取该参会人在 RTC 房间中的实时信息
   * LiveKit 中的 participant identity 格式为 "user-{userId}"
   *
   * @param userId - 用户 ID
   * @returns RTC 参与者信息，未找到则返回 undefined
   */
  function getParticipantRtcInfo(userId: string) {
    const identity = `user-${userId}`;
    return rtcParticipants.value.find(
      (participant) => participant.identity === identity
    );
  }

  /**
   * 判断参会人是否已进入 RTC 房间
   *
   * @param userId - 用户 ID
   * @returns 是否在 RTC 房间中
   */
  function isParticipantInRtc(userId: string) {
    return !!getParticipantRtcInfo(userId);
  }

  /**
   * 判断参会人是否正在发言（基于 LiveKit 的活跃发言人检测）
   *
   * @param userId - 用户 ID
   * @returns 是否正在发言
   */
  function isParticipantSpeaking(userId: string) {
    return !!getParticipantRtcInfo(userId)?.isSpeaking;
  }

  /**
   * 判断参会人的麦克风是否静音
   * 未进入 RTC 房间的参会人默认视为静音
   *
   * @param userId - 用户 ID
   * @returns 麦克风是否静音
   */
  function isParticipantMicMuted(userId: string) {
    return getParticipantRtcInfo(userId)?.isMuted ?? true;
  }

  /******************************** 在线与状态判断 ********************************/

  /**
   * 判断参会人是否已成功连接（邀请已接受 且 在线）
   *
   * @param participant - 包含 inviteStatus 和 userId 的参会人对象
   * @returns 是否已连接
   */
  function isParticipantConnected(participant: {
    inviteStatus: string;
    userId: string;
  }) {
    return (
      participant.inviteStatus === 'ACCEPTED' &&
      presenceStore.isUserOnline(participant.userId)
    );
  }

  /**
   * 计算参会人状态标签的颜色类型（用于 UI 渲染）
   * - DECLINED → danger（红色）
   * - 未接受 → warning（橙色）
   * - 已接受且在线 → success（绿色）
   * - 已接受但离线 → info（蓝色）
   *
   * @param participant - 参会人对象
   * @returns Element UI 状态类型
   */
  function participantMeetingStatusType(participant: {
    inviteStatus: string;
    userId: string;
  }) {
    if (participant.inviteStatus === 'DECLINED') {
      return 'danger';
    }
    if (participant.inviteStatus !== 'ACCEPTED') {
      return 'warning';
    }
    return isParticipantConnected(participant) ? 'success' : 'info';
  }

  /**
   * 计算参会人状态文案（国际化）
   * - DECLINED → 已拒绝
   * - 未接受 → 待响应
   * - 已接受且在线 → 已连接
   * - 已接受但离线 → 连接中
   *
   * @param participant - 参会人对象
   * @returns 状态描述文本
   */
  function participantMeetingStatusText(participant: {
    inviteStatus: string;
    userId: string;
  }) {
    if (participant.inviteStatus === 'DECLINED') {
      return t('meeting.participantDeclined');
    }
    if (participant.inviteStatus !== 'ACCEPTED') {
      return t('meeting.participantPending');
    }
    return isParticipantConnected(participant)
      ? t('meeting.participantConnected')
      : t('meeting.participantConnecting');
  }

  /**
   * 判断参会人是否处于等待态（已接受但未连接，且未被拒绝）
   * 会议已结束时始终返回 false
   *
   * @param participant - 参会人对象
   * @returns 是否处于等待态
   */
  function isParticipantWaiting(participant: {
    inviteStatus: string;
    userId: string;
  }) {
    if (isMeetingEnded.value) {
      return false;
    }
    if (participant.inviteStatus === 'DECLINED') {
      return false;
    }
    return !isParticipantConnected(participant);
  }

  /**
   * 判断参会人是否为缺席状态
   * 仅当会议已结束 且 参会人既未接受也未拒绝时返回 true
   *
   * @param participant - 参会人对象（至少包含 inviteStatus）
   * @returns 是否缺席
   */
  function isParticipantAbsent(participant: { inviteStatus: string }) {
    return (
      isMeetingEnded.value &&
      participant.inviteStatus !== 'ACCEPTED' &&
      participant.inviteStatus !== 'DECLINED'
    );
  }

  /******************************** 统计与展示数据 ********************************/

  /** 当前已进入 RTC 房间的参会人数 */
  const participantRtcCount = computed(
    () =>
      visibleMeetingParticipants.value.filter(
        (participant: CmsMeetingParticipant) =>
          isParticipantInRtc(participant.userId)
      ).length
  );

  /**
   * 参与者面板展示项列表
   * 将 CmsMeetingParticipant 原始数据转换为 MeetingParticipantGrid 组件所需格式
   * 包含：基础信息、RTC 状态、在线状态、互动气泡、高亮状态等
   */
  const participantDisplayItems = computed(() =>
    visibleMeetingParticipants.value.map(
      (participant: CmsMeetingParticipant) => ({
        id: participant.id,
        userId: participant.userId,
        name: participant.nickName || participant.userName,
        sex: participant.sex,
        deptName: participant.deptName,
        deptId: participant.deptId,
        avatar: participant.avatar,
        subtitle: participant.userName,
        isHost: participant.isHost === 1,
        statusText: participantMeetingStatusText(participant),
        statusType: participantMeetingStatusType(participant),
        isActive:
          activeSpeakerUserId.value !== null &&
          participant.userId === activeSpeakerUserId.value,
        isSpeaking: isParticipantSpeaking(participant.userId),
        isJoined:
          joinedHighlightUserId.value !== null &&
          participant.userId === joinedHighlightUserId.value,
        isWaiting: isParticipantWaiting(participant),
        isAbsent: isParticipantAbsent(participant),
        isInRtc: isParticipantInRtc(participant.userId),
        isMicMuted:
          isParticipantInRtc(participant.userId) &&
          isParticipantMicMuted(participant.userId),
        interactionText:
          meetingStore.interactionBubbles[participant.userId]?.content ?? '',
        interactionType:
          meetingStore.interactionBubbles[participant.userId]
            ?.interactionType ?? '',
      })
    )
  );

  /******************************** 权限判断 ********************************/

  /**
   * 主持人是否可继续邀请成员
   * 条件：当前用户为主持人 且 会议处于 ACTIVE 状态
   */
  const canInviteParticipants = computed(
    () => isHost.value && meetingDetail.value?.session.status === 'ACTIVE'
  );

  /**
   * 邀请弹窗中的可选成员列表
   * 从可选用户列表中排除：
   * - 已接受或待响应的参会者（避免重复邀请）
   * - 当前用户自己
   */
  const inviteSelectableUsers = computed(() => {
    if (!meetingDetail.value) {
      return [];
    }

    const blockedUserIds = new Set(
      meetingDetail.value.participants
        .filter(
          (item: CmsMeetingParticipant) =>
            item.inviteStatus === 'ACCEPTED' || item.inviteStatus === 'PENDING'
        )
        .map((item) => item.userId)
    );
    blockedUserIds.add(currentUserId.value);

    return meetingStore.selectableUsers.filter(
      (item) => !blockedUserIds.has(String(item.userId ?? ''))
    );
  });

  /**
   * 当前用户是否可结束会议
   * 条件：会议处于 ACTIVE 状态 且（当前用户是会议主持人 或 是参会者中的主持人）
   */
  const canStopMeeting = computed(
    () =>
      meetingDetail.value?.session.status === 'ACTIVE' &&
      (meetingStore.toNumericId(meetingDetail.value?.session.hostUserId) ===
        currentUserId.value ||
        meetingDetail.value?.participants.some(
          (item: CmsMeetingParticipant) =>
            meetingStore.toNumericId(item.userId) === currentUserId.value &&
            item.isHost === 1
        ))
  );

  return {
    isHost,
    visibleMeetingParticipants,
    participantRtcCount,
    participantDisplayItems,
    canInviteParticipants,
    inviteSelectableUsers,
    canStopMeeting,
  };
}
