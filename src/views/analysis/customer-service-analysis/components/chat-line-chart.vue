<template>
  <div ref="chartRef" class="chat-line-chart" />
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import type { ChatAnalysisTrendItem } from '@/api/modules/chat-analysis.type';

/******************************** 组件入参 ********************************/

const props = defineProps<{
  data: ChatAnalysisTrendItem[];
}>();

/******************************** 图表实例 ********************************/

const chartRef = ref<HTMLDivElement>();
let chart: echarts.ECharts | null = null;

/******************************** 图表渲染 ********************************/

// 渲染趋势折线图
function renderChart() {
  if (!chartRef.value) return;
  if (!chart) {
    chart = echarts.init(chartRef.value);
  }

  chart.setOption({
    color: ['#2f7cf6', '#31b56f', '#ef4444', '#f59e0b'],
    tooltip: { trigger: 'axis' },
    legend: {
      top: 2,
      right: 0,
      itemWidth: 18,
      itemHeight: 8,
      textStyle: { color: '#475467' },
    },
    grid: { left: 44, right: 18, top: 44, bottom: 28 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.data.map((item) => item.statDate.slice(5)),
      axisTick: { show: false },
      axisLabel: { color: '#667085' },
      axisLine: { lineStyle: { color: '#d0d5dd' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#667085' },
      splitLine: { lineStyle: { color: '#e9edf5', type: 'dashed' } },
    },
    series: [
      {
        name: '规则命中',
        type: 'line',
        smooth: true,
        symbolSize: 7,
        data: props.data.map((item) => item.ruleHitCount),
      },
      {
        name: 'AI兜底',
        type: 'line',
        smooth: true,
        symbolSize: 7,
        data: props.data.map((item) => item.aiFallbackCount),
      },
      {
        name: '未命中',
        type: 'line',
        smooth: true,
        symbolSize: 7,
        data: props.data.map((item) => item.unmatchedCount),
      },
      {
        name: '工具调用',
        type: 'line',
        smooth: true,
        symbolSize: 7,
        data: props.data.map((item) => item.toolCallCount),
      },
    ],
  });
}

/******************************** 生命周期 ********************************/

watch(() => props.data, renderChart, { deep: true });

onMounted(renderChart);

useResizeObserver(chartRef, () => {
  chart?.resize();
});

onBeforeUnmount(() => {
  chart?.dispose();
  chart = null;
});
</script>

<style scoped lang="scss">
.chat-line-chart {
  width: 100%;
  height: 260px;
}
</style>
