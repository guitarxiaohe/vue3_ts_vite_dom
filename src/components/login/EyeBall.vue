<template>
  <div
    ref="eyeRef"
    class="eyeball"
    :style="{
      width: `${size}px`,
      height: isBlinking ? '2px' : `${size}px`,
      backgroundColor: eyeColor,
    }"
  >
    <div
      v-if="!isBlinking"
      class="pupil"
      :style="{
        width: `${pupilSize}px`,
        height: `${pupilSize}px`,
        backgroundColor: pupilColor,
        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';

const props = withDefaults(
  defineProps<{
    size?: number;
    pupilSize?: number;
    maxDistance?: number;
    eyeColor?: string;
    pupilColor?: string;
    isBlinking?: boolean;
    forceLookX?: number;
    forceLookY?: number;
  }>(),
  {
    size: 48,
    pupilSize: 16,
    maxDistance: 10,
    eyeColor: 'white',
    pupilColor: 'black',
    isBlinking: false,
  }
);

const mouseX = ref(0);
const mouseY = ref(0);
const eyeRef = ref<HTMLElement | null>(null);

const handleMouseMove = (e: MouseEvent) => {
  mouseX.value = e.clientX;
  mouseY.value = e.clientY;
};

const pupilPosition = computed(() => {
  if (!eyeRef.value) return { x: 0, y: 0 };

  if (props.forceLookX !== undefined && props.forceLookY !== undefined) {
    return { x: props.forceLookX, y: props.forceLookY };
  }

  const rect = eyeRef.value.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const deltaX = mouseX.value - centerX;
  const deltaY = mouseY.value - centerY;
  const distance = Math.min(
    Math.sqrt(deltaX ** 2 + deltaY ** 2),
    props.maxDistance
  );
  const angle = Math.atan2(deltaY, deltaX);

  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
  };
});

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
});
</script>

<style scoped>
.eyeball {
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  overflow: hidden;
}

.pupil {
  border-radius: 9999px;
  transition: transform 0.1s ease-out;
}
</style>
