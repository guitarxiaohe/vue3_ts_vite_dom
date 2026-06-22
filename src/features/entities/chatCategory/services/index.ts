import { httpClient } from '@/api/client';

/******************************** 分类类型定义 ********************************/

/** 分类完整数据 */
export interface ChatCategoryData {
  /** 分类ID */
  categoryId?: number;
  /** 分类编码 */
  categoryCode: string;
  /** 分类名称 */
  categoryName: string;
  /** 分类描述 */
  description?: string;
  /** 匹配关键词 */
  keywords?: string;
  /** 排序 */
  sort?: number;
  /** 状态：0禁用，1启用 */
  status?: string;
  /** 备注 */
  remark?: string;
}

/** 新增分类参数（不含 categoryId） */
export type ChatCategoryAddData = Omit<ChatCategoryData, 'categoryId'>;

/** 修改分类参数（必须包含 categoryId） */
export type ChatCategoryUpdateData = Required<
  Pick<ChatCategoryData, 'categoryId'>
> &
  ChatCategoryData;

/******************************** 分类 API ********************************/

/** 新增分类 POST /chat/category */
export const addChatCategoryApi = (data: ChatCategoryAddData) => {
  return httpClient.post('/chat/category', data);
};

/** 修改分类 PUT /chat/category */
export const editChatCategoryApi = (data: ChatCategoryUpdateData) => {
  return httpClient.put('/chat/category', data);
};
