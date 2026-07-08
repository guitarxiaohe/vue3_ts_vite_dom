<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { LoaderCircle } from 'lucide-vue-next';

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    text?: string;
    status?: string;
    renderKey?: string;
  }>(),
  {
    text: '',
    status: '',
    renderKey: '',
  }
);
</script>

<template>
  <div
    :class="[
      'meeting-live-summary',
      status === 'streaming' ? 'meeting-live-summary--streaming' : '',
    ]"
  >
    <div class="meeting-live-summary__meta">
      <strong>{{ t('meeting.aiSummaryTitle') }}</strong>
      <small class="meeting-live-summary__polishing-label">
        <LoaderCircle class="is-loading" :size="12" />
        {{ t('meeting.aiSummaryPolishing') }}
      </small>
    </div>

    <transition name="meeting-summary-fade" mode="out-in">
      <p
        v-if="text"
        :key="renderKey"
        class="meeting-live-summary__text"
      >
        {{ text }}
        <span
          v-if="status === 'streaming'"
          class="meeting-live-summary__typing-cursor"
        />
      </p>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.meeting-live-summary {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: #ffffff;
}

.meeting-live-summary__meta {
  strong {
    color: #5046e5ff;
    font-size: 13px;
    font-weight: 700;
  }
}

.meeting-live-summary__polishing-label {
  margin-left: 5px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: 80px;
  height: 22px;
  padding: 2px 8px;
  color: #fff;
  font-family: Inter;
  font-size: 11px;
  font-weight: 500;
  font-style: normal;
  text-decoration-line: none;
  line-height: normal;
  background: #5046e5;
  border-radius: 100px;
}

.meeting-live-summary__text {
  margin: 0;
  padding: 10px;
  border-radius: 8px;
  color: #111827;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  background: #f7f8fa;
}

.meeting-live-summary__typing-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  margin-left: 2px;
  background: #4f46e5;
  vertical-align: text-bottom;
  animation: meeting-cursor-blink 0.8s step-end infinite;
}

@keyframes meeting-cursor-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>
