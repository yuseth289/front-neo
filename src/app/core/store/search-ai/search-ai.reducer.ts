import { createReducer, on } from '@ngrx/store';
import { ProductRecommendation } from '../../../shared/models/search.models';
import * as SearchAiActions from './search-ai.actions';

export interface SearchAiState {
  greeting: string | null;
  closingMessage: string | null;
  recommendations: ProductRecommendation[];
  needsClarification: boolean;
  clarificationQuestion: string | null;
  isLoading: boolean;
  error: string | null;
  processingTimeMs: number | null;
  searched: boolean;
  lastQuery: string | null;
}

const initialState: SearchAiState = {
  greeting: null,
  closingMessage: null,
  recommendations: [],
  needsClarification: false,
  clarificationQuestion: null,
  isLoading: false,
  error: null,
  processingTimeMs: null,
  searched: false,
  lastQuery: null,
};

export const searchAiReducer = createReducer(
  initialState,

  on(SearchAiActions.search, (state, { query }) => ({
    ...state,
    isLoading: true,
    error: null,
    lastQuery: query,
    greeting: null,
    closingMessage: null,
    recommendations: [],
    needsClarification: false,
    clarificationQuestion: null,
  })),

  on(SearchAiActions.searchSuccess, (state, { result }) => ({
    ...state,
    isLoading: false,
    searched: true,
    greeting: result.greeting,
    closingMessage: result.closingMessage,
    recommendations: result.recommendations,
    needsClarification: result.needsClarification,
    clarificationQuestion: result.clarificationQuestion,
    processingTimeMs: result.processingTimeMs,
    error: null,
  })),

  on(SearchAiActions.searchFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    searched: true,
    error,
  })),

  on(SearchAiActions.clearResults, () => initialState),
);
