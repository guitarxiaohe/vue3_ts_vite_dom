import { httpClient } from '@/api/client';

/******************************** 聊天规则类型定义 ********************************/

/** 规则匹配方式 */
export type MatchType = 'KEYWORD' | 'REGEX' | 'INTENT';

/** 规则动作类型  字典 chat_rule_match_type*/
export type ActionType =
  | 'ANSWER'
  | 'PRODUCT_SEARCH'
  | 'PRICE_QUERY'
  | 'ASK_REDIRECT'
  | 'REDIRECT'
  | 'HANDOFF';

/** 规则状态：0禁用，1启用，2AI生成 */
export type RuleStatus = '0' | '1' | '2';

/** 聊天规则完整数据 */
export interface ChatRuleData {
  /** 规则ID */
  ruleId?: number;
  /** 规则编码 */
  ruleCode: string;
  /** 规则名称 */
  ruleName: string;
  /** 命中后分类 */
  category: string;
  /** 匹配方式：KEYWORD/REGEX/INTENT */
  matchType: MatchType;
  /** 匹配内容，关键词逗号分隔或正则 */
  matchPattern: string;
  /** 优先级，越小越优先 */
  priority: number;
  /** 动作类型 */
  actionType: ActionType;
  /** 动作配置 JSON */
  actionConfig?: string;
  /** 固定回答模板 */
  answerTemplate?: string;
  /** 状态：0禁用，1启用，2AI生成 */
  status: RuleStatus;
}

/** 新增规则参数（不含 ruleId，由后端自动生成） */
export type ChatRuleAddData = Omit<ChatRuleData, 'ruleId'>;

/** 修改规则参数（必须包含 ruleId） */
export type ChatRuleUpdateData = Required<Pick<ChatRuleData, 'ruleId'>> &
  ChatRuleData;

/******************************** 聊天规则 API ********************************/

/** 新增规则 POST /chat/rule */
export const addChatRuleApi = (data: ChatRuleAddData) => {
  return httpClient.post(`/chat/rule`, data);
};

/** 修改规则 PUT /chat/rule */
export const editChatRuleApi = (data: ChatRuleUpdateData) => {
  return httpClient.put(`/chat/rule`, data);
};
