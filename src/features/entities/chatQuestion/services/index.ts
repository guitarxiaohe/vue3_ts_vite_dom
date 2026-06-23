import { httpClient } from '@/api/client';

/******************************** 未命中问题类型定义 ********************************/

/** 未命中问题完整数据 */
export interface ChatQuestionData {
  /** 问题ID */
  questionId?: number;
  /** 会话ID */
  sessionId?: string;
  /** 用户问题 */
  question: string;
  /** 分类 */
  category?: string;
  /** 场景 */
  scene?: string;
  /** 模块标识 */
  moduleKey?: string;
  /** 实体标识 */
  entityKey?: string;
  /** 页面路径 */
  pagePath?: string;
  /** 处理状态 */
  status?: string;
  /** 关联规则ID */
  resolvedRuleId?: number;
}

/** 新增未命中问题参数（不含 questionId） */
export type ChatQuestionAddData = Omit<ChatQuestionData, 'questionId'>;

/** 修改未命中问题参数（必须包含 questionId） */
export type ChatQuestionUpdateData = Required<
  Pick<ChatQuestionData, 'questionId'>
> &
  ChatQuestionData;

/******************************** 未命中问题 API ********************************/

/** 查询未命中问题列表 GET /chat/question/list */
export const getChatQuestionListApi = (params?: Record<string, unknown>) => {
  return httpClient.get('/chat/question/list', params);
};

/** 导出未命中问题 POST /chat/question/export */
export const exportChatQuestionApi = (params?: Record<string, unknown>) => {
  return httpClient.post('/chat/question/export', params);
};

/** 获取未命中问题详情 GET /chat/question/{questionId} */
export const getChatQuestionInfoApi = (questionId: number) => {
  return httpClient.get(`/chat/question/${questionId}`);
};

/** 新增未命中问题 POST /chat/question */
export const addChatQuestionApi = (data: ChatQuestionAddData) => {
  return httpClient.post('/chat/question', data);
};

/** 修改未命中问题 PUT /chat/question */
export const editChatQuestionApi = (data: ChatQuestionUpdateData) => {
  return httpClient.put('/chat/question', data);
};

/** 删除未命中问题 DELETE /chat/question/{questionIds} */
export const removeChatQuestionApi = (questionIds: string) => {
  return httpClient.delete(`/chat/question/${questionIds}`);
};

/** AI 根据选中的问题批量生成规则，规则状态为 2（AI 生成） */
export const aiCreateRuleApi = (questionIds: string) => {
  return httpClient.post(`/chat/question/aiCreateRule/${questionIds}`);
};
