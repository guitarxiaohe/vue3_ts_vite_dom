<script lang="ts" setup>
import { computed, ref, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CmsMeetingInteraction } from '@/api/modules/meeting.type';

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    messages?: CmsMeetingInteraction[];
    isSending?: boolean;
    placeholder?: string;
  }>(),
  {
    messages: () => [],
    isSending: false,
    placeholder: '',
  }
);

const emit = defineEmits<{
  'send-text': [content: string];
}>();

const inputText = ref('');
const bodyRef = ref<HTMLDivElement | null>(null);

function handleSend() {
  const content = inputText.value.trim();
  if (!content || props.isSending) return;
  inputText.value = '';
  emit('send-text', content);
}

// 新消息到达时自动滚到底部
watch(
  () => props.messages.length,
  async () => {
    await nextTick();
    if (bodyRef.value) {
      bodyRef.value.scrollTo({
        top: bodyRef.value.scrollHeight,
        behavior: 'smooth',
      });
    }
  }
);

function avatarChar(item: CmsMeetingInteraction): string {
  const name = item.displayName || t('meeting.defaultGuestName');
  return name.charAt(0);
}

const resolvedPlaceholder = computed(() =>
  props.placeholder || t('meeting.interactionTextPlaceholder')
);
</script>

<template>
  <div class="meeting-chat-panel">
    <div class="meeting-chat-panel__header">
      <strong>{{ t('meeting.interactionChatTitle') }}</strong>
      <small>
        {{
          t('meeting.interactionChatCount', {
            count: messages.length,
          })
        }}
      </small>
    </div>

    <div ref="bodyRef" class="meeting-chat-panel__body">
      <div
        v-for="item in messages"
        :key="`${item.userId}-${item.createdAt}`"
        class="meeting-chat-message"
      >
        <span class="meeting-chat-message__avatar">
          {{ avatarChar(item) }}
        </span>
        <p>
          <strong>{{ item.displayName }}</strong>
          <span>{{ item.content }}</span>
        </p>
      </div>
    </div>

    <div class="meeting-chat-panel__input">
      <el-input
        v-model="inputText"
        maxlength="40"
        clearable
        :placeholder="resolvedPlaceholder"
        :disabled="isSending"
        @keyup.enter="handleSend"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.meeting-chat-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: #ffffff;
}

.meeting-chat-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  strong {
    color: #5046e5ff;
    font-size: 13px;
    font-weight: 700;
  }

  small {
    color: #98a2b3;
    font-size: 12px;
  }
}

.meeting-chat-panel__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding: 8px;
  border-radius: 8px;
  background: #f7f8fa;
}

.meeting-chat-message {
  display: flex;
  gap: 8px;
  align-items: flex-start;

  p {
    margin: 0;
    display: grid;
    gap: 2px;
    color: #111827;
    font-size: 13px;
    line-height: 1.45;
  }

  strong {
    color: #4f46e5;
    font-size: 12px;
  }
}

.meeting-chat-message__avatar {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 22px;
  border-radius: 50%;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  background: #4f46e5;
}

.meeting-chat-panel__input {
  display: flex;

  :deep(.el-input__wrapper) {
    min-height: 30px;
    border-radius: 6px;
    background: #f8f9fb;
    box-shadow: 0 0 0 1px #e5e7eb inset;
  }
}
</style>
