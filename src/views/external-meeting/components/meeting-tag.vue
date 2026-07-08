<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMeetingStore } from '@/stores';
import type { CmsMeetingDetail } from '@/api/modules/meeting.type';

const { t } = useI18n();
const meetingStore = useMeetingStore();

const props = withDefaults(
  defineProps<{
    // ---- 简单模式：手动传文案 + 颜色 ----
    text?: string;
    color?: string;
    bgc?: string;
    status?: 'success' | 'info' | 'warning' | 'error';

    // ---- 智能模式：传会议数据自动推导 ----
    meetingDetail?: CmsMeetingDetail | null;
    waitingMicPermission?: boolean;
    isRtcOwnedByOtherTab?: boolean;
  }>(),
  {
    text: '',
    color: '',
    bgc: '',
    status: 'info',
    meetingDetail: null,
    waitingMicPermission: false,
    isRtcOwnedByOtherTab: false,
  }
);

// ==================== 智能模式 ====================

const isSmartMode = computed(() => !!props.meetingDetail);

const sessionStatus = computed(() => props.meetingDetail?.session.status);

const smartMainText = computed(() => {
  if (meetingStore.isActiveStatus(sessionStatus.value)) {
    return t('meeting.statusActive');
  }
  if (sessionStatus.value === 'CLOSING') {
    return t('meeting.statusClosing');
  }
  return t('meeting.statusEnded');
});

const smartMainStatus = computed<'success' | 'info' | 'warning' | 'error'>(
  () => {
    if (meetingStore.isActiveStatus(sessionStatus.value)) {
      return 'success';
    }
    if (meetingStore.isTerminalStatus(sessionStatus.value)) {
      return 'info';
    }
    return 'warning';
  }
);

const showAudioInOtherWindow = computed(
  () => sessionStatus.value === 'ACTIVE' && props.isRtcOwnedByOtherTab
);

// ==================== 样式工具 ====================

const statusColorMap: Record<string, string> = {
  success: '#10b981',
  info: '#6b7280',
  warning: '#f59e0b',
  error: '#ef4444',
};

const statusBgMap: Record<string, string> = {
  success: '#f0fdf4',
  info: '#f9fafb',
  warning: '#fffbeb',
  error: '#fef2f2',
};

function tagStyle(s: 'success' | 'info' | 'warning' | 'error') {
  const dotColor = statusColorMap[s] || statusColorMap.info;
  const textColor = props.color || statusColorMap[s] || statusColorMap.info;
  const bgColor = props.bgc || statusBgMap[s] || statusBgMap.info;

  return {
    color: textColor,
    backgroundColor: bgColor,
    '--meeting-tag-dot-color': dotColor,
  };
}
</script>

<template>
  <!-- ==================== 智能模式 ==================== -->
  <span v-if="isSmartMode" class="meeting-tags">
    <span class="meeting-tag" :class="`meeting-tag--${smartMainStatus}`">
      <span>{{ smartMainText }}</span>
    </span>

    <span v-if="waitingMicPermission" class="meeting-tag meeting-tag--warning">
      <span>{{ t('meeting.waitingMicPermission') }}</span>
    </span>

    <span v-if="showAudioInOtherWindow" class="meeting-tag meeting-tag--info">
      <span>{{ t('meeting.audioInOtherWindow') }}</span>
    </span>
  </span>

  <!-- ==================== 简单模式 ==================== -->
  <span
    v-else-if="text"
    class="meeting-tag meeting-tag--custom"
    :style="tagStyle(status)"
  >
    <span>
      <slot>{{ text }}</slot>
    </span>
  </span>
</template>

<style lang="scss" scoped>
/* ==================== 容器 ==================== */
.meeting-tags {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* ==================== 基础标签 ==================== */
.meeting-tag {
  width: 65px;
  height: 28px;
  display: flex;
  padding: 8px;
  align-items: center;
  gap: 6px;
  border-radius: 100px;
  font-family: Inter;
  font-size: 12px;
  font-weight: 500;
  font-style: normal;
  text-decoration-line: none;
  line-height: normal;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  & span::before {
    width: 7px;
    height: 7px;
    content: '';
    display: inline-block;
    background: var(--meeting-tag-dot-color);
    border-radius: 3.5px;
    margin-right: 5px;
    flex-shrink: 0;
  }
}

/* ==================== 预设状态 ==================== */
.meeting-tag--success {
  color: #10b981;
  background-color: #f0fdf4;
  --meeting-tag-dot-color: #10b981;
}

.meeting-tag--info {
  color: #6b7280;
  background-color: #f9fafb;
  --meeting-tag-dot-color: #9ca3af;
}

.meeting-tag--warning {
  color: #f59e0b;
  background-color: #fffbeb;
  --meeting-tag-dot-color: #f59e0b;
}

.meeting-tag--error {
  color: #ef4444;
  background-color: #fef2f2;
  --meeting-tag-dot-color: #ef4444;
}

/* 自定义模式颜色由 :style 注入，无需额外 CSS */
</style>
