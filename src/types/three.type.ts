import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Ref } from 'vue';

/** 点击场景返回的信息 */
export interface ClickInfo {
  /** 被点击的 Object3D（射线最近的那个） */
  object: THREE.Object3D;
  /** 点击命中的三维坐标 */
  point: THREE.Vector3;
  /** 距相机的距离 */
  distance: number;
  /** 物体名称（object.name） */
  name: string;
  /** 物体上挂载的自定义数据（object.userData） */
  userData: Record<string, unknown>;
}

export interface ThreeSceneOptions {
  /** 相机视角（度数） */
  cameraFov?: number;
  /** 相机近平面 */
  cameraNear?: number;
  /** 相机远平面 */
  cameraFar?: number;
  /** 相机初始位置 */
  cameraPosition?: THREE.Vector3;
  /** 背景颜色 */
  backgroundColor?: THREE.ColorRepresentation;
  /** 是否启用阴影 */
  enableShadows?: boolean;
  /** 是否启用轨道控制 */
  enableOrbitControls?: boolean;
  /** 是否显示辅助网格 */
  showGridHelper?: boolean;
  /** 是否显示坐标轴 */
  showAxesHelper?: boolean;
  /** 网格辅助线配置 */
  gridHelperConfig?: {
    size?: number;
    divisions?: number;
    colorCenterLine?: THREE.ColorRepresentation;
    colorGrid?: THREE.ColorRepresentation;
  };
  /** 环境光强度 */
  ambientLightIntensity?: number;
  /** 环境光颜色 */
  ambientLightColor?: THREE.ColorRepresentation;
  /** 是否添加默认方向光 */
  addDefaultDirectionalLight?: boolean;
  /** 点击场景回调，返回命中的第一个物体信息；未命中任何物体时不触发 */
  onClick?: (info: ClickInfo) => void;
}

export interface ThreeSceneReturn {
  /** 场景容器ref，需要绑定到DOM元素 */
  containerRef: Ref<HTMLElement | null>;
  /** 场景对象 */
  scene: Ref<THREE.Scene | null>;
  /** 相机对象 */
  camera: Ref<THREE.PerspectiveCamera | null>;
  /** 渲染器对象 */
  renderer: Ref<THREE.WebGLRenderer | null>;
  /** 轨道控制对象 */
  controls: Ref<OrbitControls | null>;
  /** 动画循环ID */
  animationId: Ref<number | null>;
  /** 开始动画循环 */
  startAnimation: (callback?: () => void) => void;
  /** 停止动画循环 */
  stopAnimation: () => void;
  /** 添加物体到场景 */
  addObject: (object: THREE.Object3D) => void;
  /** 从场景移除物体 */
  removeObject: (object: THREE.Object3D) => void;
  /** 添加光源 */
  addLight: (light: THREE.Light) => void;
  /** 调整相机大小（响应窗口变化） */
  onResize: () => void;
  /** 重置相机位置和控制器目标 */
  resetCamera: (position?: THREE.Vector3, target?: THREE.Vector3) => void;
  /** 获取场景的宽高比 */
  getAspect: () => number;
  /** 渲染一帧 */
  render: () => void;
}
