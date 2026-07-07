<template>
  <article class="metric-card">
    <div class="metric-card__header">
      <span class="metric-card__label">{{ title }}</span>
    </div>
    <div class="metric-card__body">
      <div class="metric-card__icon" :class="`metric-card__icon--${tone}`">
        <component :is="icon" :size="20" />
      </div>
      <strong class="metric-card__value">{{ value }}</strong>
      <svg class="metric-card__spark" viewBox="0 0 70 28" aria-hidden="true">
        <polyline
          points="2,22 12,18 22,20 32,13 42,16 52,9 68,4"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
    <div class="metric-card__footer">
      <span>较上周期</span>
      <b :class="trendType === 'down' ? 'is-down' : 'is-up'">
        {{ trendType === 'down' ? '↓' : '↑' }} {{ trend }}
      </b>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Component } from 'vue';

/******************************** 组件入参 ********************************/

defineProps<{
  title: string;
  value: string;
  trend: string;
  trendType: 'up' | 'down';
  tone: 'blue' | 'green' | 'red' | 'orange' | 'purple';
  icon: Component;
}>();
</script>

<style scoped lang="scss">
.metric-card {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-card);
  box-shadow: var(--shadow-sm);
}

.metric-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-card__label {
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 600;
}

.metric-card__body {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) 70px;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
}

.metric-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-full);
}

.metric-card__icon--blue {
  color: var(--color-info);
  background: var(--color-info-bg);
}

.metric-card__icon--green {
  color: var(--color-success);
  background: var(--color-success-bg);
}

.metric-card__icon--red {
  color: var(--color-danger);
  background: var(--color-danger-bg);
}

.metric-card__icon--orange {
  color: var(--color-warning);
  background: var(--color-warning-bg);
}

.metric-card__icon--purple {
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.metric-card__value {
  overflow: hidden;
  color: var(--color-text-primary);
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-card__spark {
  width: 70px;
  height: 28px;
  color: var(--color-primary);
}

.metric-card__footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.metric-card__footer b {
  font-weight: 700;
}

.metric-card__footer .is-up {
  color: var(--color-danger);
}

.metric-card__footer .is-down {
  color: var(--color-success);
}
</style>
