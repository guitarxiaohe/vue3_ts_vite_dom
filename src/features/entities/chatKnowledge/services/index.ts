import { httpClient } from '@/api/client';

/******************************** 知识库类型定义 ********************************/

/** 知识库完整数据 */
export interface ChatKnowledgeData {
  /** 知识ID */
  knowledgeId?: number;
  /** 标题 */
  title: string;
  /** 典型问题 */
  question: string;
  /** 标准答案 */
  answer: string;
  /** 分类 */
  category?: string;
  /** 场景 */
  scene?: string;
  /** 关键词 */
  keywords?: string;
  /** 模块标识 */
  moduleKey?: string;
  /** 实体标识 */
  entityKey?: string;
  /** 排序 */
  sort?: number;
  /** 状态：0禁用，1启用 */
  status?: string;
}

/** 新增知识库参数（不含 knowledgeId） */
export type ChatKnowledgeAddData = Omit<ChatKnowledgeData, 'knowledgeId'>;

/** 修改知识库参数（必须包含 knowledgeId） */
export type ChatKnowledgeUpdateData = Required<
  Pick<ChatKnowledgeData, 'knowledgeId'>
> &
  ChatKnowledgeData;

/******************************** 知识库 API ********************************/

/** 新增知识库 POST /chat/knowledge */
export const addChatKnowledgeApi = (data: ChatKnowledgeAddData) => {
  return httpClient.post('/chat/knowledge', data);
};

/** 修改知识库 PUT /chat/knowledge */
export const editChatKnowledgeApi = (data: ChatKnowledgeUpdateData) => {
  return httpClient.put('/chat/knowledge', data);
};
