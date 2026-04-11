// src/composables/useThreeScene.ts
import { ref, shallowRef, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type {
  ThreeSceneOptions,
  ThreeSceneReturn,
  ClickInfo,
} from '@/types/three/index.type';

/**
 * Three.js 场景管理 Hook
 * 提供场景、相机、渲染器、轨道控制等基础功能的封装
 */
export function useThreeScene(
  options: ThreeSceneOptions = {}
): ThreeSceneReturn {
  const {
    cameraFov = 45,
    cameraNear = 0.1,
    cameraFar = 1000,
    cameraPosition = new THREE.Vector3(5, 5, 5),
    backgroundColor = 0x0a0a2a,
    enableShadows = true,
    enableOrbitControls = true,
    showGridHelper = true,
    showAxesHelper = false,
    gridHelperConfig = {
      size: 10,
      divisions: 20,
      colorCenterLine: 0x888888,
      colorGrid: 0x444444,
    },
    ambientLightIntensity = 0.5,
    ambientLightColor = 0x404040,
    addDefaultDirectionalLight = true,
    onClick,
  } = options;

  // DOM 容器引用
  const containerRef = ref<HTMLElement | null>(null);

  // Three.js 核心对象 — 必须用 shallowRef，ref 的深层 Proxy 会破坏 Three.js 内部不可配置属性
  const scene = shallowRef<THREE.Scene | null>(null);
  const camera = shallowRef<THREE.PerspectiveCamera | null>(null);
  const renderer = shallowRef<THREE.WebGLRenderer | null>(null);
  const controls = shallowRef<OrbitControls | null>(null);
  const animationId = ref<number | null>(null);

  // 存储默认添加的光源，以便清理
  const defaultLights: THREE.Light[] = [];

  // 点击射线检测
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  /**
   * 3D 点击原理就是计算可视化窗口宽高加鼠标当前坐标换算出来的 X、Y、Z 坐标
   * @description 可返回点击当前模型的信息
   * @param event 传入回调函数触发带出信息
   * @returns
   */
  const handleClick = (event: MouseEvent) => {
    if (!containerRef.value || !camera.value || !scene.value || !onClick)
      return;
    const rect = containerRef.value.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera.value);
    const intersects = raycaster.intersectObjects(scene.value.children, true);
    if (intersects.length === 0) return;
    const { object, point, distance } = intersects[0];
    const info: ClickInfo = {
      object,
      point,
      distance,
      name: object.name,
      userData: object.userData as Record<string, unknown>,
    };
    onClick(info);
  };

  /**
   * 初始化场景
   */
  const initScene = () => {
    if (!containerRef.value) return;
    // 创建场景
    scene.value = new THREE.Scene();
    scene.value.background = new THREE.Color(backgroundColor);
    scene.value.backgroundIntensity = 1;

    // 创建相机
    const width = containerRef.value.clientWidth;
    const height = containerRef.value.clientHeight;
    camera.value = new THREE.PerspectiveCamera(
      cameraFov,
      width / height,
      cameraNear,
      cameraFar
    );
    camera.value.position.copy(cameraPosition);

    // 创建渲染器
    renderer.value = new THREE.WebGLRenderer({ antialias: true });
    renderer.value.setSize(width, height);
    renderer.value.setPixelRatio(window.devicePixelRatio);

    if (enableShadows) {
      renderer.value.shadowMap.enabled = true;
      renderer.value.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    containerRef.value.appendChild(renderer.value.domElement);

    // 轨道控制
    if (enableOrbitControls && camera.value && renderer.value) {
      controls.value = new OrbitControls(
        camera.value,
        renderer.value.domElement
      );
      controls.value.enableDamping = true;
      controls.value.dampingFactor = 0.05;
      controls.value.zoomSpeed = 1.2;
      controls.value.rotateSpeed = 1.0;
      controls.value.panSpeed = 0.8;
      controls.value.enableZoom = true;
      controls.value.enablePan = true;
      controls.value.target.set(0, 0, 0);
      controls.value.update();
    }

    // 辅助元素
    if (showGridHelper) {
      const gridHelper = new THREE.GridHelper(
        gridHelperConfig.size,
        gridHelperConfig.divisions,
        gridHelperConfig.colorCenterLine,
        gridHelperConfig.colorGrid
      );
      scene.value.add(gridHelper);
    }

    if (showAxesHelper) {
      const axesHelper = new THREE.AxesHelper(5);
      scene.value.add(axesHelper);
    }

    // 默认光照
    const ambientLight = new THREE.AmbientLight(
      ambientLightColor,
      ambientLightIntensity
    );
    scene.value.add(ambientLight);
    defaultLights.push(ambientLight);

    if (addDefaultDirectionalLight) {
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 10, 7);
      directionalLight.castShadow = true;
      directionalLight.receiveShadow = true;
      directionalLight.shadow.mapSize.width = 1024;
      directionalLight.shadow.mapSize.height = 1024;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 15;
      directionalLight.shadow.camera.left = -5;
      directionalLight.shadow.camera.right = 5;
      directionalLight.shadow.camera.top = 5;
      directionalLight.shadow.camera.bottom = -5;
      scene.value.add(directionalLight);
      defaultLights.push(directionalLight);

      // 添加辅助背光
      const backLight = new THREE.DirectionalLight(0x8866ff, 0.4);
      backLight.position.set(-3, 2, -4);
      scene.value.add(backLight);
      defaultLights.push(backLight);
    }

    // 注册点击事件
    if (onClick) {
      containerRef.value.addEventListener('click', handleClick);
    }
  };

  /**
   * 添加物体到场景
   */
  const addObject = (object: THREE.Object3D) => {
    if (scene.value) {
      scene.value.add(object);
    }
  };

  /**
   * 从场景移除物体
   */
  const removeObject = (object: THREE.Object3D) => {
    if (scene.value) {
      scene.value.remove(object);
      // 清理几何体和材质以释放内存
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((m) => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    }
  };

  /**
   * 添加光源
   */
  const addLight = (light: THREE.Light) => {
    if (scene.value) {
      scene.value.add(light);
    }
  };

  /**
   * 开始动画循环
   */
  const startAnimation = (callback?: () => void) => {
    const animate = () => {
      animationId.value = requestAnimationFrame(animate);

      // 更新轨道控制
      if (controls.value) {
        controls.value.update();
      }

      // 执行自定义动画回调
      if (callback) {
        callback();
      }

      // 渲染场景
      if (renderer.value && scene.value && camera.value) {
        renderer.value.render(scene.value, camera.value);
      }
    };

    animate();
  };

  /**
   * 停止动画循环
   */
  const stopAnimation = () => {
    if (animationId.value) {
      cancelAnimationFrame(animationId.value);
      animationId.value = null;
    }
  };

  /**
   * 渲染单帧
   */
  const render = () => {
    if (renderer.value && scene.value && camera.value) {
      if (controls.value) {
        controls.value.update();
      }
      renderer.value.render(scene.value, camera.value);
    }
  };

  /**
   * 响应窗口大小变化
   */
  const onResize = () => {
    if (!containerRef.value || !camera.value || !renderer.value) return;

    const width = containerRef.value.clientWidth;
    const height = containerRef.value.clientHeight;

    camera.value.aspect = width / height;
    camera.value.updateProjectionMatrix();
    renderer.value.setSize(width, height);
  };

  /**
   * 重置相机位置
   */
  const resetCamera = (position?: THREE.Vector3, target?: THREE.Vector3) => {
    if (camera.value) {
      if (position) {
        camera.value.position.copy(position);
      } else {
        camera.value.position.copy(cameraPosition);
      }
    }

    if (controls.value) {
      if (target) {
        controls.value.target.copy(target);
      } else {
        controls.value.target.set(0, 0, 0);
      }
      controls.value.update();
    }
  };

  /**
   * 获取当前宽高比
   */
  const getAspect = (): number => {
    if (!containerRef.value) return 1;
    return containerRef.value.clientWidth / containerRef.value.clientHeight;
  };

  /**
   * 清理场景资源
   */
  const dispose = () => {
    stopAnimation();

    if (controls.value) {
      controls.value.dispose();
    }

    if (renderer.value) {
      renderer.value.dispose();
      if (renderer.value.domElement && renderer.value.domElement.parentNode) {
        renderer.value.domElement.parentNode.removeChild(
          renderer.value.domElement
        );
      }
    }

    if (scene.value) {
      // 清理场景中的所有物体
      scene.value.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((m) => m.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
      scene.value.clear();
    }
  };

  // 生命周期
  onMounted(() => {
    if (containerRef.value) {
      initScene();
      window.addEventListener('resize', onResize);
    }
  });

  onUnmounted(() => {
    window.removeEventListener('resize', onResize);
    if (onClick) containerRef.value?.removeEventListener('click', handleClick);
    dispose();
  });

  return {
    containerRef,
    scene,
    camera,
    renderer,
    controls,
    animationId,
    startAnimation,
    stopAnimation,
    addObject,
    removeObject,
    addLight,
    onResize,
    resetCamera,
    getAspect,
    render,
  };
}
