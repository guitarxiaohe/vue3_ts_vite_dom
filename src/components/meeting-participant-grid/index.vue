<script setup lang="ts">
import { computed } from 'vue';
import { LoaderCircle, MicOff } from 'lucide-vue-next';
import UserAvatarInfo from '@/components/user-avatar-info/index.vue';

interface MeetingParticipantGridItem {
  id: number;
  userId: number;
  name: string;
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
  if (participantCount.value > 28) {
    return 'avatar';
  }
  if (participantCount.value > 12) {
    return 'compact';
  }
  return 'card';
});
const avatarSize = computed(() => {
  if (sizeMode.value === 'avatar') {
    return 42;
  }
  if (sizeMode.value === 'compact') {
    return 52;
  }
  return 68;
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
    >
      <div class="meeting-participant-avatar">
        <UserAvatarInfo
          :user-id="item.userId"
          :nick-name="item.name"
          :name="item.name"
          :subtitle="''"
          :size="avatarSize"
          :enable-drawer="true"
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
        v-if="sizeMode !== 'avatar'"
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
  gap: 16px;
}

.meeting-participant-grid--cols-1 {
  grid-template-columns: minmax(0, 1fr);
}

.meeting-participant-grid--cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.meeting-participant-grid--cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.meeting-participant-grid--cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.meeting-participant-tile {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid rgba(191, 219, 254, 0.6);
  background: linear-gradient(135deg, #dbeafe, #e9d5ff);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.meeting-participant-tile--card {
  min-height: 248px;
}

.meeting-participant-tile--compact {
  min-height: 188px;
}

.meeting-participant-tile--avatar {
  min-height: 112px;
  border-radius: 18px;
}

.meeting-participant-tile--active {
  border-color: rgba(14, 165, 233, 0.45);
  box-shadow:
    0 18px 38px rgba(14, 165, 233, 0.18),
    0 0 0 4px rgba(14, 165, 233, 0.1);
  transform: translateY(-1px);
}

.meeting-participant-tile--speaking {
  border-color: rgba(34, 197, 94, 0.45);
  box-shadow:
    0 18px 38px rgba(34, 197, 94, 0.2),
    0 0 0 4px rgba(34, 197, 94, 0.12);
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
  right: 12px;
  top: 12px;
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
.meeting-participant-tile__name-chip,
.meeting-participant-tile__status-chip,
.meeting-participant-tile__bubble {
  position: absolute;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  max-width: calc(100% - 24px);
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  color: #0f172a;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meeting-participant-tile__host-chip {
  left: 12px;
  top: 12px;
  font-size: 11px;
  font-weight: 700;
  color: #b91c1c;
}

.meeting-participant-tile__name-chip {
  left: 12px;
  bottom: 12px;
  font-size: 12px;
  font-weight: 700;
}

.meeting-participant-tile__status-chip {
  right: 12px;
  bottom: 12px;
  font-size: 11px;
  color: #475569;
}

.meeting-participant-tile__bubble {
  top: 50%;
  left: 50%;
  max-width: min(78%, 240px);
  padding: 8px 14px;
  border-radius: 18px;
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
  gap: 12px;
}

.meeting-participant-grid--avatar .meeting-participant-tile {
  min-height: 112px;
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
}

.meeting-participant-tile:deep(.user-avatar-info__avatar-wrap) {
  width: 100%;
  height: 100%;
}

.meeting-participant-tile:deep(.user-avatar-info__avatar) {
  width: 100% !important;
  height: 100% !important;
  border-radius: inherit !important;
  font-size: 40px;
  background: linear-gradient(135deg, #c7d2fe, #bfdbfe) !important;
}

.meeting-participant-tile--compact:deep(.user-avatar-info__avatar) {
  font-size: 32px;
}

.meeting-participant-tile--avatar:deep(.user-avatar-info__avatar) {
  border-radius: 18px !important;
  font-size: 24px;
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

@media (max-width: 960px) {
  .meeting-participant-grid--cols-2,
  .meeting-participant-grid--cols-3,
  .meeting-participant-grid--cols-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
