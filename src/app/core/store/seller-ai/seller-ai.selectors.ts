import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SellerAiState } from './seller-ai.reducer';

export const selectSellerAiState = createFeatureSelector<SellerAiState>('sellerAi');

export const selectOptimizedContent = createSelector(selectSellerAiState, s => s.optimizedContent);
export const selectListingScore = createSelector(selectSellerAiState, s => s.listingScore);
export const selectImageAnalysis = createSelector(selectSellerAiState, s => s.imageAnalysis);
export const selectEnhancedImages = createSelector(selectSellerAiState, s => s.enhancedImages);
export const selectPromotionalImage = createSelector(selectSellerAiState, s => s.promotionalImage);
export const selectSellerIsLoading = createSelector(selectSellerAiState, s => s.isLoading);
export const selectIsAnalyzingImages = createSelector(selectSellerAiState, s => s.isAnalyzingImages);
export const selectIsEnhancingImages = createSelector(selectSellerAiState, s => s.isEnhancingImages);
export const selectSellerError = createSelector(selectSellerAiState, s => s.error);
export const selectHasOptimizedContent = createSelector(
  selectOptimizedContent,
  content => content !== null,
);
export const selectHasEnhancedImages = createSelector(
  selectEnhancedImages,
  images => images.length > 0,
);
