import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Ref } from 'vue';

export interface ClickInfo {
  object: THREE.Object3D;
  point: THREE.Vector3;
  distance: number;
  name: string;
  userData: Record<string, unknown>;
}

export interface ThreeSceneOptions {
  cameraFov?: number;
  cameraNear?: number;
  cameraFar?: number;
  cameraPosition?: THREE.Vector3;
  backgroundColor?: THREE.ColorRepresentation;
  enableShadows?: boolean;
  enableOrbitControls?: boolean;
  showGridHelper?: boolean;
  showAxesHelper?: boolean;
  gridHelperConfig?: {
    size?: number;
    divisions?: number;
    colorCenterLine?: THREE.ColorRepresentation;
    colorGrid?: THREE.ColorRepresentation;
  };
  ambientLightIntensity?: number;
  ambientLightColor?: THREE.ColorRepresentation;
  addDefaultDirectionalLight?: boolean;
  onClick?: (info: ClickInfo) => void;
}

export interface ThreeSceneReturn {
  containerRef: Ref<HTMLElement | null>;
  scene: Ref<THREE.Scene | null>;
  camera: Ref<THREE.PerspectiveCamera | null>;
  renderer: Ref<THREE.WebGLRenderer | null>;
  controls: Ref<OrbitControls | null>;
  animationId: Ref<number | null>;
  startAnimation: (callback?: () => void) => void;
  stopAnimation: () => void;
  addObject: (object: THREE.Object3D) => void;
  removeObject: (object: THREE.Object3D) => void;
  addLight: (light: THREE.Light) => void;
  onResize: () => void;
  resetCamera: (position?: THREE.Vector3, target?: THREE.Vector3) => void;
  getAspect: () => number;
  render: () => void;
}
