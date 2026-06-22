<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  Bot,
  LoaderCircle,
  MessageCircle,
  SendHorizontal,
  X,
} from 'lucide-vue-next';
import { ElMessage } from 'element-plus';
import { askChatAssistantApi } from '@/api/modules/chat-assistant';
import type { ChatProduct } from '@/api/modules/chat-assistant.type';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  products: ChatProduct[];
}

const route = useRoute();
const open = ref(false);
const inputValue = ref('');
const sending = ref(false);
const sessionId = ref('');
const messageId = ref(0);
const bodyRef = ref<HTMLElement | null>(null);
const messages = ref<ChatMessage[]>([
  {
    id: ++messageId.value,
    role: 'assistant',
    content: '你好，我是 AI 客服。',
    products: [],
  },
]);

const entityKey = computed(() => {
  const key = route.params.entityKey;
  return typeof key === 'string' ? key : '';
});

const moduleKey = computed(
  () => route.path.split('/').filter(Boolean)[0] || ''
);

function toggleOpen() {
  open.value = !open.value;
  if (open.value) {
    void scrollToBottom();
  }
}

async function scrollToBottom() {
  await nextTick();
  if (bodyRef.value) {
    bodyRef.value.scrollTop = bodyRef.value.scrollHeight;
  }
}

async function sendMessage() {
  const question = inputValue.value.trim();
  if (!question || sending.value) return;

  messages.value.push({
    id: ++messageId.value,
    role: 'user',
    content: question,
    products: [],
  });
  inputValue.value = '';
  sending.value = true;
  await scrollToBottom();

  try {
    const response = await askChatAssistantApi({
      sessionId: sessionId.value,
      question,
      category: '',
      scene: '',
      moduleKey: moduleKey.value,
      entityKey: entityKey.value,
      pagePath: route.fullPath,
    });
    if (!response.data) {
      throw new Error('AI 客服未返回数据');
    }
    sessionId.value = response.data.sessionId;
    if (response.data.redirectUrl) {
      window.open(response.data.redirectUrl, '_blank');
    }
    messages.value.push({
      id: ++messageId.value,
      role: 'assistant',
      content: response.data.answer,
      products: response.data.products,
    });
    await scrollToBottom();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <div class="ai-chat">
    <section v-if="open" class="ai-chat__panel">
      <header class="ai-chat__header">
        <div class="ai-chat__title">
          <Bot :size="18" />
          <strong>AI 客服</strong>
        </div>
        <button type="button" @click="toggleOpen">
          <X :size="16" />
        </button>
      </header>

      <div ref="bodyRef" class="ai-chat__body">
        <article
          v-for="message in messages"
          :key="message.id"
          class="ai-chat__message"
          :class="`is-${message.role}`"
        >
          <div class="ai-chat__bubble">
            <p>{{ message.content }}</p>
          </div>
        </article>
        <article v-if="sending" class="ai-chat__message is-assistant">
          <div class="ai-chat__bubble is-loading">
            <LoaderCircle :size="16" />
            <span>正在回复</span>
          </div>
        </article>
      </div>

      <footer class="ai-chat__footer">
        <el-input
          v-model="inputValue"
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 4 }"
          resize="none"
          placeholder="输入你的问题"
          @keydown.enter.exact.prevent="sendMessage"
        />
        <button
          type="button"
          class="ai-chat__send"
          :disabled="sending || !inputValue.trim()"
          @click="sendMessage"
        >
          <SendHorizontal :size="18" />
        </button>
      </footer>
    </section>

    <button type="button" class="ai-chat__trigger" @click="toggleOpen">
      <MessageCircle v-if="!open" :size="22" />
      <X v-else :size="22" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.ai-chat {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: var(--z-modal);
}

.ai-chat__trigger,
.ai-chat__send,
.ai-chat__header button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  cursor: pointer;
}

.ai-chat__trigger {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 14px 34px rgba(64, 112, 255, 0.32);
}

.ai-chat__panel {
  position: absolute;
  right: 0;
  bottom: 68px;
  display: flex;
  flex-direction: column;
  width: min(390px, calc(100vw - 32px));
  height: min(560px, calc(100vh - 120px));
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--color-bg-card);
  box-shadow: 0 22px 56px rgba(15, 23, 42, 0.18);
}

.ai-chat__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  button {
    width: 30px;
    height: 30px;
    border-radius: 6px;
    background: transparent;
    color: var(--color-text-secondary);
  }
}

.ai-chat__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.ai-chat__body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 14px;
  background: var(--color-bg-page);
}

.ai-chat__message {
  display: flex;
  margin-bottom: 12px;

  &.is-user {
    justify-content: flex-end;

    .ai-chat__bubble {
      background: var(--color-primary);
      color: #fff;
    }
  }
}

.ai-chat__bubble {
  max-width: 86%;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 10px 12px;
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  font-size: 13px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;

  p {
    margin: 0;
  }

  &.is-loading {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
}

.ai-chat__footer {
  display: grid;
  grid-template-columns: 1fr 38px;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.ai-chat__send {
  width: 38px;
  height: 38px;
  align-self: end;
  border-radius: 8px;
  background: var(--color-primary);
  color: #fff;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}
</style>
