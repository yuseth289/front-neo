export interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string | null;
  errorCode: string | null;
  data: T;
  timestamp: string;
}

export interface ProductRecommendation {
  productId: string;
  slug: string | null;
  productName: string;
  price: number | null;
  priceFormatted: string | null;
  relevanceScore: number;
  explanation: string;
  compatibilityNotes: string | null;
  priceFit: boolean;
  imageUrl: string | null;
  stockAvailable: boolean;
}

export interface SearchResultResponse {
  recommendations: ProductRecommendation[];
  structuredFilters: Record<string, unknown>;
  needsClarification: boolean;
  clarificationQuestion: string | null;
  intentClassified: string;
  processingTimeMs: number;
}
