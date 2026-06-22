import { httpClient } from '../client';
import type { ChatAskRequest, ChatAskResponse } from './chat-assistant.type';

export function askChatAssistantApi(data: ChatAskRequest) {
  return httpClient.post<ChatAskResponse>('/chat/assistant/ask', data);
}
