<script setup lang="ts">
import { computed } from 'vue';

/**
 * 图片类型单元格组件
 *
 * 功能：
 * - 显示图片缩略图
 * - 支持点击预览大图
 */

interface Props {
  /** 图片 URL 列表 */
  urls: string[];
  /** 最多展示的缩略图数量 */
  maxPreviewCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxPreviewCount: 3,
});

const previewUrls = computed(() => props.urls.filter((url) => url));
// 控制列表密度，保留全部预览能力
const displayUrls = computed(() =>
  previewUrls.value.slice(0, props.maxPreviewCount)
);
const extraCount = computed(() =>
  Math.max(0, previewUrls.value.length - displayUrls.value.length)
);
</script>

<template>
  <div class="picture-cell">
    <template v-if="displayUrls.length > 0">
      <div class="picture-cell__list">
        <el-image
          v-for="(url, index) in displayUrls"
          :key="`${url}-${index}`"
          :src="url"
          :preview-src-list="previewUrls"
          fit="cover"
          class="picture-cell__item"
          :preview-teleported="true"
        />
        <span v-if="extraCount > 0" class="picture-cell__extra">
          +{{ extraCount }}
        </span>
      </div>
    </template>
    <span v-else>-</span>
  </div>
</template>

<style scoped lang="scss">
.picture-cell {
  display: flex;
  align-items: center;
  height: 100%;
}

.picture-cell__list {
  display: flex;
  align-items: center;
  gap: 4px;
}

.picture-cell__item {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
}

.picture-cell__extra {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  background-color: #f2f3f5;
  color: #606266;
  font-size: 12px;
}
</style>
