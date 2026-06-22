<script setup lang="ts">
import { ref } from 'vue';
import { QuestionFilled } from '@element-plus/icons-vue';
import ChatRuleManualDialog from '@/components/chat-rule-manual-dialog/index.vue';

/******************************** 如何新增规则 — 帮助弹窗入口 ********************************/

const visible = ref(false);

function open() {
  visible.value = true;
}
</script>

<template>
  <el-button type="primary" :icon="QuestionFilled" @click="open">
    如何新增分类
  </el-button>

  <ChatRuleManualDialog v-model="visible" type="chatCategory" />
</template>
