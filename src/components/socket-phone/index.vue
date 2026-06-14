<template>
  <div class="meeting-invite-popup">
    <!-------------------------- 头部：图标 + 标题 + 时间 -------------------------->
    <div class="meeting-invite-popup__header">
      <span class="meeting-invite-popup__icon">
        <el-icon :size="18"><VideoCamera /></el-icon>
      </span>
      <span class="meeting-invite-popup__title">会议邀请</span>
      <span class="meeting-invite-popup__time">{{ inviteTime }}</span>
    </div>
    <!-- 关闭弹窗 -->
    <div class="meeting-invite-popup__close" @click="emit('close')">
      <el-icon><Close /></el-icon>
    </div>
    <!-------------------------- 内容：主持人头像 + 邀请信息 -------------------------->
    <div class="meeting-invite-popup__body">
      <div class="meeting-invite-popup__avatar">
        <el-avatar :size="36" :style="{ background: avatarColor }">
          {{ avatarText }}
        </el-avatar>
      </div>
      <div class="meeting-invite-popup__info">
        <div class="meeting-invite-popup__host">
          {{ hostName }}
          <span class="meeting-invite-popup__label">邀请你加入</span>
        </div>
        <div class="meeting-invite-popup__meeting-name">
          {{ meetingTitle }}
        </div>
      </div>
    </div>

    <!-------------------------- 操作栏：拒绝 / 加入 -------------------------->
    <div class="meeting-invite-popup__actions">
      <el-button size="small" @click="handleDecline">拒绝</el-button>
      <el-button type="primary" size="small" @click="handleAccept">
        加入会议
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { VideoCamera, Close } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { CmsMeetingPendingInvite } from '@/api/modules/meeting.type';
import { useMeetingStore } from '@/stores';

/******************************** 组件入参 ********************************/

const props = defineProps<{
  /** 会议邀请数据 */
  invite: CmsMeetingPendingInvite;
}>();

const emit = defineEmits<{
  /** 关闭通知弹窗 */
  (e: 'close'): void;
}>();

/******************************** 状态 ********************************/

const meetingStore = useMeetingStore();

/** 操作防重复标记 */
const actionLoading = ref(false);

/******************************** 工具方法 ********************************/

/** 解析邀请时间字符串，兼容 "YYYY-MM-DD HH:mm:ss" 格式 */
function parseInviteDate(value: string) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return null;
  }
  const timestamp = Date.parse(normalized.replace(' ', 'T'));
  if (Number.isNaN(timestamp)) {
    return null;
  }
  return new Date(timestamp);
}

/******************************** 计算属性 ********************************/

/** 主持人名称（优先昵称） */
const hostName = computed(
  () => props.invite.hostNickName || props.invite.hostUserName || '未知'
);

/** 会议标题 */
const meetingTitle = computed(() => props.invite.title || '未命名会议');

/** 头像文字（取名字首字） */
const avatarText = computed(() => {
  const name = hostName.value;
  return name.charAt(0);
});

/** 头像背景色（根据用户名 hash 生成稳定颜色） */
const avatarColor = computed(() => {
  const colors = [
    '#409eff',
    '#67c23a',
    '#e6a23c',
    '#f56c6c',
    '#909399',
    '#9b59b6',
    '#1abc9c',
    '#3498db',
  ];
  const name = hostName.value;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
});

/** 相对时间显示（刚刚 / N分钟前 / N小时前 / 日期） */
const inviteTime = computed(() => {
  if (!props.invite.inviteSentAt) return '';
  const date = parseInviteDate(props.invite.inviteSentAt);
  if (!date) {
    return props.invite.inviteSentAt;
  }
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}小时前`;

  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
});

/******************************** 操作方法 ********************************/

/** 接受邀请：加入会议并打开抽屉 */
async function handleAccept() {
  const meetingId = props.invite.meetingId;
  if (meetingId <= 0 || actionLoading.value) {
    return;
  }
  actionLoading.value = true;
  try {
    await meetingStore.enterMeeting(meetingId);
    meetingStore.openDrawer();
    emit('close');
  } catch (error: any) {
    ElMessage.error(error?.message || '加入会议失败');
  } finally {
    actionLoading.value = false;
  }
}

/** 拒绝邀请：调用拒绝接口并关闭弹窗 */
async function handleDecline() {
  const meetingId = props.invite.meetingId;
  if (meetingId <= 0 || actionLoading.value) {
    return;
  }
  actionLoading.value = true;
  try {
    await meetingStore.declineMeeting(meetingId);
    ElMessage.success('已拒绝会议邀请');
    emit('close');
  } catch (error: any) {
    ElMessage.error(error?.message || '拒绝会议邀请失败');
  } finally {
    actionLoading.value = false;
  }
}
</script>

<style lang="scss" scoped>
/******************************** meeting-invite-popup 样式 ********************************/

.meeting-invite-popup {
  min-width: 296px;
  padding: 2px 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-regular);

  &__header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    flex-shrink: 0;
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__time {
    margin-left: auto;
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }

  &__body {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 12px;
    padding: 12px;
    border-radius: 12px;
    background: var(--el-fill-color-lighter);
  }

  &__avatar {
    flex-shrink: 0;
  }

  &__info {
    min-width: 0;
    flex: 1;
  }

  &__host {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    line-height: 1.4;
    word-break: break-word;
  }

  &__label {
    font-weight: 400;
    color: var(--el-text-color-secondary);
  }

  &__meeting-name {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}

/******************************** 覆写 ElNotification 全局样式 ********************************/

:global(.meeting-invite-notification) {
  width: 360px;
  padding: 14px 16px;
}

:global(.meeting-invite-notification .el-notification__group) {
  margin-left: 0;
}

:global(.meeting-invite-notification .el-notification__title) {
  display: none;
}

:global(.meeting-invite-notification .el-notification__content) {
  margin: 0;
}

// 关闭按钮位置调整
.meeting-invite-popup__close {
  border-radius: 50%;
  background: transparent;
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px;
  cursor: pointer;
}
</style>
