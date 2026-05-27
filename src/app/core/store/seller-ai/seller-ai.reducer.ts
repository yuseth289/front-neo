import { createReducer, on } from '@ngrx/store';
import {
  OptimizedContent,
  ListingQualityScore,
  ImageAnalysisResult,
  EnhancedImageResult,
} from '../../../shared/models/seller.models';
import * as SellerAiActions from './seller-ai.actions';

export interface SellerAiState {
  optimizedContent: OptimizedContent | null;
  listingScore: ListingQualityScore | null;
  imageAnalysis: ImageAnalysisResult[];
  enhancedImages: EnhancedImageResult[];
  promotionalImage: string | null;
  isLoading: boolean;
  isAnalyzingImages: boolean;
  isEnhancingImages: boolean;
  error: string | null;
}

const initialState: SellerAiState = {
  optimizedContent: null,
  listingScore: null,
  imageAnalysis: [],
  enhancedImages: [],
  promotionalImage: null,
  isLoading: false,
  isAnalyzingImages: false,
  isEnhancingImages: false,
  error: null,
};

export const sellerAiReducer = createReducer(
  initialState,

  on(SellerAiActions.assistProduct, state => ({
    ...state,
    isLoading: true,
    error: null,
  })),
  on(SellerAiActions.assistProductSuccess, (state, { result }) => ({
    ...state,
    isLoading: false,
    optimizedContent: result.optimizedContent,
    listingScore: result.listingScore,
    imageAnalysis: result.imageAnalysis,
  })),
  on(SellerAiActions.assistProductFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  on(SellerAiActions.analyzeImages, state => ({
    ...state,
    isAnalyzingImages: true,
    error: null,
  })),
  on(SellerAiActions.analyzeImagesSuccess, (state, { result }) => ({
    ...state,
    isAnalyzingImages: false,
    imageAnalysis: result.imageAnalysis,
    listingScore: result.listingScore,
  })),
  on(SellerAiActions.analyzeImagesFailure, (state, { error }) => ({
    ...state,
    isAnalyzingImages: false,
    error,
  })),

  on(SellerAiActions.enhanceImages, state => ({
    ...state,
    isEnhancingImages: true,
    error: null,
  })),
  on(SellerAiActions.enhanceImagesSuccess, (state, { result }) => ({
    ...state,
    isEnhancingImages: false,
    enhancedImages: result.enhancedImages,
    promotionalImage: result.promotionalImageBase64,
  })),
  on(SellerAiActions.enhanceImagesFailure, (state, { error }) => ({
    ...state,
    isEnhancingImages: false,
    error,
  })),

  on(SellerAiActions.reset, () => initialState),
);
