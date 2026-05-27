import { createReducer, on } from '@ngrx/store';
import { AnalyticsResultResponse, ChatMessage } from '../../../shared/models/analytics.models';
import * as AnalyticsAiActions from './analytics-ai.actions';

export interface AnalyticsAiState {
  messages: ChatMessage[];
  currentResult: AnalyticsResultResponse | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AnalyticsAiState = {
  messages: [],
  currentResult: null,
  isLoading: false,
  error: null,
};

export const analyticsAiReducer = createReducer(
  initialState,

  on(AnalyticsAiActions.queryAnalytics, (state, { query }) => ({
    ...state,
    isLoading: true,
    error: null,
    messages: [
      ...state.messages,
      {
        id: `user-${state.messages.length}`,
        role: 'user' as const,
        content: query,
        timestamp: Date.now(),
      },
    ],
  })),

  on(AnalyticsAiActions.queryAnalyticsSuccess, (state, { result }) => ({
    ...state,
    isLoading: false,
    currentResult: result,
    messages: [
      ...state.messages,
      {
        id: `ai-${state.messages.length}`,
        role: 'ai' as const,
        content: result.narrative,
        timestamp: Date.now(),
        result,
      },
    ],
  })),

  on(AnalyticsAiActions.queryAnalyticsFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  on(AnalyticsAiActions.clearChat, () => initialState),
);
