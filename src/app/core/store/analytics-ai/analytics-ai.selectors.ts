import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AnalyticsAiState } from './analytics-ai.reducer';

export const selectAnalyticsAiState = createFeatureSelector<AnalyticsAiState>('analyticsAi');

export const selectChatMessages = createSelector(selectAnalyticsAiState, s => s.messages);
export const selectCurrentResult = createSelector(selectAnalyticsAiState, s => s.currentResult);
export const selectAnalyticsIsLoading = createSelector(selectAnalyticsAiState, s => s.isLoading);
export const selectAnalyticsError = createSelector(selectAnalyticsAiState, s => s.error);
export const selectCurrentKpis = createSelector(
  selectCurrentResult,
  result => result?.summary.kpis ?? [],
);
export const selectCurrentAlerts = createSelector(
  selectCurrentResult,
  result => result?.summary.alerts ?? [],
);
