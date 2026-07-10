<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { LoaderCircle, MicOff } from 'lucide-vue-next';
import UserAvatarInfo from '@/components/user-avatar-info/index.vue';

interface MeetingParticipantGridItem {
  id: string;
  userId: string;
  name: string;
  /** 头像 */
  avatar: string;
  /** 性别 */
  sex: string;
  /** 部门名称 */
  deptName: string;
  /** 部门ID */
  deptId: string;
  subtitle: string;
  isHost: boolean;
  statusText: string;
  statusType: string;
  isActive: boolean;
  isSpeaking: boolean;
  isJoined: boolean;
  isWaiting: boolean;
  isAbsent: boolean;
  isInRtc: boolean;
  isMicMuted: boolean;
  avatarColor: string;
  interactionText: string;
  interactionType: string;
}

const props = defineProps<{
  items: MeetingParticipantGridItem[];
  hostLabel: string;
}>();

const participantCount = computed(() => props.items.length);
const gridColumns = computed(() =>
  Math.min(Math.max(participantCount.value, 1), 4)
);
const sizeMode = computed<'avatar' | 'compact' | 'card'>(() => {
  if (participantCount.value > 12) {
    return 'avatar';
  }
  if (participantCount.value > 6) {
    return 'compact';
  }
  return 'card';
});
const avatarSize = computed(() => {
  if (sizeMode.value === 'avatar') {
    return 34;
  }
  if (sizeMode.value === 'compact') {
    return 36;
  }
  return 44;
});

const emit = defineEmits<{
  videoReady: [refs: Record<string, HTMLDivElement | null>];
}>();

// 摄像头视频容器引用
const videoRefs = ref<Record<string, HTMLDivElement | null>>({});

// 拿到所有 dom
function setVideoRef(userId: string, el: HTMLDivElement | null) {
  videoRefs.value[userId] = el;
}

onMounted(() => {
  emit('videoReady', videoRefs.value);
});

onBeforeUnmount(() => {
  emit('videoReady', {});
});
</script>

<template>
  <div
    :class="[
      'meeting-participant-grid',
      `meeting-participant-grid--cols-${gridColumns}`,
      `meeting-participant-grid--${sizeMode}`,
    ]"
  >
    <div
      v-for="item in items"
      :key="item.id"
      class="meeting-participant-tile"
      :class="{
        'meeting-participant-tile--active': item.isActive,
        'meeting-participant-tile--speaking': item.isSpeaking,
        'meeting-participant-tile--joined': item.isJoined,
        'meeting-participant-tile--absent': item.isAbsent,
        'meeting-participant-tile--waiting': item.isWaiting,
        'meeting-participant-tile--avatar': sizeMode === 'avatar',
        'meeting-participant-tile--compact': sizeMode === 'compact',
        'meeting-participant-tile--card': sizeMode === 'card',
      }"
      :style="{ '--meeting-participant-color': item.avatarColor }"
    >
      <div
        class="meeting-participant-avatar"
        :ref="(el) => setVideoRef(item.userId, el as HTMLDivElement | null)"
      >
        <UserAvatarInfo
          :user-id="item.userId"
          :nick-name="item.name"
          :name="item.name"
          :src="item.avatar"
          :sex="item.sex"
          :dept-name="item.deptName"
          :subtitle="''"
          :size="avatarSize"
          :enable-drawer="true"
          :avatar="{ style: { backgroundColor: item.avatarColor } }"
        />

        <div v-if="item.isHost" class="meeting-participant-tile__host-chip">
          {{ hostLabel }}
        </div>
        <div class="meeting-participant-tile__name-chip">
          {{ item.name }}
        </div>
        <transition name="meeting-participant-bubble">
          <div
            v-if="item.interactionText"
            class="meeting-participant-tile__bubble"
            :class="`is-${item.interactionType.toLowerCase()}`"
          >
            {{ item.interactionText }}
          </div>
        </transition>
        <div v-if="item.isWaiting" class="meeting-participant-avatar__loading">
          <el-icon class="is-loading">
            <LoaderCircle />
          </el-icon>
        </div>
        <div
          v-if="item.isInRtc && item.isMicMuted"
          class="meeting-participant-avatar__mute"
        >
          <el-icon :size="12">
            <MicOff />
          </el-icon>
        </div>
      </div>

      <div
        v-if="sizeMode !== 'avatar' && item.statusType !== 'success'"
        class="meeting-participant-tile__status-chip"
        :class="`is-${item.statusType}`"
      >
        {{ item.statusText }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.meeting-participant-grid {
  display: grid;
  width: min(100%, 864px);
  gap: 12px;
  justify-items: stretch;
  align-items: stretch;
}

.meeting-participant-grid--cols-1 {
  grid-template-columns: minmax(0, 1fr);
}

.meeting-participant-grid--cols-1 .meeting-participant-tile {
  max-width: min(420px, 100%);
}

.meeting-participant-grid--cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.meeting-participant-grid--cols-2 .meeting-participant-tile {
  max-width: min(320px, 100%);
}

.meeting-participant-grid--cols-3,
.meeting-participant-grid--cols-4 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.meeting-participant-grid--cols-4 .meeting-participant-tile {
  max-width: none;
}

.meeting-participant-tile {
  position: relative;
  width: 100%;
  max-width: none;
  min-width: 0;
  overflow: hidden;
  border-radius: 8px;
  border: 0;
  background: color-mix(in srgb, var(--meeting-participant-color) 22%, #111318);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.meeting-participant-tile--card {
  aspect-ratio: 1.96;
  min-height: 112px;
}

.meeting-participant-tile--compact {
  height: clamp(96px, 11vw, 144px);
}

.meeting-participant-tile--avatar {
  min-height: 76px;
  max-height: 76px;
  border-radius: 8px;
}

.meeting-participant-tile--active {
  border-color: rgba(94, 106, 210, 0.45);
  box-shadow:
    0 14px 30px rgba(94, 106, 210, 0.14),
    0 0 0 3px rgba(94, 106, 210, 0.1);
  transform: translateY(-1px);
}

.meeting-participant-tile--speaking {
  border-color: rgba(34, 197, 94, 0.45);
  box-shadow:
    0 14px 30px rgba(34, 197, 94, 0.18),
    0 0 0 3px rgba(34, 197, 94, 0.12);
}

.meeting-participant-tile--joined {
  border-color: rgba(34, 197, 94, 0.4);
  box-shadow: 0 14px 28px rgba(34, 197, 94, 0.16);
}

.meeting-participant-tile--waiting {
  filter: saturate(0.92);
}

.meeting-participant-tile--absent {
  border-color: rgba(239, 68, 68, 0.28);
  box-shadow: 0 12px 24px rgba(239, 68, 68, 0.08);
}

.meeting-participant-avatar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: inherit;
}

.meeting-participant-avatar__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
  background: rgba(255, 255, 255, 0.5);
  color: #f59e0b;
  backdrop-filter: blur(2px);
}

.meeting-participant-avatar__mute {
  position: absolute;
  right: 10px;
  top: 10px;
  z-index: 2;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ef4444;
  color: #fff;
  border: 2px solid #fff;
  box-shadow: 0 6px 12px rgba(239, 68, 68, 0.22);
}

.meeting-participant-tile__host-chip,
.meeting-participant-tile__status-chip,
.meeting-participant-tile__bubble {
  position: absolute;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  max-width: calc(100% - 24px);
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  color: #0f172a;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meeting-participant-tile__host-chip {
  left: 10px;
  top: 10px;
  font-size: 11px;
  font-weight: 700;
  color: #b91c1c;
}

.meeting-participant-tile__name-chip {
  position: absolute;
  left: 50%;
  bottom: calc(50% - 38px);
  z-index: 2;
  max-width: calc(100% - 24px);
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transform: translateX(-50%);
}

.meeting-participant-tile__status-chip {
  right: 10px;
  bottom: 10px;
  font-size: 11px;
  color: #475569;
}

.meeting-participant-tile__bubble {
  top: 50%;
  left: 50%;
  max-width: min(78%, 240px);
  padding: 8px 14px;
  border-radius: 8px;
  transform: translate(-50%, -50%);
  background: rgba(15, 23, 42, 0.78);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
  text-align: center;
  white-space: normal;
  word-break: break-word;
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.2);
}

.meeting-participant-tile__bubble.is-emoji {
  font-size: 22px;
  line-height: 1;
}

.meeting-participant-tile__bubble.is-hand {
  background: rgba(14, 165, 233, 0.86);
}

.meeting-participant-bubble-enter-active,
.meeting-participant-bubble-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.meeting-participant-bubble-enter-from,
.meeting-participant-bubble-leave-to {
  opacity: 0;
  transform: translate(-50%, calc(-50% + 10px)) scale(0.96);
}

.meeting-participant-tile__status-chip.is-success {
  color: #15803d;
}

.meeting-participant-tile__status-chip.is-warning {
  color: #b45309;
}

.meeting-participant-tile__status-chip.is-danger {
  color: #b91c1c;
}

.meeting-participant-grid--avatar {
  width: min(100%, 720px);
  grid-template-columns: repeat(auto-fit, minmax(58px, 1fr));
  gap: 12px;
  place-items: center;
}

.meeting-participant-grid--avatar .meeting-participant-tile {
  width: 58px;
  height: 72px;
  min-height: 72px;
  max-height: 72px;
  border-radius: 0;
  background: transparent;
  overflow: visible;
}

.meeting-participant-grid--avatar
  .meeting-participant-tile:deep(.user-avatar-info) {
  justify-content: center;
}

.meeting-participant-grid--avatar
  .meeting-participant-tile:deep(.user-avatar-info__meta) {
  display: none;
}

.meeting-participant-grid--avatar
  .meeting-participant-tile:deep(.user-avatar-info__avatar-wrap) {
  margin: 0 auto;
}

.meeting-participant-tile:deep(.user-avatar-info-root) {
  display: block;
  width: 100%;
  height: 100%;
}

.meeting-participant-tile:deep(.user-avatar-info) {
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
}

.meeting-participant-tile:deep(.user-avatar-info__avatar-wrap) {
  width: auto;
  height: auto;
}

.meeting-participant-tile:deep(.user-avatar-info__avatar) {
  width: 44px !important;
  height: 44px !important;
  border-radius: 50% !important;
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  background: var(--meeting-participant-color) !important;
}

.meeting-participant-tile--compact:deep(.user-avatar-info__avatar) {
  width: 38px !important;
  height: 38px !important;
  font-size: 16px;
}

.meeting-participant-tile--avatar:deep(.user-avatar-info__avatar) {
  width: 40px !important;
  height: 40px !important;
  border-radius: 50% !important;
  font-size: 16px;
}

.meeting-participant-tile--avatar .meeting-participant-tile__name-chip {
  bottom: 0;
  max-width: 58px;
  color: #ffffff;
  font-size: 11px;
}

.meeting-participant-tile--avatar .meeting-participant-tile__host-chip,
.meeting-participant-tile--avatar .meeting-participant-tile__status-chip,
.meeting-participant-tile--avatar .meeting-participant-avatar__mute,
.meeting-participant-tile--avatar .meeting-participant-avatar__loading {
  display: none;
}

.meeting-participant-tile:deep(.user-avatar-info__meta),
.meeting-participant-tile:deep(.user-avatar-info__gender-badge),
.meeting-participant-tile:deep(.user-avatar-info__presence-badge) {
  display: none;
}

@media (max-width: 1440px) {
  .meeting-participant-grid--cols-4 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .meeting-participant-grid {
    width: 100%;
    gap: 10px;
  }

  .meeting-participant-grid--cols-3,
  .meeting-participant-grid--cols-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .meeting-participant-tile--card,
  .meeting-participant-tile--compact {
    aspect-ratio: 1.58;
    min-height: 68px;
  }

  .meeting-participant-tile--compact {
    height: clamp(64px, 16vw, 82px);
  }

  .meeting-participant-tile:deep(.user-avatar-info__avatar) {
    width: 34px !important;
    height: 34px !important;
    font-size: 17px;
  }

  .meeting-participant-tile--compact .meeting-participant-tile__name-chip {
    bottom: calc(50% - 31px);
    font-size: 12px;
  }

  .meeting-participant-tile--compact .meeting-participant-tile__status-chip {
    right: 6px;
    bottom: 6px;
    padding: 3px 7px;
    font-size: 10px;
  }

  .meeting-participant-tile--avatar:deep(.user-avatar-info__avatar) {
    width: 34px !important;
    height: 34px !important;
    font-size: 14px;
  }

  .meeting-participant-grid--avatar {
    grid-template-columns: repeat(auto-fit, minmax(48px, 1fr));
    gap: 10px;
  }

  .meeting-participant-grid--avatar .meeting-participant-tile {
    width: 48px;
    height: 62px;
    min-height: 62px;
    max-height: 62px;
  }

  .meeting-participant-tile--avatar .meeting-participant-tile__name-chip {
    max-width: 48px;
    font-size: 10px;
  }
}

@media (max-height: 520px) {
  .meeting-participant-grid {
    width: min(100%, 620px);
    gap: 8px;
  }

  .meeting-participant-tile--card,
  .meeting-participant-tile--compact {
    min-height: 58px;
    height: clamp(54px, 18vh, 72px);
  }

  .meeting-participant-tile:deep(.user-avatar-info__avatar) {
    width: 30px !important;
    height: 30px !important;
    font-size: 13px;
  }

  .meeting-participant-tile__host-chip {
    left: 6px;
    top: 6px;
    padding: 2px 7px;
    font-size: 10px;
  }

  .meeting-participant-tile__name-chip {
    bottom: calc(50% - 27px);
    font-size: 11px;
  }

  .meeting-participant-tile__status-chip {
    right: 6px;
    bottom: 6px;
    padding: 2px 7px;
    font-size: 10px;
  }

  .meeting-participant-avatar__mute {
    right: 6px;
    top: 6px;
    width: 20px;
    height: 20px;
  }
}

@media (max-width: 960px) {
  .meeting-participant-grid--cols-2,
  .meeting-participant-grid--cols-3,
  .meeting-participant-grid--cols-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
