<script lang="ts" setup>
import { nextTick, ref, watch } from 'vue';
import { LoaderCircle } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import type { SpeakerTranscriptLine } from '@/utils/meeting-transcript';

const props = defineProps<{
  lines: SpeakerTranscriptLine[];
  blockCount: number;
}>();

const { t } = useI18n();
const transcriptPanelRef = ref<HTMLElement | null>(null);

function scrollTranscriptPanelToBottom() {
  if (!transcriptPanelRef.value) {
    return;
  }
  transcriptPanelRef.value.scrollTop = transcriptPanelRef.value.scrollHeight;
}

watch(
  () => props.lines.map((item) => `${item.id}:${item.text}`).join('|'),
  async () => {
    await nextTick();
    scrollTranscriptPanelToBottom();
  }
);
</script>

<template>
  <div
    ref="transcriptPanelRef"
    class="meeting-live-feed meeting-live-feed--scrollable"
  >
    <div class="meeting-live-feed__meta">
      <strong>AI 实时字幕及转写</strong>
    </div>

    <div
      v-for="item in lines"
      :key="item.id"
      :class="[
        'meeting-live-line',
        item.pending ? 'meeting-live-block--pending' : '',
      ]"
    >
      <p class="meeting-live-line__text">
        <strong class="meeting-live-line__label">
          {{ item.displayLabel }}说：
        </strong>
        {{ item.text }}
        <small
          v-if="item.pending"
          class="meeting-transcript-pending-label meeting-live-line__pending"
        >
          <el-icon class="is-loading" :size="12">
            <LoaderCircle />
          </el-icon>
          {{ t('meeting.liveDigestPolishing') }}
        </small>
        <span v-if="item.pending" class="typing-cursor" />
      </p>
    </div>

    <el-empty
      v-if="blockCount === 0"
      :description="t('meeting.rawTranscriptEmpty')"
    />
  </div>
</template>

<style lang="scss" scoped>
.meeting-live-feed {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 320px;
  padding: 16px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
}

.meeting-live-feed__meta {
  display: flex;
  align-items: center;
  margin-bottom: 2px;
}

.meeting-live-feed__meta strong {
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.meeting-live-feed--scrollable {
  max-height: calc(100vh - 392px);
  overflow-y: auto;
}

.meeting-live-line {
  width: 100%;
}

.meeting-live-line__label {
  color: var(--color-text-primary);
  font-size: 13px;
  line-height: 1.75;
  font-weight: 700;
}

.meeting-live-line__text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.75;
  color: var(--color-text-primary);
  font-size: 13px;
}

.meeting-live-line__pending {
  margin-left: 8px;
  vertical-align: middle;
}

.meeting-live-block--pending .meeting-live-line__label {
  color: var(--color-primary-dark);
}

.meeting-transcript-pending-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-primary);
  font-size: 12px;
}

.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  margin-left: 2px;
  background: var(--color-primary);
  vertical-align: text-bottom;
  animation: cursor-blink 0.8s step-end infinite;
}

@keyframes cursor-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>
