<template>
  <div
    ref="pupilRef"
    class="pupil"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: pupilColor,
      transform: `translate(${position.x}px, ${position.y}px)`,
    }"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';

const props = withDefaults(
  defineProps<{
    size?: number;
    maxDistance?: number;
    pupilColor?: string;
    forceLookX?: number;
    forceLookY?: number;
  }>(),
  {
    size: 12,
    maxDistance: 5,
    pupilColor: 'black',
  }
);

const mouseX = ref(0);
const mouseY = ref(0);
const pupilRef = ref<HTMLElement | null>(null);

const handleMouseMove = (e: MouseEvent) => {
  mouseX.value = e.clientX;
  mouseY.value = e.clientY;
};

const position = computed(() => {
  if (!pupilRef.value) return { x: 0, y: 0 };

  if (props.forceLookX !== undefined && props.forceLookY !== undefined) {
    return { x: props.forceLookX, y: props.forceLookY };
  }

  const rect = pupilRef.value.getBoundingClientRect();
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
.pupil {
  border-radius: 9999px;
  transition: transform 0.1s ease-out;
}
</style>
