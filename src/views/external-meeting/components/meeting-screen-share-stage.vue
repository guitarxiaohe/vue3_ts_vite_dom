<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

defineProps<{
  currentSharerName: string;
  hasRemoteScreenShare: boolean;
}>();

const emit = defineEmits<{
  videoReady: [element: HTMLDivElement | null];
}>();

const { t } = useI18n();
const videoRef = ref<HTMLDivElement | null>(null);

onMounted(() => {
  emit('videoReady', videoRef.value);
});

onBeforeUnmount(() => {
  emit('videoReady', null);
});
</script>

<template>
  <section class="meeting-share-stage">
    <div class="meeting-share-stage__header">
      <span>
        {{
          t('meeting.shareScreenStageTitle', {
            name: currentSharerName,
          })
        }}
      </span>
    </div>
    <div class="meeting-share-stage__content">
      <div ref="videoRef" class="meeting-share-stage__video" />
      <p v-if="!hasRemoteScreenShare">
        {{ t('meeting.shareScreenPlaceholder') }}
      </p>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.meeting-share-stage {
  flex: 1;
  min-height: min(680px, calc(100vh - 154px));
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-card);
  overflow: hidden;
  box-shadow: 0 10px 28px rgba(17, 24, 39, 0.06);

  &__header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    height: 48px;
    padding: 0 16px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg-card);
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: 600;
  }

  &__content {
    display: flex;
    align-items: center;
    justify-content: center;
    height: calc(100% - 48px);
    min-height: min(632px, calc(100vh - 202px));
    padding: 16px;
    color: rgba(255, 255, 255, 0.72);
    background: #111827;

    p {
      margin: 0;
      font-size: 14px;
    }
  }

  &__video {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: min(600px, calc(100vh - 234px));
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    overflow: hidden;
    border-radius: 8px;
    background: #050816;

    :deep(video) {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #050816;
    }

    @supports (-webkit-appearance: none) and (object-fit: contain) {
      :deep(video) {
        object-fit: contain;
      }
    }
  }
}

@media (max-width: 1024px) {
  .meeting-share-stage {
    min-height: min(620px, calc(100vh - 160px));

    &__content {
      min-height: min(572px, calc(100vh - 208px));
      padding: 12px;
    }

    &__video {
      min-height: min(548px, calc(100vh - 232px));
    }
  }
}
</style>
