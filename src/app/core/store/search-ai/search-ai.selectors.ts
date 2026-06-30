import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SearchAiState } from './search-ai.reducer';

export const selectSearchAiState = createFeatureSelector<SearchAiState>('searchAi');

export const selectGreeting = createSelector(selectSearchAiState, s => s.greeting);
export const selectClosingMessage = createSelector(selectSearchAiState, s => s.closingMessage);
export const selectRecommendations = createSelector(selectSearchAiState, s => s.recommendations);
export const selectSearchIsLoading = createSelector(selectSearchAiState, s => s.isLoading);
export const selectClarificationNeeded = createSelector(selectSearchAiState, s => s.needsClarification);
export const selectClarificationQuestion = createSelector(selectSearchAiState, s => s.clarificationQuestion);
export const selectSearchError = createSelector(selectSearchAiState, s => s.error);
export const selectSearchProcessingTime = createSelector(selectSearchAiState, s => s.processingTimeMs);
export const selectHasSearched = createSelector(selectSearchAiState, s => s.searched);
export const selectLastQuery = createSelector(selectSearchAiState, s => s.lastQuery);
export const selectHasResults = createSelector(
  selectRecommendations,
  recs => recs.length > 0,
);
