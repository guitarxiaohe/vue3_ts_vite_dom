/******************************** AI 客服分析查询 ********************************/

export interface ChatAnalysisQuery {
  beginTime: string;
  endTime: string;
}

/******************************** AI 客服分析响应 ********************************/

export interface ChatAnalysisSummary {
  conversationCount: number;
  hitCount: number;
  ruleHitCount: number;
  aiFallbackCount: number;
  unmatchedCount: number;
  pendingQuestionCount: number;
  ruleCount: number;
  enabledRuleCount: number;
  knowledgeCount: number;
  enabledKnowledgeCount: number;
  toolCallCount: number;
  toolSuccessCount: number;
  toolFailCount: number;
  avgResponseTimeMs: number;
  avgToolLatencyMs: number;
  hitRate: number;
  toolSuccessRate: number;
}

export interface ChatAnalysisTrendItem {
  statDate: string;
  conversationCount: number;
  ruleHitCount: number;
  aiFallbackCount: number;
  unmatchedCount: number;
  toolCallCount: number;
}

export interface ChatAnalysisNameValueItem {
  name: string;
  value: number;
}

export interface ChatAnalysisRuleScoreItem {
  ruleId: number;
  ruleCode: string;
  ruleName: string;
  actionType: string;
  category: string;
  matchPhase: string;
  matchCount: number;
  selectedCount: number;
  executedCount: number;
  avgScore: number;
  maxScore: number;
  avgThresholdScore: number;
}

export interface ChatAnalysisToolUsageItem {
  toolName: string;
  totalCount: number;
  successCount: number;
  failCount: number;
  resultCount: number;
  avgLatencyMs: number;
  successRate: number;
}

export interface ChatAnalysisInsight {
  level: string;
  metric: string;
  message: string;
}

export interface ChatAnalysisOverview {
  query: ChatAnalysisQuery;
  summary: ChatAnalysisSummary;
  conversationTrend: ChatAnalysisTrendItem[];
  sourceDistribution: ChatAnalysisNameValueItem[];
  ruleScoreTop: ChatAnalysisRuleScoreItem[];
  toolUsage: ChatAnalysisToolUsageItem[];
  intentDistribution: ChatAnalysisNameValueItem[];
  categoryDistribution: ChatAnalysisNameValueItem[];
  insights: ChatAnalysisInsight[];
}

/******************************** 未命中问题列表 ********************************/

export interface ChatQuestionListQuery {
  pageNum: number;
  pageSize: number;
  status: string;
}

export interface ChatQuestionItem {
  questionId: number;
  sessionId: string;
  question: string;
  category: string;
  scene: string;
  moduleKey: string;
  entityKey: string;
  pagePath: string;
  status: string;
  resolvedRuleId: number;
  createdAt: string;
  updatedAt: string;
  remark: string;
}
