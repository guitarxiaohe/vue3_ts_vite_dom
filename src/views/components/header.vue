<script lang="ts" setup>
/**
 * 根据接口写出首页的分析表
 * 图标
 */
</script>

<template>
  <div class="layout-header">
    <div class="layout-header-text">GUITARXIAOHE</div>
  </div>
</template>

<style lang="scss" scoped>
.layout-header {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2vw;
  background: url('../../assets/qw.png') no-repeat center center;
  background-clip: text;
  color: #090000;
  font-weight: 900;
  height: 100vh;
  animation: slide-in 3s;
}
@keyframes slide-in {
  0% {
    font-size: 300vw;
    color: transparent;
  }
  50% {
    color: transparent;
  }
  75% {
    color: transparent;
  }
  100% {
    font-size: 2vw;
    color: #090000;
  }
}
</style>
