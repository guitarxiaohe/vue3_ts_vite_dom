<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

export interface MeetingAvatarParticipant {
  avatar?: string | null;
  nickName?: string | null;
  userName?: string | null;
}

const props = withDefaults(
  defineProps<{
    participants?: MeetingAvatarParticipant[];
    maxVisible?: number;
  }>(),
  {
    participants: () => [],
    maxVisible: 3,
  }
);

const { t } = useI18n();

const visibleList = computed(() =>
  props.participants.slice(0, props.maxVisible)
);

const overflowCount = computed(() =>
  Math.max(0, props.participants.length - props.maxVisible)
);

function avatarChar(p: MeetingAvatarParticipant): string {
  const name = p.nickName || p.userName || '';
  return name.charAt(0) || '?';
}

// 7 种纯色头像底色
const avatarPalette = [
  '#4f46e5', // 紫蓝
  '#10b981', // 翠绿
  '#f59e0b', // 琥珀
  '#0f766e', // 青绿
  '#a855f7', // 亮紫
  '#1d4ed8', // 蓝色
];

function avatarBgColor(p: MeetingAvatarParticipant): string {
  if (p.avatar) return 'transparent';
  // 根据标识信息哈希到固定颜色，同一个人始终同色
  const seed = p.nickName || p.userName || '';
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return avatarPalette[Math.abs(hash) % avatarPalette.length];
}
</script>

<template>
  <div v-if="participants.length" class="meeting-avatar-row">
    <!-- 前 N 个头像 -->
    <div
      v-for="(p, i) in visibleList"
      :key="i"
      class="meeting-avatar-item"
      :style="{
        backgroundColor: avatarBgColor(p),
        backgroundImage: p.avatar ? `url(${p.avatar})` : undefined,
        zIndex: visibleList.length - i,
      }"
      :title="p.nickName || p.userName || ''"
    >
      <template v-if="!p.avatar">{{ avatarChar(p) }}</template>
    </div>

    <!-- +N 溢出头像 -->
    <div
      v-if="overflowCount > 0"
      class="meeting-avatar-item meeting-avatar-overflow"
      :title="t('meeting.avatarOverflowTitle', { count: overflowCount })"
    >
      +{{ overflowCount }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.meeting-avatar-row {
  display: inline-flex;
  align-items: center;
  direction: ltr;
}

.meeting-avatar-item {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border: 2px solid #fff;
  flex-shrink: 0;

  // 重叠效果：后一个叠在前一个上方
  &:not(:first-child) {
    margin-left: -8px;
  }
}

.meeting-avatar-overflow {
  background-color: #d1d5db;
  color: #6b7280;
  font-size: 10px;
  font-weight: 600;
}
</style>
