<script setup lang="ts">
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useImageUrl } from '@/composables/use-image-url';
import {
  fetchProjectTimeline,
  type ProjectTimelineItem,
} from '../home-service';

gsap.registerPlugin(ScrollTrigger);

const { t } = useI18n();
const { resolveImageUrl } = useImageUrl();

// ── 数据 ────────────────────────────────────────────────────────────
const projects = ref<ProjectTimelineItem[]>([]);
const loading = ref(true);
const loadError = ref(false);

async function loadProjects() {
  loading.value = true;
  loadError.value = false;
  try {
    projects.value = await fetchProjectTimeline();
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

// ── 过滤：仅保留有主图的项目用于桌面端时间轴 ─────────────────────────
const timelineProjects = computed(() =>
  projects.value.filter((p) => {
    const img = p.images?.split(',')[0]?.trim();
    return !!img;
  })
);

const hasEnoughForTimeline = computed(() => timelineProjects.value.length >= 2);

// ── 图片解析 ────────────────────────────────────────────────────────
function firstImage(images?: string): string {
  const raw = images?.split(',')[0]?.trim();
  return raw ? resolveImageUrl(raw) : '';
}

// ── GSAP 横向时间轴 ─────────────────────────────────────────────────
const sectionRef = ref<HTMLElement>();
const trackRef = ref<HTMLElement>();
let scrollTriggerInstance: ScrollTrigger | undefined;

function setupDesktopTimeline() {
  if (!sectionRef.value || !trackRef.value) return;
  if (!hasEnoughForTimeline.value) return;

  const track = trackRef.value;
  const section = sectionRef.value;

  // 计算横向滚动距离
  const trackWidth = track.scrollWidth;
  const viewportWidth = section.clientWidth;
  const scrollDistance = trackWidth - viewportWidth;

  if (scrollDistance <= 0) return;

  scrollTriggerInstance = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: () => `+=${scrollDistance}`,
    pin: true,
    scrub: 1,
    anticipatePin: 1,
    onUpdate: (self) => {
      gsap.set(track, { x: -self.progress * scrollDistance });
    },
    animation: gsap.to(track, { x: -scrollDistance, ease: 'none' }),
  });
}

function cleanupTimeline() {
  scrollTriggerInstance?.kill();
  scrollTriggerInstance = undefined;
}

onMounted(async () => {
  await loadProjects();
  await nextTick();
  // 仅桌面端启用横向时间轴
  if (window.innerWidth >= 768) {
    setupDesktopTimeline();
  }
});

onBeforeUnmount(() => {
  cleanupTimeline();
});
</script>

<template>
  <div class="home-page">
    <!-- ══════════ Hero ══════════ -->
    <section class="home-hero">
      <div class="home-hero__content">
        <h1 class="home-hero__title">{{ t('home.heroTitle') }}</h1>
        <p class="home-hero__subtitle">{{ t('home.heroSubtitle') }}</p>
        <div v-if="!loading && !loadError" class="home-hero__scroll-hint">
          <span class="home-hero__scroll-text">{{ t('home.scrollHint') }}</span>
          <span class="home-hero__scroll-arrow">↓</span>
        </div>
      </div>
    </section>

    <!-- ══════════ 加载态 ══════════ -->
    <section v-if="loading" class="home-loading">
      <div class="home-loading__spinner" />
    </section>

    <!-- ══════════ 错误 / 空态 ══════════ -->
    <section v-else-if="loadError || projects.length === 0" class="home-empty">
      <div class="home-empty__icon">📋</div>
      <h2 class="home-empty__title">
        {{ loadError ? t('home.loadError') : t('home.emptyTitle') }}
      </h2>
      <p class="home-empty__desc">{{ t('home.emptyDesc') }}</p>
    </section>

    <!-- ══════════ 数据少于 2 条：静态卡片 ══════════ -->
    <section v-else-if="!hasEnoughForTimeline" class="home-static">
      <div
        v-for="item in timelineProjects"
        :key="item.projectId"
        class="static-card"
      >
        <div v-if="item.images" class="static-card__img">
          <img :src="item.images" :alt="item.projectName" />
        </div>
        <div class="static-card__body">
          <span v-if="item.projectYear" class="static-card__year">{{
            item.projectYear
          }}</span>
          <h3 class="static-card__name">{{ item.projectName }}</h3>
          <p v-if="item.companyName" class="static-card__info">
            {{ t('home.company') }}：{{ item.companyName }}
          </p>
          <p v-if="item.projectType" class="static-card__info">
            {{ t('home.projectType') }}：{{ item.projectType }}
          </p>
          <p v-if="item.remark" class="static-card__remark">
            {{ item.remark }}
          </p>
        </div>
      </div>
    </section>

    <!-- ══════════ 桌面端时间轴（≥2 条有图数据） ══════════ -->
    <template v-else>
      <!-- 桌面端横向时间轴 -->
      <section
        ref="sectionRef"
        class="timeline-section timeline-section--desktop"
      >
        <!-- 中心线 -->
        <div class="timeline-center-line" />
        <div ref="trackRef" class="timeline-track">
          <div
            v-for="(item, index) in timelineProjects"
            :key="item.projectId"
            class="timeline-item"
            :class="[
              index % 2 === 0 ? 'timeline-item--top' : 'timeline-item--bottom',
            ]"
          >
            <!-- 年份 -->
            <div class="timeline-item__year">{{ item.projectYear }}</div>

            <!-- 名称条 -->
            <div class="timeline-item__name-pill">{{ item.projectName }}</div>

            <!-- 信息面板 -->
            <div class="timeline-item__panel">
              <p v-if="item.companyName" class="timeline-item__company">
                {{ item.companyName }}
              </p>
              <p v-if="item.projectType" class="timeline-item__type">
                {{ item.projectType }}
              </p>
              <p v-if="item.remark" class="timeline-item__remark">
                {{ item.remark }}
              </p>
            </div>

            <!-- 主图 -->
            <div v-if="firstImage(item.images)" class="timeline-item__media">
              <img :src="firstImage(item.images)" :alt="item.projectName" />
            </div>

            <!-- 节点圆点 -->
            <div class="timeline-item__dot" />
          </div>
        </div>
      </section>

      <!-- 移动端纵向堆叠 -->
      <section class="timeline-section timeline-section--mobile">
        <div
          v-for="item in timelineProjects"
          :key="item.projectId"
          class="mobile-card"
        >
          <div v-if="item.projectYear" class="mobile-card__year">
            {{ item.projectYear }}
          </div>
          <div v-if="firstImage(item.images)" class="mobile-card__img">
            <img :src="firstImage(item.images)" :alt="item.projectName" />
          </div>
          <div class="mobile-card__body">
            <h3 class="mobile-card__name">{{ item.projectName }}</h3>
            <p v-if="item.companyName" class="mobile-card__info">
              {{ t('home.company') }}：{{ item.companyName }}
            </p>
            <p v-if="item.projectType" class="mobile-card__info">
              {{ t('home.projectType') }}：{{ item.projectType }}
            </p>
            <p v-if="item.remark" class="mobile-card__remark">
              {{ item.remark }}
            </p>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped lang="scss">
/* ══════════════════════════════════════════════════════════════════
   全局变量 / 根容器
   ══════════════════════════════════════════════════════════════════ */
.home-page {
  --home-accent: var(--color-danger, #ef4444);
  --home-accent-bg: var(--color-danger-bg, rgba(239, 68, 68, 0.08));
  --home-text: var(--color-text-primary);
  --home-text-secondary: var(--color-text-secondary);
  --home-bg: var(--color-bg-page);
  --home-card-bg: var(--color-bg-card);
  --home-border: var(--color-border);
  --home-shadow: var(--shadow-md);

  min-height: 100vh;
  background: var(--home-bg);
  color: var(--home-text);
  overflow-x: hidden;
}

/* ══════════════════════════════════════════════════════════════════
   Hero 区域
   ══════════════════════════════════════════════════════════════════ */
.home-hero {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  padding: var(--spacing-xl);
  text-align: center;
  position: relative;
}

.home-hero__content {
  max-width: 640px;
}

.home-hero__title {
  font-size: clamp(28px, 5vw, 48px);
  font-weight: 700;
  line-height: 1.3;
  margin: 0 0 var(--spacing-md);
  color: var(--home-text);
  letter-spacing: 0.02em;
}

.home-hero__subtitle {
  font-size: clamp(14px, 2vw, 18px);
  color: var(--home-text-secondary);
  margin: 0 0 var(--spacing-xl);
  line-height: 1.6;
}

.home-hero__scroll-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  animation: hero-bounce 2s ease-in-out infinite;
}

.home-hero__scroll-text {
  font-size: var(--font-size-xs);
  color: var(--home-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.15em;
}

.home-hero__scroll-arrow {
  font-size: 20px;
  color: var(--home-accent);
}

@keyframes hero-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(8px);
  }
}

/* ══════════════════════════════════════════════════════════════════
   加载态
   ══════════════════════════════════════════════════════════════════ */
.home-loading {
  display: flex;
  justify-content: center;
  padding: 120px 0;
}

.home-loading__spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--home-border);
  border-top-color: var(--home-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ══════════════════════════════════════════════════════════════════
   空态 / 错误态
   ══════════════════════════════════════════════════════════════════ */
.home-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120px var(--spacing-xl);
  text-align: center;
}

.home-empty__icon {
  font-size: 48px;
  margin-bottom: var(--spacing-md);
}

.home-empty__title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  margin: 0 0 var(--spacing-sm);
}

.home-empty__desc {
  font-size: var(--font-size-sm);
  color: var(--home-text-secondary);
  margin: 0;
}

/* ══════════════════════════════════════════════════════════════════
   静态卡片（数据 < 2 条时）
   ══════════════════════════════════════════════════════════════════ */
.home-static {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xl);
  padding: 0 var(--spacing-xl) 120px;
  max-width: 600px;
  margin: 0 auto;
}

.static-card {
  width: 100%;
  background: var(--home-card-bg);
  border: 1px solid var(--home-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--home-shadow);
}

.static-card__img {
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.static-card__body {
  padding: var(--spacing-lg);
}

.static-card__year {
  display: inline-block;
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--home-accent);
  line-height: 1;
  margin-bottom: var(--spacing-sm);
}

.static-card__name {
  font-size: var(--font-size-xl);
  font-weight: 600;
  margin: 0 0 var(--spacing-sm);
}

.static-card__info {
  font-size: var(--font-size-sm);
  color: var(--home-text-secondary);
  margin: 0 0 var(--spacing-xs);
}

.static-card__remark {
  font-size: var(--font-size-sm);
  color: var(--home-text-secondary);
  margin: var(--spacing-sm) 0 0;
  line-height: 1.6;
}

/* ══════════════════════════════════════════════════════════════════
   桌面端时间轴
   ══════════════════════════════════════════════════════════════════ */
.timeline-section--desktop {
  display: block;
  position: relative;
  height: 100vh;
  overflow: hidden;
}

.timeline-center-line {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--home-border) 10%,
    var(--home-accent) 50%,
    var(--home-border) 90%,
    transparent 100%
  );
  transform: translateY(-50%);
  z-index: 1;
  pointer-events: none;
}

.timeline-track {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 15vw;
  gap: 0;
  will-change: transform;
}

.timeline-item {
  flex-shrink: 0;
  width: 520px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding: 0 40px;
}

/* ── 上方节点 ── */
.timeline-item--top {
  justify-content: flex-end;
  padding-bottom: 60px;
}

/* ── 下方节点 ── */
.timeline-item--bottom {
  justify-content: flex-start;
  padding-top: 60px;
}

/* ── 节点圆点 ── */
.timeline-item__dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 14px;
  background: var(--home-accent);
  border: 3px solid var(--home-bg);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  box-shadow: 0 0 0 4px var(--home-accent-bg);
}

/* ── 年份 ── */
.timeline-item__year {
  font-size: clamp(48px, 6vw, 80px);
  font-weight: 800;
  color: var(--home-accent);
  line-height: 1;
  opacity: 0.15;
  letter-spacing: -0.02em;
  user-select: none;
}

.timeline-item--top .timeline-item__year {
  margin-bottom: var(--spacing-md);
}

.timeline-item--bottom .timeline-item__year {
  margin-top: var(--spacing-md);
  order: 3;
}

/* ── 名称条 ── */
.timeline-item__name-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 32px;
  background: var(--home-accent);
  color: #fff;
  font-size: var(--font-size-base);
  font-weight: 600;
  border-radius: var(--radius-full);
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3);
}

.timeline-item--top .timeline-item__name-pill {
  margin-bottom: var(--spacing-md);
}

.timeline-item--bottom .timeline-item__name-pill {
  margin-top: var(--spacing-md);
  order: 2;
}

/* ── 信息面板 ── */
.timeline-item__panel {
  background: var(--home-card-bg);
  border: 1px solid var(--home-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--home-shadow);
  width: 100%;
  max-width: 400px;
}

.timeline-item--bottom .timeline-item__panel {
  order: 1;
}

.timeline-item__company {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--home-text);
  margin: 0 0 var(--spacing-xs);
}

.timeline-item__type {
  font-size: var(--font-size-sm);
  color: var(--home-accent);
  margin: 0 0 var(--spacing-sm);
  font-weight: 500;
}

.timeline-item__remark {
  font-size: var(--font-size-sm);
  color: var(--home-text-secondary);
  margin: 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── 主图 ── */
.timeline-item__media {
  width: 100%;
  max-width: 400px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--home-shadow);

  img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    display: block;
    transition: transform var(--transition-slow);
  }

  &:hover img {
    transform: scale(1.04);
  }
}

.timeline-item--top .timeline-item__media {
  margin-bottom: var(--spacing-md);
}

.timeline-item--bottom .timeline-item__media {
  order: 0;
}

/* ══════════════════════════════════════════════════════════════════
   移动端纵向堆叠（隐藏桌面端时间轴）
   ══════════════════════════════════════════════════════════════════ */
.timeline-section--mobile {
  display: none;
}

/* ══════════════════════════════════════════════════════════════════
   响应式：平板端（768px – 1023px）
   ══════════════════════════════════════════════════════════════════ */
@media (max-width: 1023px) and (min-width: 768px) {
  .timeline-item {
    width: 400px;
    padding: 0 24px;
  }

  .timeline-track {
    padding: 0 8vw;
  }

  .timeline-item__media img {
    height: 160px;
  }
}

/* ══════════════════════════════════════════════════════════════════
   响应式：手机端（< 768px）
   ══════════════════════════════════════════════════════════════════ */
@media (max-width: 767px) {
  .home-hero {
    min-height: 50vh;
    padding: var(--spacing-lg);
  }

  .timeline-section--desktop {
    display: none;
  }

  .timeline-section--mobile {
    display: block;
    padding: 0 var(--spacing-md) 80px;
  }

  .mobile-card {
    background: var(--home-card-bg);
    border: 1px solid var(--home-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--home-shadow);
    margin-bottom: var(--spacing-lg);
  }

  .mobile-card__year {
    font-size: var(--font-size-3xl);
    font-weight: 800;
    color: var(--home-accent);
    padding: var(--spacing-md) var(--spacing-lg) 0;
    line-height: 1;
  }

  .mobile-card__img {
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    margin-top: var(--spacing-sm);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .mobile-card__body {
    padding: var(--spacing-md) var(--spacing-lg) var(--spacing-lg);
  }

  .mobile-card__name {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin: 0 0 var(--spacing-sm);
  }

  .mobile-card__info {
    font-size: var(--font-size-sm);
    color: var(--home-text-secondary);
    margin: 0 0 var(--spacing-xs);
  }

  .mobile-card__remark {
    font-size: var(--font-size-sm);
    color: var(--home-text-secondary);
    margin: var(--spacing-sm) 0 0;
    line-height: 1.6;
  }
}
</style>
