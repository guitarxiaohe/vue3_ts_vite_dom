<template>
  <main class="meeting-analysis" v-loading="loading">
    <!-------------------------- 页面头部 -------------------------->
    <section class="meeting-analysis__header">
      <div class="meeting-analysis__title-group">
        <div class="meeting-analysis__title-line">
          <h1 class="meeting-analysis__title">会议分析</h1>
          <el-tag effect="plain" type="success">实时会议 / 历史复盘</el-tag>
        </div>
        <span class="meeting-analysis__breadcrumb">会议管理 / 会议分析</span>
      </div>
      <div class="meeting-analysis__actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="~"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          :clearable="false"
          class="meeting-analysis__date"
          @change="loadData"
        />
        <el-select
          v-model="status"
          placeholder="全部状态"
          class="meeting-analysis__status"
          @change="loadData"
        >
          <el-option label="全部状态" value="" />
          <el-option label="进行中" value="ACTIVE" />
          <el-option label="关闭中" value="CLOSING" />
          <el-option label="关闭成功" value="CLOSED_SUCCESS" />
          <el-option label="关闭失败" value="CLOSE_FAILED" />
        </el-select>
        <el-button :icon="RefreshCw" :loading="loading" @click="loadData">
          刷新
        </el-button>
      </div>
    </section>

    <template v-if="overview">
      <!-------------------------- 指标卡片 -------------------------->
      <section class="meeting-analysis__metrics">
        <article
          v-for="item in metricCards"
          :key="item.title"
          class="meeting-analysis__metric"
        >
          <div class="meeting-analysis__metric-head">
            <span>{{ item.title }}</span>
            <span
              class="meeting-analysis__metric-icon"
              :class="`meeting-analysis__metric-icon--${item.tone}`"
            >
              <component :is="item.icon" :size="18" />
            </span>
          </div>
          <strong>{{ item.value }}</strong>
          <div class="meeting-analysis__metric-foot">
            <span>{{ item.caption }}</span>
            <b :class="item.trendClass">{{ item.trend }}</b>
          </div>
        </article>
      </section>

      <!-------------------------- 趋势与状态 -------------------------->
      <section class="meeting-analysis__grid meeting-analysis__grid--hero">
        <el-card shadow="never" class="meeting-analysis__panel">
          <template #header>
            <div class="meeting-analysis__panel-header">
              <h2>会议趋势与参会人次</h2>
            </div>
          </template>
          <div ref="trendChartRef" class="meeting-analysis__chart" />
        </el-card>

        <el-card shadow="never" class="meeting-analysis__panel">
          <template #header>
            <div class="meeting-analysis__panel-header">
              <h2>会议状态分布</h2>
            </div>
          </template>
          <div ref="statusChartRef" class="meeting-analysis__chart" />
        </el-card>
      </section>

      <!-------------------------- 质量与内容 -------------------------->
      <section class="meeting-analysis__grid meeting-analysis__grid--middle">
        <el-card shadow="never" class="meeting-analysis__panel">
          <template #header>
            <div class="meeting-analysis__panel-header">
              <h2>会议时段热力</h2>
            </div>
          </template>
          <div ref="heatmapChartRef" class="meeting-analysis__chart" />
        </el-card>

        <el-card shadow="never" class="meeting-analysis__panel">
          <template #header>
            <div class="meeting-analysis__panel-header">
              <h2>RTC 与关闭质量</h2>
            </div>
          </template>
          <div ref="qualityChartRef" class="meeting-analysis__chart" />
        </el-card>

        <el-card shadow="never" class="meeting-analysis__panel">
          <template #header>
            <div class="meeting-analysis__panel-header">
              <h2>发言贡献排行</h2>
            </div>
          </template>
          <div class="meeting-analysis__speaker-list">
            <div
              v-for="item in overview.speakerTop"
              :key="item.displayName"
              class="meeting-analysis__speaker"
            >
              <span class="meeting-analysis__avatar">
                {{ item.displayName.slice(0, 1) }}
              </span>
              <div class="meeting-analysis__speaker-body">
                <div class="meeting-analysis__speaker-head">
                  <span>{{ item.displayName }}</span>
                  <strong>{{ formatPercent(item.percent) }}</strong>
                </div>
                <el-progress
                  :percentage="item.percent"
                  :show-text="false"
                  :stroke-width="8"
                />
              </div>
              <span class="meeting-analysis__speaker-count">
                {{ item.wordCount.toLocaleString() }} 字
              </span>
            </div>
          </div>
        </el-card>
      </section>

      <!-------------------------- 异常与纪要 -------------------------->
      <section class="meeting-analysis__grid meeting-analysis__grid--bottom">
        <el-card shadow="never" class="meeting-analysis__panel">
          <template #header>
            <div class="meeting-analysis__panel-header">
              <h2>异常与高关注会议</h2>
              <el-button link type="primary" @click="goMeetingManage">
                进入会议管理
                <ArrowRight :size="16" />
              </el-button>
            </div>
          </template>
          <el-table :data="overview.riskMeetings" size="small">
            <el-table-column prop="title" label="会议标题" min-width="180" />
            <el-table-column prop="hostNickName" label="主持人" width="110" />
            <el-table-column prop="status" label="状态" width="140" />
            <el-table-column prop="participantCount" label="参会" width="76" />
            <el-table-column prop="transcriptCount" label="转写" width="76" />
            <el-table-column label="风险" width="120">
              <template #default="{ row }">
                <el-tag size="small" :type="riskTagType(row.riskLevel)">
                  {{ row.riskText }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="lastTime" label="最近时间" width="120" />
          </el-table>
        </el-card>

        <el-card shadow="never" class="meeting-analysis__panel">
          <template #header>
            <div class="meeting-analysis__panel-header">
              <h2>纪要产出质量</h2>
            </div>
          </template>
          <div class="meeting-analysis__summary-list">
            <article
              v-for="item in overview.summaryQuality"
              :key="item.title"
              class="meeting-analysis__summary-card"
            >
              <div class="meeting-analysis__summary-head">
                <strong>{{ item.title }}</strong>
                <el-tag size="small" :type="riskTagType(item.level)">
                  {{ item.valueText }}
                </el-tag>
              </div>
              <p>{{ item.description }}</p>
            </article>
          </div>
        </el-card>
      </section>
    </template>

    <!-------------------------- 空状态 -------------------------->
    <el-empty v-else-if="!loading" description="暂无会议分析数据" />
  </main>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Activity,
  ArrowRight,
  Clock,
  FileText,
  MessageSquareText,
  RefreshCw,
  Users,
  Video,
} from 'lucide-vue-next';
import { getMeetingAnalysisOverviewApi } from '@/api/modules/meeting-analysis';
import type {
  MeetingAnalysisOverview,
  MeetingAnalysisQuery,
} from '@/api/modules/meeting-analysis.type';

/******************************** 基础状态 ********************************/

const router = useRouter();
const today = new Date();
const beginDate = new Date(today);
beginDate.setDate(today.getDate() - 29);

const loading = ref(false);
const overview = ref<MeetingAnalysisOverview>();
const status = ref('');
const dateRange = ref<[string, string]>([
  beginDate.toISOString().slice(0, 10),
  today.toISOString().slice(0, 10),
]);

const trendChartRef = ref<HTMLDivElement>();
const statusChartRef = ref<HTMLDivElement>();
const heatmapChartRef = ref<HTMLDivElement>();
const qualityChartRef = ref<HTMLDivElement>();

let trendChart: echarts.ECharts | null = null;
let statusChart: echarts.ECharts | null = null;
let heatmapChart: echarts.ECharts | null = null;
let qualityChart: echarts.ECharts | null = null;

/******************************** 页面数据 ********************************/

const metricCards = computed(() => {
  if (!overview.value) return [];
  const summary = overview.value.summary;
  return [
    {
      title: '会议总数',
      value: summary.meetingCount.toLocaleString(),
      caption: '进行中会议',
      trend: `${summary.activeCount.toLocaleString()} 场`,
      trendClass: 'meeting-analysis__trend--up',
      tone: 'blue',
      icon: Video,
    },
    {
      title: '入会人次',
      value: summary.participantCount.toLocaleString(),
      caption: '平均每场',
      trend: `${summary.avgParticipantCount} 人`,
      trendClass: 'meeting-analysis__trend--up',
      tone: 'green',
      icon: Users,
    },
    {
      title: '平均时长',
      value: `${summary.avgDurationMinutes}m`,
      caption: '超 90 分钟',
      trend: `${summary.longMeetingCount.toLocaleString()} 场`,
      trendClass: 'meeting-analysis__trend--warn',
      tone: 'amber',
      icon: Clock,
    },
    {
      title: '转写片段',
      value: summary.transcriptCount.toLocaleString(),
      caption: '合并片段率',
      trend: formatPercent(summary.mergedTranscriptRate),
      trendClass: 'meeting-analysis__trend--up',
      tone: 'blue',
      icon: MessageSquareText,
    },
    {
      title: '纪要生成率',
      value: formatPercent(summary.summaryGenerateRate),
      caption: '缺失或空纪要',
      trend: `${summary.emptyOrMissingSummaryCount.toLocaleString()} 场`,
      trendClass: 'meeting-analysis__trend--danger',
      tone: 'red',
      icon: FileText,
    },
    {
      title: '关闭质量',
      value: `${summary.closedSuccessCount.toLocaleString()} / ${summary.closeFailedCount.toLocaleString()}`,
      caption: '成功 / 失败',
      trend: `${summary.closingCount.toLocaleString()} 关闭中`,
      trendClass: 'meeting-analysis__trend--warn',
      tone: 'green',
      icon: Activity,
    },
  ];
});

/******************************** 图表渲染 ********************************/

// 渲染全部图表
function renderCharts() {
  if (!overview.value) return;
  renderTrendChart();
  renderStatusChart();
  renderHeatmapChart();
  renderQualityChart();
}

// 渲染会议趋势图
function renderTrendChart() {
  if (!trendChartRef.value || !overview.value) return;
  trendChart = trendChart || echarts.init(trendChartRef.value);
  const data = overview.value.meetingTrend;
  trendChart.setOption({
    color: [cssVar('--color-primary'), cssVar('--color-success')],
    tooltip: { trigger: 'axis' },
    legend: { top: 0, right: 0 },
    grid: { left: 42, right: 18, top: 44, bottom: 30 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map((item) => item.statDate.slice(5)),
    },
    yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
    series: [
      {
        name: '会议数',
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.12 },
        data: data.map((item) => item.meetingCount),
      },
      {
        name: '入会人次',
        type: 'line',
        smooth: true,
        data: data.map((item) => item.participantCount),
      },
    ],
  });
}

// 渲染状态分布图
function renderStatusChart() {
  if (!statusChartRef.value || !overview.value) return;
  statusChart = statusChart || echarts.init(statusChartRef.value);
  statusChart.setOption({
    color: [
      cssVar('--color-success'),
      cssVar('--color-primary'),
      cssVar('--color-warning'),
      cssVar('--color-danger'),
      cssVar('--color-info'),
    ],
    tooltip: { trigger: 'item', formatter: '{b}<br />{d}% ({c})' },
    legend: { orient: 'vertical', right: 6, top: 'center' },
    series: [
      {
        type: 'pie',
        radius: ['46%', '72%'],
        center: ['38%', '50%'],
        label: { show: false },
        data: overview.value.statusDistribution.map((item) => ({
          name: item.name,
          value: item.value,
        })),
      },
    ],
  });
}

// 渲染会议时段热力
function renderHeatmapChart() {
  if (!heatmapChartRef.value || !overview.value) return;
  heatmapChart = heatmapChart || echarts.init(heatmapChartRef.value);
  const data = overview.value.timeHeatmap;
  const weekDays = Array.from(new Set(data.map((item) => item.weekDay)));
  const hours = Array.from(new Set(data.map((item) => item.hourLabel)));
  heatmapChart.setOption({
    color: [cssVar('--color-primary')],
    tooltip: { position: 'top' },
    grid: { left: 44, right: 18, top: 20, bottom: 34 },
    xAxis: { type: 'category', data: hours, splitArea: { show: true } },
    yAxis: { type: 'category', data: weekDays, splitArea: { show: true } },
    visualMap: {
      min: 0,
      max: Math.max(...data.map((item) => item.value), 1),
      show: false,
      inRange: {
        color: [
          cssVar('--color-bg-hover'),
          cssVar('--color-primary-light'),
          cssVar('--color-primary'),
        ],
      },
    },
    series: [
      {
        type: 'heatmap',
        data: data.map((item) => [
          hours.indexOf(item.hourLabel),
          weekDays.indexOf(item.weekDay),
          item.value,
        ]),
        label: { show: true },
      },
    ],
  });
}

// 渲染RTC与关闭质量
function renderQualityChart() {
  if (!qualityChartRef.value || !overview.value) return;
  qualityChart = qualityChart || echarts.init(qualityChartRef.value);
  const data = overview.value.rtcQuality;
  qualityChart.setOption({
    color: [cssVar('--color-primary')],
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 112, right: 48, top: 18, bottom: 28 },
    xAxis: { type: 'value', max: 100 },
    yAxis: {
      type: 'category',
      inverse: true,
      data: data.map((item) => item.name),
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        barWidth: 10,
        data: data.map((item) => item.percent),
        label: { show: true, position: 'right', formatter: '{c}%' },
        itemStyle: { borderRadius: [0, 6, 6, 0] },
      },
    ],
  });
}

/******************************** 方法 ********************************/

// 加载分析数据
async function loadData() {
  loading.value = true;
  try {
    const [beginTime, endTime] = dateRange.value;
    const params: MeetingAnalysisQuery = {
      beginTime,
      endTime,
      status: status.value,
      hostUserId: null,
    };
    const response = await getMeetingAnalysisOverviewApi(params);
    overview.value = response.data!;
    await nextTick();
    renderCharts();
  } finally {
    loading.value = false;
  }
}

// 跳转会议管理
function goMeetingManage() {
  router.push('/multiview/meetingSession');
}

// 适配Element Plus标签类型
function riskTagType(level: string) {
  const typeMap: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    SUCCESS: 'success',
    WARN: 'warning',
    DANGER: 'danger',
    INFO: 'info',
  };
  return typeMap[level];
}

// 格式化百分比
function formatPercent(value: number) {
  return `${value}%`;
}

// 获取主题变量
function cssVar(name: string) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

// 重置图表尺寸
function resizeCharts() {
  trendChart?.resize();
  statusChart?.resize();
  heatmapChart?.resize();
  qualityChart?.resize();
}

/******************************** 生命周期 ********************************/

onMounted(() => {
  loadData();
  window.addEventListener('resize', resizeCharts);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts);
  trendChart?.dispose();
  statusChart?.dispose();
  heatmapChart?.dispose();
  qualityChart?.dispose();
});
</script>

<style scoped lang="scss">
.meeting-analysis {
  min-height: 100%;
  padding: var(--spacing-lg);
  background: var(--color-bg-page);
  color: var(--color-text-primary);
}

.meeting-analysis__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.meeting-analysis__title-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.meeting-analysis__title-line {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.meeting-analysis__title {
  margin: 0;
  font-size: var(--font-size-2xl);
  font-weight: 700;
}

.meeting-analysis__breadcrumb {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.meeting-analysis__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.meeting-analysis__date {
  width: 260px;
}

.meeting-analysis__status {
  width: 150px;
}

.meeting-analysis__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.meeting-analysis__metric {
  min-height: 128px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  background: var(--color-bg-card);
  box-shadow: var(--shadow-sm);
}

.meeting-analysis__metric-head,
.meeting-analysis__metric-foot,
.meeting-analysis__speaker-head,
.meeting-analysis__summary-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.meeting-analysis__metric-head {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.meeting-analysis__metric strong {
  display: block;
  margin: var(--spacing-md) 0 var(--spacing-sm);
  font-size: var(--font-size-3xl);
  line-height: 1;
}

.meeting-analysis__metric-foot {
  color: var(--color-text-placeholder);
  font-size: var(--font-size-xs);
}

.meeting-analysis__metric-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
}

.meeting-analysis__metric-icon--blue {
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.meeting-analysis__metric-icon--green {
  color: var(--color-success);
  background: var(--color-success-bg);
}

.meeting-analysis__metric-icon--amber {
  color: var(--color-warning);
  background: var(--color-warning-bg);
}

.meeting-analysis__metric-icon--red {
  color: var(--color-danger);
  background: var(--color-danger-bg);
}

.meeting-analysis__trend--up {
  color: var(--color-success);
}

.meeting-analysis__trend--warn {
  color: var(--color-warning);
}

.meeting-analysis__trend--danger {
  color: var(--color-danger);
}

.meeting-analysis__grid {
  display: grid;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.meeting-analysis__grid--hero {
  grid-template-columns: minmax(0, 1.45fr) minmax(360px, 0.75fr);
}

.meeting-analysis__grid--middle {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.meeting-analysis__grid--bottom {
  grid-template-columns: minmax(0, 1.15fr) minmax(360px, 0.85fr);
}

.meeting-analysis__panel {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.meeting-analysis__panel :deep(.el-card__header) {
  padding: var(--spacing-md);
}

.meeting-analysis__panel :deep(.el-card__body) {
  padding: var(--spacing-md);
}

.meeting-analysis__panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.meeting-analysis__panel-header h2 {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: 700;
}

.meeting-analysis__chart {
  width: 100%;
  height: 300px;
}

.meeting-analysis__speaker-list {
  display: grid;
  gap: var(--spacing-md);
  min-height: 300px;
}

.meeting-analysis__speaker {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) 72px;
  align-items: center;
  gap: var(--spacing-sm);
}

.meeting-analysis__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  color: var(--color-bg-card);
  background: var(--color-primary);
  font-weight: 700;
}

.meeting-analysis__speaker-body {
  min-width: 0;
}

.meeting-analysis__speaker-head {
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-sm);
}

.meeting-analysis__speaker-count {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  text-align: right;
}

.meeting-analysis__summary-list {
  display: grid;
  gap: var(--spacing-md);
}

.meeting-analysis__summary-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  background: var(--color-bg-hover);
}

.meeting-analysis__summary-card p {
  margin: var(--spacing-sm) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

@media (min-width: 1600px) {
  .meeting-analysis__metrics {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

@media (max-width: 1200px) {
  .meeting-analysis__metrics,
  .meeting-analysis__grid--middle {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .meeting-analysis__grid--hero,
  .meeting-analysis__grid--bottom {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .meeting-analysis {
    padding: var(--spacing-md);
  }

  .meeting-analysis__header,
  .meeting-analysis__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .meeting-analysis__date,
  .meeting-analysis__status {
    width: 100%;
  }

  .meeting-analysis__metrics,
  .meeting-analysis__grid--middle {
    grid-template-columns: 1fr;
  }
}
</style>
