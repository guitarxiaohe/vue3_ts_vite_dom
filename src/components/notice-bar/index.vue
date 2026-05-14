<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Megaphone } from 'lucide-vue-next';
import { getRecentNoticesApi } from '@/api/modules/notice';

interface NoticeItem {
  noticeId: number;
  noticeTitle: string;
  noticeType: string;
  createTime: string;
}

const router = useRouter();
const notices = ref<NoticeItem[]>([]);
const loading = ref(false);

const NOTICE_TYPE_LABEL: Record<string, string> = {
  '1': '通知',
  '2': '公告',
};

const hasNotices = computed(() => notices.value.length > 0);

// 拼接滚动文本
const scrollText = computed(() =>
  notices.value
    .map(
      (n) => `[${NOTICE_TYPE_LABEL[n.noticeType] || '通知'}] ${n.noticeTitle}`
    )
    .join('  ·  ')
);

// 点击跳转到通知公告页面并按标题筛选
function handleClick(notice: NoticeItem) {
  router.push({
    path: '/multiview/notice',
    query: { noticeTitle: notice.noticeTitle },
  });
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
    <div class="notice-bar__content">
      <div class="notice-bar__track">
        <span class="notice-bar__text">{{ scrollText }}</span>
        <span class="notice-bar__text" aria-hidden="true">{{
          scrollText
        }}</span>
      </div>
    </div>
    <div class="notice-bar__list">
      <span
        v-for="notice in notices"
        :key="notice.noticeId"
        class="notice-bar__item"
        @click="handleClick(notice)"
      >
        [{{ NOTICE_TYPE_LABEL[notice.noticeType] || '通知' }}]
        {{ notice.noticeTitle }}
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.notice-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 16px;
  background: var(--el-color-primary-light-9);
  border-bottom: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
}

.notice-bar__icon {
  flex-shrink: 0;
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
}

.notice-bar__content {
  flex: 1;
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
  padding-right: 6em;
  font-size: 13px;
  color: var(--color-text-primary);
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

.notice-bar__list {
  display: none;
}

.notice-bar__item {
  cursor: pointer;
  font-size: 13px;
  color: var(--el-color-primary);
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
  }
}
</style>
