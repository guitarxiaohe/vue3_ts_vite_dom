export interface ChatAskRequest {
  sessionId: string;
  question: string;
  category: string;
  scene: string;
  moduleKey: string;
  entityKey: string;
  pagePath: string;
}

/******************************** AI 客服响应 ********************************/

export interface ChatAskResponse {
  sessionId: string;
  answer: string;
  needHuman: boolean;
  references: string[];
  intent: string;
  queryTarget: string;
  keywords: string[];
  category: string;
  categoryName: string;
  products: ChatProduct[];
  recommendations: ChatRecommendation[];
  faqCategories: ChatFaqCategory[];
  faqPages: ChatFaqPage[];
  pendingAction: string;
  redirectUrl: string;
}

// 商品
export interface ChatProduct {
  productId: number;
  name: string;
  sku: string;
  model: string;
  priceFormat: string;
  quantity: number;
  image: string;
  url: string;
}

// 推荐
export interface ChatRecommendation {
  source: string;
  id: number | null;
  name: string;
  uname: string;
  nuxtUrl: string;
  url: string;
}

// FAQ 分类
export interface ChatFaqCategory {
  id: number;
  active: number;
  title: string;
  titleFormat: string;
  summary: string;
  summaryFormat: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  count: number;
  nuxtUrl: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

// FAQ 页面
export interface ChatFaqPage {
  id: number;
  url: string;
  parentId: number;
  active: number;
  imageFormat: string;
  author: string;
  views: number;
  title: string;
  titleFormat: string;
  content: string;
  contentText: string;
  summary: string;
  summaryFormat: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  createdAt: string;
  updatedAt: string;
  time: string;
  nuxtUrl: string;
}
