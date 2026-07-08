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
      <strong>{{ t('meeting.liveTranscriptPanelTitle') }}</strong>
      <small>{{ t('meeting.transcribingStatus') }}</small>
    </div>

    <div class="meeting-live-feed__content">
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
            {{ t('meeting.speakerSays', { name: item.displayLabel }) }}
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

      <!-- <el-empty
        v-if="blockCount === 0"
        :description="t('meeting.rawTranscriptEmpty')"
      /> -->
    </div>
  </div>
</template>

<style lang="scss" scoped>
.meeting-live-feed {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
  padding: 12px;
  border-radius: 0;
  overflow: hidden;
  background: #ffffff;
  border: 0;
}

.meeting-live-feed__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

.meeting-live-feed__meta strong {
  color: #111827;
  font-size: 13px;
  font-weight: 700;
}

.meeting-live-feed__meta small {
  height: 18px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  border-radius: 999px;
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  background: #00a870;
}

.meeting-live-feed__meta small::before {
  width: 5px;
  height: 5px;
  content: '';
  border-radius: 50%;
  background: #ffffff;
}

.meeting-live-feed__content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  overflow-y: auto;
  background: #f7f8fa;
}

.meeting-live-feed--scrollable {
  max-height: none;
  overflow: hidden;
}

.meeting-live-line {
  width: 100%;
}

.meeting-live-line__label {
  color: #4f46e5;
  font-size: 12px;
  line-height: 1.65;
  font-weight: 700;
}

.meeting-live-line__text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.65;
  color: #111827;
  font-size: 12px;
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
