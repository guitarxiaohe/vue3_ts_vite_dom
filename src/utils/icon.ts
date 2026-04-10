import { defineComponent, defineAsyncComponent, h, type Component } from 'vue';

// 缓存已创建的组件实例，避免重复创建
const iconCache = new Map<string, Component>();

// 预加载 src/assets/svg/icons 下的所有 SVG 图标 (Lazy Load)
// 注意：仅扫描公共图标库。业务模块的图标请在组件内显式 import 后传入 getIcon。
// 使用 ?raw 以便内联 SVG，从而继承 currentColor
const iconModules = import.meta.glob('@/assets/svg/icons/*.svg', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

// 建立 图标名称 -> Loader 的映射
const iconLoaderMap = new Map<string, () => Promise<string>>();

Object.keys(iconModules).forEach((path) => {
  // 提取文件名作为 key，例如: 'reset'
  const fileName = path
    .split('/')
    .pop()
    ?.replace(/\.svg$/, '');
  if (fileName) {
    iconLoaderMap.set(fileName, iconModules[path]);
    // 同时支持带后缀的名称: 'reset.svg'
    iconLoaderMap.set(fileName + '.svg', iconModules[path]);
  }
});

/**
 * 创建内联 SVG 图标组件（渲染层）
 *
 * 内联 SVG 以便继承 currentColor，保证与按钮文字颜色一致。
 */
const createInlineIcon = (svg: string) => {
  return defineComponent({
    name: 'DynamicIcon',
    setup() {
      return () =>
        h('span', {
          class: 'dynamic-icon',
          innerHTML: svg,
        });
    },
  });
};

/**
 * 创建图片图标组件（渲染层）
 */
const createImageIcon = (src: string) => {
  return defineComponent({
    name: 'DynamicIcon',
    setup() {
      return () =>
        h('img', {
          src,
          class: 'dynamic-icon',
          // 保持纯净，不添加默认内联样式
        });
    },
  });
};

/**
 * 获取或创建动态图标组件
 *
 * 将图标名称或图片 URL 转换为 Vue 组件，可直接用于 Element Plus 的 :icon 属性。
 * 支持按需加载（Lazy Load）本地 SVG 图标（内联以继承 currentColor）。
 *
 * @param nameOrSrc - 图标名称 (src/assets/svg/icons 下的文件名，如 'add') 或 完整图片 URL
 * @returns Vue Component
 *
 * @example
 * // 1. 公共图标 (自动加载 src/assets/svg/icons/add.svg)
 * <el-button :icon="getIcon('add')">新建</el-button>
 *
 * // 2. 业务图标 (其他目录下的图标，需显式 import)
 * // import myIcon from '@/features/xxx/assets/my-icon.svg';
 * <el-button :icon="getIcon(myIcon)">业务功能</el-button>
 *
 * // 3. 外部链接
 * <el-button :icon="getIcon('https://example.com/logo.png')">Logo</el-button>
 *
 * // 4. 配合插槽 (图标在右侧)
 * <el-button>
 *   下一步
 *   <el-icon class="el-icon--right">
 *     <component :is="getIcon('arrow-right')" />
 *   </el-icon>
 * </el-button>
 */
export const getIcon = (nameOrSrc: string): Component => {
  // 生成缓存 Key (只依赖 src)
  const cacheKey = nameOrSrc;

  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }

  let component: Component;

  // 1. 尝试从预设映射中查找 Loader (Lazy Load)
  const loader = iconLoaderMap.get(nameOrSrc);

  if (loader) {
    // 使用 defineAsyncComponent 实现按需加载
    component = defineAsyncComponent({
      loader: async () => {
        // 加载模块，获取 SVG 原始内容
        const svg = await loader();
        return createInlineIcon(svg);
      },
      // 加载过程中不显示任何内容，避免闪烁
      loadingComponent: undefined,
      // 只有在加载超过 200ms 后才显示 loadingComponent
      delay: 200,
    });
  } else {
    // 2. 如果没找到，则直接使用传入的字符串作为 src (Sync)
    // 适用于传入完整 URL 的情况
    component = createImageIcon(nameOrSrc);
  }

  iconCache.set(cacheKey, component);
  return component;
};
