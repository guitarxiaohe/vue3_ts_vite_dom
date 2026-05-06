<template>
  <div class="scene-container">
    <div ref="containerRef" class="canvas-container"></div>
  </div>
</template>

<script setup lang="ts">
/**
 * 有很多导入模型的 API 这里不展示可以在官网查看
 * 主要了解基础原理 控制模型的动作 位置 光线 阴影
 */
import * as THREE from 'three';
import { useThreeScene } from '@/composables/useThree';

// 使用场景 Hook
const { containerRef, addObject, startAnimation } = useThreeScene({
  backgroundColor: 0x1a1a2e,
  cameraPosition: new THREE.Vector3(4, 4, 6),
  showGridHelper: true,
  showAxesHelper: false,
  ambientLightIntensity: 0.4,
  addDefaultDirectionalLight: true,
  enableShadows: true,
});

void containerRef;

// 自定义物体引用
let cube: THREE.Mesh | null = null;

// 初始化示例立方体
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
  color: 0x42b883,
  roughness: 0.3,
  metalness: 0.7,
});
cube = new THREE.Mesh(geometry, material);
cube.castShadow = true;
cube.receiveShadow = true;
cube.position.y = 0;
addObject(cube);

// 动画回调
const animationCallback = () => {
  if (cube) {
    cube.rotation.y += 0.01;
    cube.rotation.x += 0.005;
  }
};

// 启动动画
startAnimation(animationCallback);
</script>

<style scoped>
.scene-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.canvas-container {
  width: 100%;
  height: 100%;
}

.controls {
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  gap: 10px;
  z-index: 10;
}

.controls button {
  padding: 8px 16px;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.controls button:hover {
  background: #35495e;
  transform: scale(1.02);
}
</style>
