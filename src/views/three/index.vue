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
import { ref } from 'vue';
import * as THREE from 'three';
import { useThreeScene } from '@/composables/useThree';

// 使用场景 Hook
const {
  containerRef,
  scene,
  camera,
  controls,
  addObject,
  removeObject,
  resetCamera,
  startAnimation,
  stopAnimation,
  onResize,
} = useThreeScene({
  backgroundColor: 0x1a1a2e,
  cameraPosition: new THREE.Vector3(4, 4, 6),
  showGridHelper: true,
  showAxesHelper: false,
  ambientLightIntensity: 0.4,
  addDefaultDirectionalLight: true,
  enableShadows: true,
});

// 自定义物体引用
let cube: THREE.Mesh | null = null;
let spheres: THREE.Mesh[] = [];
const isRotating = ref(true);

// 创建立方体
/**
 * 所有自定义的模型都需要material加geometry合成
 */
const createCube = () => {
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
};

// 旋转立方体
const rotateCube = () => {
  if (cube) {
    cube.rotation.x += 0.2;
    cube.rotation.y += 0.2;
  }
};

// 添加随机球体
const addRandomSphere = () => {
  const radius = 0.3;
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
    roughness: 0.2,
    metalness: 0.8,
  });
  const sphere = new THREE.Mesh(geometry, material);

  // 随机位置
  sphere.position.x = (Math.random() - 0.5) * 5;
  sphere.position.z = (Math.random() - 0.5) * 5;
  sphere.position.y = radius;

  sphere.castShadow = true;
  sphere.receiveShadow = true;

  addObject(sphere);
  spheres.push(sphere);

  // 5秒后移除
  setTimeout(() => {
    removeObject(sphere);
    spheres = spheres.filter((s) => s !== sphere);
  }, 5000);
};

// 重置视角
const resetView = () => {
  resetCamera(new THREE.Vector3(4, 4, 6), new THREE.Vector3(0, 0, 0));
};

// 切换动画
const toggleRotation = () => {
  isRotating.value = !isRotating.value;
};

// 动画回调
let time = 0;
const animationCallback = () => {
  if (isRotating.value && cube) {
    cube.rotation.y += 0.01;
    cube.rotation.x += 0.005;
  }

  // 让球体浮动
  spheres.forEach((sphere, index) => {
    sphere.position.y = 0.3 + Math.sin(time + index) * 0.1;
  });

  time += 0.02;
};

// 启动动画
startAnimation(animationCallback);

// 窗口尺寸变化时自动处理（Hook 内部已监听）
// 如果需要额外处理，可以调用 onResize
window.addEventListener('resize', () => {
  // Hook 内部的 onResize 会自动调用
  console.log('窗口大小已调整');
});
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
