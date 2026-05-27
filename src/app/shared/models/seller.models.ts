import { SellerStatus, TipoDocumento, TipoRegimen, TipoCuentaPago } from './enums';

export interface PublicSellerResponse {
  id: string;
  storeName: string;
  storeSlug: string;
  storeDescription?: string;
  storeLogoUrl?: string;
  storeBannerUrl?: string;
  city: string;
  department: string;
  totalSales: number;
  averageRating?: number;
  totalReviews: number;
}

export interface SellerResponse {
  id: string;
  userId: string;
  storeName: string;
  storeSlug: string;
  storeDescription?: string;
  storeLogoUrl?: string;
  storeBannerUrl?: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  razonSocial: string;
  tipoRegimen: TipoRegimen;
  phone: string;
  address: string;
  city: string;
  department: string;
  status: SellerStatus;
  createdAt: string;
}

export interface RegisterSellerRequest {
  storeName: string;
  storeDescription?: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  razonSocial: string;
  tipoRegimen: TipoRegimen;
  phone: string;
  address: string;
  city: string;
  department: string;
}

export interface PaymentAccountResponse {
  id: string;
  bankName: string;
  accountType: TipoCuentaPago;
  accountNumberMasked: string;
  accountHolder: string;
  documentType: TipoDocumento;
  documentNumber: string;
  active: boolean;
  createdAt: string;
}

export interface PaymentAccountRequest {
  bankName: string;
  accountType: TipoCuentaPago;
  accountNumber: string;
  accountHolder: string;
  documentType: TipoDocumento;
  documentNumber: string;
}

// ── AI Seller Assistant models ──────────────────────────────────────────────

export interface OptimizedContent {
  seoTitle: string;
  commercialDescription: string;
  keyBenefits: string[];
  seoKeywords: string[];
  tags: string[];
}

export interface ImageAnalysisResult {
  imageIndex: number;
  qualityScore: number;
  issues: string[];
  recommendations: string[];
  backgroundType: 'white' | 'colored' | 'transparent' | 'lifestyle' | 'other';
  needsBackgroundRemoval: boolean;
  lightingQuality: 'excellent' | 'good' | 'poor';
  sharpness: 'sharp' | 'acceptable' | 'blurry';
}

export interface ListingQualityScore {
  totalScore: number;
  contentScore: number;
  completenessScore: number;
  seoScore: number;
  imageScore: number;
  missingFields: string[];
  improvementSuggestions: string[];
}

export interface SellerAssistResultResponse {
  optimizedContent: OptimizedContent;
  listingScore: ListingQualityScore;
  imageAnalysis: ImageAnalysisResult[];
  processingTimeMs: number;
}

export interface SellerBIKPI {
  name: string;
  value: number | string;
  unit: string;
  period: string;
  variationPct: number | null;
  trend: 'up' | 'down' | 'stable';
  isAlert: boolean;
}

export interface SellerBIResponse {
  narrative: string;
  kpis: SellerBIKPI[];
  recommendations: string[];
  processingTimeMs: number;
}

export type EnhancementOperation =
  | 'background_removal' | 'white_background' | 'upscaling'
  | 'color_correction' | 'noise_reduction' | 'sharpening'
  | 'smart_crop' | 'promotional_image';

export interface EnhancedImageResult {
  originalIndex: number;
  enhancedBase64: string;
  qualityBefore: number;
  qualityAfter: number;
  operationsApplied: EnhancementOperation[];
  modificationSummary: string;
}

export interface ImageEnhancementResponse {
  enhancedImages: EnhancedImageResult[];
  promotionalImageBase64: string | null;
  totalProcessingTimeMs: number;
  providerUsed: string;
  overallQualityImprovement: number;
}
