<template>
  <div ref="chartRef" class="chat-bar-chart" />
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useResizeObserver } from '@vueuse/core';

/******************************** 类型 ********************************/

export interface ChatBarChartItem {
  name: string;
  value: number;
}

/******************************** 组件入参 ********************************/

const props = defineProps<{
  data: ChatBarChartItem[];
  unit: string;
}>();

/******************************** 图表实例 ********************************/

const chartRef = ref<HTMLDivElement>();
let chart: echarts.ECharts | null = null;

/******************************** 图表渲染 ********************************/

// 渲染横向柱状图
function renderChart() {
  if (!chartRef.value) return;
  if (!chart) {
    chart = echarts.init(chartRef.value);
  }

  chart.setOption({
    color: ['#2f7cf6'],
    grid: { left: 92, right: 44, top: 8, bottom: 26 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: `{b}<br />{c}${props.unit}`,
    },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: { color: '#667085' },
      splitLine: { lineStyle: { color: '#e9edf5' } },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: props.data.map((item) => item.name),
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: '#475467', width: 82, overflow: 'truncate' },
    },
    series: [
      {
        type: 'bar',
        barWidth: 9,
        data: props.data.map((item) => item.value),
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
        },
        label: {
          show: true,
          position: 'right',
          color: '#344054',
          formatter: `{c}${props.unit}`,
        },
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
.chat-bar-chart {
  width: 100%;
  height: 250px;
}
</style>
