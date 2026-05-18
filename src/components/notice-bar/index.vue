<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ChevronRight, Megaphone } from 'lucide-vue-next';
import { getRecentNoticesApi } from '@/api/modules/notice';

interface NoticeItem {
  noticeId: number;
  noticeTitle: string;
  noticeContent: string;
  noticeType: string;
  createTime: string;
}

const router = useRouter();
const { t } = useI18n();
const notices = ref<NoticeItem[]>([]);
const loading = ref(false);

const noticeTypeLabel = computed<Record<string, string>>(() => ({
  '1': t('noticeBar.typeNotice'),
  '2': t('noticeBar.typeAnnouncement'),
}));

const hasNotices = computed(() => notices.value.length > 0);
const primaryNoticeTypeLabel = computed(() =>
  getNoticeTypeLabel(notices.value[0]?.noticeType)
);

function getNoticeTypeLabel(type?: string) {
  return noticeTypeLabel.value[type ?? ''] || t('noticeBar.typeNotice');
}

function formatNoticeText(notice: NoticeItem, index: number) {
  const title = notice.noticeTitle?.trim();
  const content = notice.noticeContent?.trim();
  const body = content ? `${title}: ${content}` : title;

  if (index === 0) {
    return body;
  }

  return `${index + 1} [${getNoticeTypeLabel(notice.noticeType)}] ${body}`;
}

// 拼接滚动文本
const scrollText = computed(() =>
  notices.value
    .map((notice, index) => formatNoticeText(notice, index))
    .join('  ~  ')
);

// 点击跳转到通知公告页面并按标题筛选
function handleClick(notice: NoticeItem) {
  router.push({
    path: '/multiview/notice',
    query: { noticeTitle: notice.noticeTitle },
  });
}

function handlePrimaryClick() {
  const notice = notices.value[0];
  if (notice) {
    handleClick(notice);
  }
}

// 查看全部通知公告
function handleViewAll() {
  router.push('/multiview/notice');
}

// 加载最近通知
async function loadNotices() {
  loading.value = true;
  try {
    const res = (await getRecentNoticesApi()) as unknown as {
      data?: NoticeItem[];
    };
    notices.value = Array.isArray(res.data) ? res.data : [];
  } catch {
    notices.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(loadNotices);
</script>

<template>
  <div v-if="hasNotices" class="notice-bar">
    <div class="notice-bar__icon">
      <Megaphone :size="14" />
    </div>
    <span class="notice-bar__badge">{{ primaryNoticeTypeLabel }}</span>
    <button
      type="button"
      class="notice-bar__content"
      @click="handlePrimaryClick"
    >
      <div class="notice-bar__track">
        <span class="notice-bar__text">{{ scrollText }}</span>
        <span class="notice-bar__text" aria-hidden="true">{{
          scrollText
        }}</span>
      </div>
    </button>
    <button type="button" class="notice-bar__view-all" @click="handleViewAll">
      <span>{{ t('noticeBar.viewAll') }}</span>
      <ChevronRight :size="14" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.notice-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 34px;
  padding: 0 20px;
  background: var(--el-color-primary-light-9);
  border-bottom: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.notice-bar__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  color: var(--el-color-primary);
}

.notice-bar__badge {
  flex-shrink: 0;
  padding: 2px 9px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-card);
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
}

.notice-bar__content {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  mask-image: linear-gradient(
    to right,
    transparent,
    #000 24px,
    #000 calc(100% - 24px),
    transparent
  );
}

.notice-bar__track {
  display: flex;
  width: max-content;
  animation: notice-scroll 20s linear infinite;
}

.notice-bar__text {
  flex-shrink: 0;
  padding-right: 5em;
  font-size: 12px;
  line-height: 34px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

@keyframes notice-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.notice-bar__view-all {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 2px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 600;
  line-height: 22px;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

@media (max-width: 1024px) {
  .notice-bar {
    padding: 0 16px;
  }

  .notice-bar__view-all {
    display: none;
  }
}
</style>
