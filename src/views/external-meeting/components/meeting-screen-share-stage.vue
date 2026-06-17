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
  min-height: calc(100vh - 220px);
  border: 1px solid var(--color-primary-light);
  border-radius: 24px;
  background: var(--color-bg-page);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 14px 20px;
    background: var(--color-primary-light);
    font-size: 15px;
    font-weight: 600;
  }

  &__content {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - 288px);
    padding: 28px;
    color: var(--color-text-secondary);
    background: #1a1a2e;

    p {
      margin: 0;
      font-size: 14px;
    }
  }

  &__video {
    position: relative;
    width: 100%;
    min-height: calc(100vh - 344px);
    height: calc(100vh - 344px);
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    overflow: hidden;
    border-radius: 18px;
    background: rgba(15, 23, 42, 0.32);

    :deep(video) {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #050816;
    }

    @supports (-webkit-appearance: none) and (object-fit: contain) {
      :deep(video) {
        object-fit: cover;
      }
    }
  }
}

@media (max-width: 1024px) {
  .meeting-share-stage {
    min-height: calc(100vh - 200px);

    &__content {
      min-height: calc(100vh - 252px);
      padding: 18px;
    }

    &__video {
      min-height: calc(100vh - 288px);
      height: calc(100vh - 288px);
    }
  }
}
</style>
