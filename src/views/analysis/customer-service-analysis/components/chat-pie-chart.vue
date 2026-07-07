<template>
  <div ref="chartRef" class="chat-pie-chart" />
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import type { ChatAnalysisNameValueItem } from '@/api/modules/chat-analysis.type';

/******************************** 组件入参 ********************************/

const props = defineProps<{
  data: ChatAnalysisNameValueItem[];
  centerText: string;
  centerValue: string;
}>();

/******************************** 图表实例 ********************************/

const chartRef = ref<HTMLDivElement>();
let chart: echarts.ECharts | null = null;

/******************************** 图表渲染 ********************************/

// 渲染饼图
function renderChart() {
  if (!chartRef.value) return;
  if (!chart) {
    chart = echarts.init(chartRef.value);
  }

  chart.setOption({
    color: ['#2f7cf6', '#31b56f', '#f5a416', '#7f62e9', '#27b4c9'],
    tooltip: {
      trigger: 'item',
      formatter: '{b}<br />{d}% ({c})',
    },
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '42%',
        style: {
          text: props.centerText,
          fill: '#667085',
          fontSize: 13,
          fontWeight: 500,
          textAlign: 'center',
        },
      },
      {
        type: 'text',
        left: 'center',
        top: '51%',
        style: {
          text: props.centerValue,
          fill: '#101828',
          fontSize: 20,
          fontWeight: 700,
          textAlign: 'center',
        },
      },
    ],
    series: [
      {
        type: 'pie',
        radius: ['48%', '76%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        label: { show: false },
        labelLine: { show: false },
        data: props.data.map((item) => ({
          name: item.name,
          value: item.value,
        })),
      },
    ],
  });
}

/******************************** 生命周期 ********************************/

watch(() => props.data, renderChart, { deep: true });
watch(() => props.centerValue, renderChart);

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
.chat-pie-chart {
  width: 100%;
  height: 250px;
}
</style>
