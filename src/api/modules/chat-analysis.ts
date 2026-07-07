import { httpClient } from '../client';
import type {
  ChatAnalysisOverview,
  ChatAnalysisQuery,
  ChatQuestionItem,
  ChatQuestionListQuery,
} from './chat-analysis.type';

/******************************** 接口方法 ********************************/

// 查询 AI 客服分析总览
export function getChatAnalysisOverviewApi(params: ChatAnalysisQuery) {
  return httpClient.get<ChatAnalysisOverview>(
    '/chat/analysis/overview',
    params
  );
}

// 查询待处理未命中问题
export function listPendingChatQuestionsApi(params: ChatQuestionListQuery) {
  return httpClient.get<ChatQuestionItem>('/chat/question/list', params);
}
