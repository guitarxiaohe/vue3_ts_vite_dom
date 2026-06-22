export interface ChatAskRequest {
  sessionId: string;
  question: string;
  category: string;
  scene: string;
  moduleKey: string;
  entityKey: string;
  pagePath: string;
}

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
  pendingAction: string;
  redirectUrl: string;
}

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
