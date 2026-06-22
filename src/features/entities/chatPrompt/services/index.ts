import { httpClient } from '@/api/client';

/******************************** 提示词类型定义 ********************************/

/** 提示词完整数据 */
export interface ChatPromptData {
  /** 提示词ID */
  prompId?: number;
  /** 名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 提示词内容 */
  content: string;
  /** 分类 */
  category: string;
  /** 标签 */
  tags?: string;
  /** 状态：0禁用，1启用 */
  status?: string;
}

/** 新增提示词参数（不含 prompId） */
export type ChatPromptAddData = Omit<ChatPromptData, 'prompId'>;

/** 修改提示词参数（必须包含 prompId） */
export type ChatPromptUpdateData = Required<Pick<ChatPromptData, 'prompId'>> &
  ChatPromptData;

/******************************** 提示词 API ********************************/

/** 新增提示词 POST /chat/prompt */
export const addChatPromptApi = (data: ChatPromptAddData) => {
  return httpClient.post('/chat/prompt', data);
};

/** 修改提示词 PUT /chat/prompt */
export const editChatPromptApi = (data: ChatPromptUpdateData) => {
  return httpClient.put('/chat/prompt', data);
};
