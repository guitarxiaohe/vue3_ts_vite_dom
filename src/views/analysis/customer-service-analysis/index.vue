<template>
  <main class="customer-analysis" v-loading="loading">
    <!-------------------------- 页面头部 -------------------------->
    <section class="customer-analysis__header">
      <h1 class="customer-analysis__title">客服数据分析</h1>
      <div class="customer-analysis__actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="~"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          :clearable="false"
          class="customer-analysis__date"
          @change="loadData"
        />
        <el-button :icon="RefreshCw" :loading="loading" @click="loadData">
          刷新
        </el-button>
        <el-button :icon="Download" @click="exportData">导出</el-button>
      </div>
    </section>

    <template v-if="overview">
      <!-------------------------- 指标卡片 -------------------------->
      <section class="customer-analysis__metrics">
        <MetricCard
          v-for="item in metricCards"
          :key="item.title"
          :title="item.title"
          :value="item.value"
          :trend="item.trend"
          :trend-type="item.trendType"
          :tone="item.tone"
          :icon="item.icon"
        />
      </section>

      <!-------------------------- 趋势与来源 -------------------------->
      <section class="customer-analysis__grid customer-analysis__grid--hero">
        <el-card shadow="never" class="customer-analysis__panel">
          <template #header>
            <div class="customer-analysis__panel-header">
              <h2>客服命中趋势</h2>
              <el-select
                v-model="trendScope"
                size="small"
                class="customer-analysis__select"
              >
                <el-option label="按天" value="day" />
                <el-option label="按周" value="week" />
              </el-select>
            </div>
          </template>
          <ChatLineChart :data="overview.conversationTrend" />
        </el-card>

        <el-card shadow="never" class="customer-analysis__panel">
          <template #header>
            <div class="customer-analysis__panel-header">
              <h2>来源分布</h2>
            </div>
          </template>
          <div class="customer-analysis__pie-layout">
            <ChatPieChart
              :data="overview.sourceDistribution"
              center-text="总计"
              :center-value="
                overview.summary.conversationCount.toLocaleString()
              "
            />
            <ul class="customer-analysis__legend">
              <li v-for="item in overview.sourceDistribution" :key="item.name">
                <span class="customer-analysis__legend-name">
                  {{ item.name }}
                </span>
                <strong>{{ item.value.toLocaleString() }}</strong>
              </li>
            </ul>
          </div>
        </el-card>
      </section>

      <!-------------------------- 规则与工具 -------------------------->
      <section class="customer-analysis__grid customer-analysis__grid--half">
        <el-card shadow="never" class="customer-analysis__panel">
          <template #header>
            <div class="customer-analysis__panel-header">
              <h2>规则打分 Top 10</h2>
              <el-tooltip content="按执行次数、选中次数和平均得分排序">
                <Info :size="15" class="customer-analysis__info" />
              </el-tooltip>
            </div>
          </template>
          <ChatBarChart :data="ruleScoreChartData" unit="" />
        </el-card>

        <el-card shadow="never" class="customer-analysis__panel">
          <template #header>
            <div class="customer-analysis__panel-header">
              <h2>工具使用排行</h2>
              <el-button link type="primary">
                查看全部
                <ArrowRight :size="16" />
              </el-button>
            </div>
          </template>
          <el-table :data="overview.toolUsage" size="small" class="tool-table">
            <el-table-column type="index" width="48" />
            <el-table-column prop="toolName" label="工具名称" min-width="130" />
            <el-table-column prop="totalCount" label="调用次数" width="110" />
            <el-table-column label="成功率" width="110">
              <template #default="{ row }"> {{ row.successRate }}% </template>
            </el-table-column>
            <el-table-column label="平均耗时" width="110">
              <template #default="{ row }"> {{ row.avgLatencyMs }}ms </template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag
                  size="small"
                  :type="row.successRate >= 90 ? 'success' : 'warning'"
                >
                  {{ row.successRate >= 90 ? '正常' : '关注' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </section>

      <!-------------------------- 未命中分析 -------------------------->
      <section class="customer-analysis__grid customer-analysis__grid--bottom">
        <el-card shadow="never" class="customer-analysis__panel">
          <template #header>
            <div class="customer-analysis__panel-header">
              <h2>待处理未命中问题</h2>
            </div>
          </template>
          <el-table :data="pendingQuestions" size="small">
            <el-table-column prop="question" label="问题内容" min-width="240" />
            <el-table-column prop="category" label="分类" width="110" />
            <el-table-column
              prop="createdAt"
              label="首次出现时间"
              width="180"
            />
            <el-table-column
              prop="updatedAt"
              label="最新出现时间"
              width="180"
            />
            <el-table-column label="操作" width="92" align="right">
              <template #default="{ row }">
                <el-button link type="danger" @click="openQuestion(row)">
                  去处理
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="customer-analysis__more">
            <el-button link type="primary">
              查看更多
              <ArrowRight :size="16" />
            </el-button>
          </div>
        </el-card>

        <el-card shadow="never" class="customer-analysis__panel">
          <template #header>
            <div class="customer-analysis__panel-header">
              <h2>未命中问题分类分布</h2>
              <el-select
                v-model="categoryScope"
                size="small"
                class="customer-analysis__select"
              >
                <el-option label="本周" value="week" />
                <el-option label="本月" value="month" />
              </el-select>
            </div>
          </template>
          <ChatBarChart :data="categoryChartData" unit="%" />
        </el-card>
      </section>
    </template>

    <!-------------------------- 空状态 -------------------------->
    <el-empty v-else-if="!loading" description="暂无客服分析数据" />
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
  ArrowRight,
  BookOpen,
  Download,
  FileText,
  Info,
  RefreshCw,
  Target,
  Timer,
  Wrench,
  XCircle,
} from 'lucide-vue-next';
import {
  getChatAnalysisOverviewApi,
  listPendingChatQuestionsApi,
} from '@/api/modules/chat-analysis';
import type {
  ChatAnalysisOverview,
  ChatQuestionItem,
} from '@/api/modules/chat-analysis.type';
import ChatBarChart from './components/chat-bar-chart.vue';
import ChatLineChart from './components/chat-line-chart.vue';
import ChatPieChart from './components/chat-pie-chart.vue';
import MetricCard from './components/metric-card.vue';

/******************************** 基础状态 ********************************/

const today = new Date();
const beginDate = new Date(today);
beginDate.setDate(today.getDate() - 6);

const loading = ref(false);
const overview = ref<ChatAnalysisOverview>();
const pendingQuestions = ref<ChatQuestionItem[]>([]);
const trendScope = ref('day');
const categoryScope = ref('week');
const dateRange = ref<[string, string]>([
  beginDate.toISOString().slice(0, 10),
  today.toISOString().slice(0, 10),
]);

/******************************** 页面数据 ********************************/

const metricCards = computed(() => {
  const summary = overview.value!.summary;
  return [
    {
      title: '客服命中数量',
      value: summary.hitCount.toLocaleString(),
      trend: `${summary.hitRate}%`,
      trendType: 'up' as const,
      tone: 'blue' as const,
      icon: Target,
    },
    {
      title: '规则数量',
      value: summary.ruleCount.toLocaleString(),
      trend: `${summary.enabledRuleCount} 启用`,
      trendType: 'up' as const,
      tone: 'blue' as const,
      icon: FileText,
    },
    {
      title: '知识库数量',
      value: summary.knowledgeCount.toLocaleString(),
      trend: `${summary.enabledKnowledgeCount} 启用`,
      trendType: 'up' as const,
      tone: 'green' as const,
      icon: BookOpen,
    },
    {
      title: '未命中数量',
      value: summary.unmatchedCount.toLocaleString(),
      trend: `${summary.pendingQuestionCount} 待处理`,
      trendType: 'down' as const,
      tone: 'red' as const,
      icon: XCircle,
    },
    {
      title: '平均响应耗时',
      value: `${(summary.avgResponseTimeMs / 1000).toFixed(2)}s`,
      trend: `${summary.avgResponseTimeMs}ms`,
      trendType: 'down' as const,
      tone: 'orange' as const,
      icon: Timer,
    },
    {
      title: '工具调用数量',
      value: summary.toolCallCount.toLocaleString(),
      trend: `${summary.toolSuccessRate}%`,
      trendType: 'up' as const,
      tone: 'purple' as const,
      icon: Wrench,
    },
  ];
});

const ruleScoreChartData = computed(() =>
  overview.value!.ruleScoreTop.map((item) => ({
    name: item.ruleName,
    value: Number(item.avgScore.toFixed(1)),
  }))
);

const categoryChartData = computed(() =>
  overview.value!.summary.unmatchedCount === 0
    ? []
    : overview.value!.categoryDistribution.map((item) => ({
        name: item.name,
        value: Number(
          ((item.value / overview.value!.summary.unmatchedCount) * 100).toFixed(
            2
          )
        ),
      }))
);

/******************************** 数据加载 ********************************/

// 加载分析看板数据
async function loadData() {
  loading.value = true;
  const [beginTime, endTime] = dateRange.value;
  try {
    const [analysisResponse, questionResponse] = await Promise.all([
      getChatAnalysisOverviewApi({ beginTime, endTime }),
      listPendingChatQuestionsApi({
        pageNum: 1,
        pageSize: 5,
        status: 'PENDING',
      }),
    ]);
    overview.value = analysisResponse.data!;
    pendingQuestions.value = questionResponse.rows!;
  } finally {
    loading.value = false;
  }
}

// 导出当前分析数据
function exportData() {
  ElMessage.info('当前页面数据已准备好，后续可接入导出接口');
}

// 跳转处理未命中问题
function openQuestion(row: ChatQuestionItem) {
  ElMessage.info(`处理问题：${row.question}`);
}

/******************************** 生命周期 ********************************/

onMounted(loadData);
</script>

<style scoped lang="scss">
.customer-analysis {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 16px;
  padding: 18px;
  background: var(--color-bg-page);
}

.customer-analysis__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 4px 8px;
}

.customer-analysis__title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0;
}

.customer-analysis__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.customer-analysis__date {
  width: 300px;
}

.customer-analysis__metrics {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.customer-analysis__grid {
  display: grid;
  gap: 14px;
}

.customer-analysis__grid--hero {
  grid-template-columns: minmax(0, 1.65fr) minmax(340px, 0.75fr);
}

.customer-analysis__grid--half {
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.4fr);
}

.customer-analysis__grid--bottom {
  grid-template-columns: minmax(0, 1.5fr) minmax(340px, 0.75fr);
}

.customer-analysis__panel {
  border-radius: var(--radius-md);
}

.customer-analysis__panel :deep(.el-card__header) {
  padding: 14px 16px;
}

.customer-analysis__panel :deep(.el-card__body) {
  padding: 14px 16px 16px;
}

.customer-analysis__panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.customer-analysis__panel-header h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 800;
}

.customer-analysis__select {
  width: 88px;
}

.customer-analysis__info {
  color: var(--color-text-secondary);
}

.customer-analysis__pie-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 168px;
  align-items: center;
  gap: 8px;
}

.customer-analysis__legend {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.customer-analysis__legend li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.customer-analysis__legend-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customer-analysis__legend strong {
  color: var(--color-text-primary);
  font-weight: 700;
}

.tool-table :deep(.el-table__cell) {
  padding: 8px 0;
}

.customer-analysis__more {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

@media (max-width: 1280px) {
  .customer-analysis__metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .customer-analysis__grid--hero,
  .customer-analysis__grid--half,
  .customer-analysis__grid--bottom {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 720px) {
  .customer-analysis {
    padding: 12px;
  }

  .customer-analysis__header,
  .customer-analysis__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .customer-analysis__date {
    width: 100%;
  }

  .customer-analysis__metrics {
    grid-template-columns: minmax(0, 1fr);
  }

  .customer-analysis__pie-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
