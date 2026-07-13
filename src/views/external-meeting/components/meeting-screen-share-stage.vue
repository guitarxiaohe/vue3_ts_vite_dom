<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFullscreen } from '@vueuse/core';

defineProps<{
  currentSharerName: string;
  hasRemoteScreenShare: boolean;
}>();

const emit = defineEmits<{
  videoReady: [element: HTMLDivElement | null];
}>();

const { t } = useI18n();
const videoRef = ref<HTMLDivElement | null>(null);

// 全屏
const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(videoRef);
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
      <div ref="videoRef" class="meeting-share-stage__video">
        <div class="cc">
          <span class="cc__btn" @click="toggleFullscreen()">
            {{
              isFullscreen
                ? t('meeting.exitFullscreen')
                : t('meeting.enterFullscreen')
            }}
          </span>
        </div>
      </div>
      <p v-if="!hasRemoteScreenShare">
        {{ t('meeting.shareScreenPlaceholder') }}
      </p>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.meeting-share-stage {
  position: relative;
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  overflow: hidden;
  background: #111318;

  &__header {
    position: absolute;
    top: 32px;
    left: 50%;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    height: auto;
    padding: 0;
    border-bottom: 0;
    background: transparent;
    color: #ffffff;
    font-size: 14px;
    font-weight: 700;
    transform: translateX(-50%);
  }

  &__content {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    min-height: 0;
    padding: 0;
    color: #667085;
    border-radius: 0;
    background: #111318;
    overflow: hidden;
    .cc {
      position: absolute;
      right: 0;
      bottom: 0;
      opacity: 0;
      transition: all 0.5s;
    }

    p {
      position: absolute;
      left: 50%;
      top: 50%;
      margin: 0;
      font-size: 13px;
      transform: translate(-50%, -50%);
    }
  }

  &__video {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 0;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    overflow: hidden;
    border-radius: 0;
    background: #111318;

    :deep(video) {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #111318;
    }

    @supports (-webkit-appearance: none) and (object-fit: contain) {
      :deep(video) {
        object-fit: contain;
      }
    }
  }
  &__video:hover {
    .cc {
      opacity: 1;
    }
  }
}

@media (max-width: 1024px) {
  .meeting-share-stage {
    &__content {
      width: 100%;
      min-height: 0;
    }

    &__video {
      min-height: 0;
    }
  }
}

@media (max-width: 640px) {
  .meeting-share-stage {
    &__content {
      width: 100%;
      height: 100%;
      min-height: 0;
      border-radius: 0;
    }
  }
}
</style>
