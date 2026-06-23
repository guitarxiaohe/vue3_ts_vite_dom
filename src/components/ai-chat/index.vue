<script setup lang="ts">
/******************************** 依赖与类型 ********************************/

import { computed, nextTick, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  Bot,
  LoaderCircle,
  MessageCircle,
  SendHorizontal,
  X,
} from 'lucide-vue-next';
import { ElMessage } from 'element-plus';
import { askChatAssistantApi } from '@/api/modules/chat-assistant';
import type {
  ChatFaqCategory,
  ChatFaqPage,
  ChatProduct,
  ChatRecommendation,
} from '@/api/modules/chat-assistant.type';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  products: ChatProduct[];
  recommendations: ChatRecommendation[];
  faqCategories: ChatFaqCategory[];
  faqPages: ChatFaqPage[];
}

/******************************** 状态与计算属性 ********************************/

const { t } = useI18n();
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
    content: t('aiChat.greeting'),
    products: [],
    recommendations: [],
    faqCategories: [],
    faqPages: [],
  },
]);

const entityKey = computed(() => {
  const key = route.params.entityKey;
  return typeof key === 'string' ? key : '';
});

const moduleKey = computed(
  () => route.path.split('/').filter(Boolean)[0] || ''
);

/******************************** 方法 ********************************/

// 切换聊天面板
function toggleOpen() {
  open.value = !open.value;
  if (open.value) {
    void scrollToBottom();
  }
}

// 滚动到底部
async function scrollToBottom() {
  await nextTick();
  if (bodyRef.value) {
    bodyRef.value.scrollTop = bodyRef.value.scrollHeight;
  }
}

// 发送聊天消息
async function sendMessage() {
  const question = inputValue.value.trim();
  if (!question || sending.value) return;

  messages.value.push({
    id: ++messageId.value,
    role: 'user',
    content: question,
    products: [],
    recommendations: [],
    faqCategories: [],
    faqPages: [],
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
      throw new Error(t('aiChat.errors.empty'));
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
      recommendations: response.data.recommendations,
      faqCategories: response.data.faqCategories,
      faqPages: response.data.faqPages,
    });
    await scrollToBottom();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    sending.value = false;
  }
}

// 生成可展示的 FAQ 摘要
function resolveFaqSummary(page: ChatFaqPage): string {
  return page.summary || page.contentText || '';
}
</script>

<template>
  <div class="ai-chat">
    <section v-if="open" class="ai-chat__panel">
      <header class="ai-chat__header">
        <div class="ai-chat__title">
          <Bot :size="18" />
          <strong>{{ t('aiChat.title') }}</strong>
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
          <!-------------------------- 商品列表 -------------------------->
          <div
            v-if="message.products.length"
            class="ai-chat__section ai-chat__section--cards"
          >
            <div class="ai-chat__section-title">
              {{ t('aiChat.sections.products') }}
            </div>
            <a
              v-for="product in message.products"
              :key="product.productId"
              class="ai-chat__card"
              :href="product.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div class="ai-chat__card-title">{{ product.name }}</div>
              <div v-if="product.sku" class="ai-chat__card-meta">
                {{ t('aiChat.fields.sku') }}: {{ product.sku }}
              </div>
              <div v-if="product.model" class="ai-chat__card-meta">
                {{ t('aiChat.fields.model') }}: {{ product.model }}
              </div>
              <div v-if="product.priceFormat" class="ai-chat__card-price">
                {{ product.priceFormat }}
              </div>
            </a>
          </div>
          <!-------------------------- 推荐列表 -------------------------->
          <div
            v-if="message.recommendations.length"
            class="ai-chat__section ai-chat__section--cards"
          >
            <div class="ai-chat__section-title">
              {{ t('aiChat.sections.recommendations') }}
            </div>
            <a
              v-for="(recommendation, index) in message.recommendations"
              :key="`${recommendation.source}-${recommendation.id ?? index}`"
              class="ai-chat__card"
              :href="recommendation.url || undefined"
              :target="recommendation.url ? '_blank' : undefined"
              :rel="recommendation.url ? 'noopener noreferrer' : undefined"
            >
              <div class="ai-chat__card-title">{{ recommendation.name }}</div>
              <div class="ai-chat__card-meta">
                {{ recommendation.source }}
              </div>
            </a>
          </div>
          <!-------------------------- FAQ 页面 -------------------------->
          <div
            v-if="message.faqPages.length"
            class="ai-chat__section ai-chat__section--cards"
          >
            <div class="ai-chat__section-title">
              {{ t('aiChat.sections.faqPages') }}
            </div>
            <a
              v-for="page in message.faqPages"
              :key="page.id"
              class="ai-chat__card"
              :href="page.url || page.nuxtUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div class="ai-chat__card-title">{{ page.title }}</div>
              <div
                v-if="resolveFaqSummary(page)"
                class="ai-chat__card-description"
              >
                {{ resolveFaqSummary(page) }}
              </div>
            </a>
          </div>
          <!-------------------------- FAQ 分类 -------------------------->
          <div
            v-if="message.faqCategories.length"
            class="ai-chat__section ai-chat__section--cards"
          >
            <div class="ai-chat__section-title">
              {{ t('aiChat.sections.faqCategories') }}
            </div>
            <a
              v-for="category in message.faqCategories"
              :key="category.id"
              class="ai-chat__card"
              :href="category.url || category.nuxtUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div class="ai-chat__card-title">{{ category.title }}</div>
              <div class="ai-chat__card-meta">
                {{ t('aiChat.count', { count: category.count }) }}
              </div>
            </a>
          </div>
        </article>
        <article v-if="sending" class="ai-chat__message is-assistant">
          <div class="ai-chat__bubble is-loading">
            <LoaderCircle :size="16" />
            <span>{{ t('aiChat.loading') }}</span>
          </div>
        </article>
      </div>

      <footer class="ai-chat__footer">
        <el-input
          v-model="inputValue"
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 4 }"
          resize="none"
          :placeholder="t('aiChat.placeholder')"
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
/******************************** ai-chat 样式 ********************************/

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
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 12px;

  &.is-user {
    align-items: flex-end;

    .ai-chat__bubble {
      background: var(--color-primary);
      color: #fff;
    }
  }
}

.ai-chat__section {
  display: grid;
  gap: 8px;
  width: min(86%, 100%);
  margin-top: 8px;
}

.ai-chat__section--cards {
  grid-template-columns: 1fr;
}

.ai-chat__section-title {
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.ai-chat__card {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  text-decoration: none;
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast);

  &:hover {
    border-color: var(--color-primary);
    background: var(--color-bg-hover);
  }
}

.ai-chat__card-title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
}

.ai-chat__card-meta,
.ai-chat__card-description {
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.ai-chat__card-description {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.ai-chat__card-price {
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
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
