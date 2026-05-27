import { searchAiReducer, SearchAiState } from './search-ai.reducer';
import * as SearchAiActions from './search-ai.actions';
import { SearchResultResponse } from '../../../shared/models/search.models';

const initialState: SearchAiState = {
  recommendations: [],
  needsClarification: false,
  clarificationQuestion: null,
  isLoading: false,
  error: null,
  processingTimeMs: null,
};

const mockResult: SearchResultResponse = {
  recommendations: [
    {
      productId: 'p1',
      productName: 'Mouse Logitech G502',
      price: 145000,
      priceFormatted: '$145.000',
      relevanceScore: 0.95,
      explanation: 'Ideal para FPS',
      compatibilityNotes: null,
      priceFit: true,
      imageUrl: null,
      stockAvailable: true,
    },
  ],
  structuredFilters: {},
  needsClarification: false,
  clarificationQuestion: null,
  intentClassified: 'product_search',
  processingTimeMs: 1200,
};

describe('searchAiReducer', () => {
  it('should return initial state by default', () => {
    const state = searchAiReducer(undefined, { type: '@@INIT' } as never);
    expect(state).toEqual(initialState);
  });

  describe('search action', () => {
    it('should set isLoading to true and clear error', () => {
      const stateWithError: SearchAiState = { ...initialState, error: 'previous error' };
      const state = searchAiReducer(stateWithError, SearchAiActions.search({ query: 'mouse gamer' }));
      expect(state.isLoading).toBeTrue();
      expect(state.error).toBeNull();
    });
  });

  describe('searchSuccess action', () => {
    it('should populate recommendations and clear loading', () => {
      const loadingState: SearchAiState = { ...initialState, isLoading: true };
      const state = searchAiReducer(loadingState, SearchAiActions.searchSuccess({ result: mockResult }));
      expect(state.isLoading).toBeFalse();
      expect(state.recommendations).toHaveSize(1);
      expect(state.recommendations[0].productId).toBe('p1');
      expect(state.processingTimeMs).toBe(1200);
    });

    it('should set needsClarification from result', () => {
      const clarificationResult: SearchResultResponse = {
        ...mockResult,
        needsClarification: true,
        clarificationQuestion: '¿Para qué juego lo necesitas?',
      };
      const state = searchAiReducer(
        { ...initialState, isLoading: true },
        SearchAiActions.searchSuccess({ result: clarificationResult }),
      );
      expect(state.needsClarification).toBeTrue();
      expect(state.clarificationQuestion).toBe('¿Para qué juego lo necesitas?');
    });
  });

  describe('searchFailure action', () => {
    it('should set error and clear loading', () => {
      const loadingState: SearchAiState = { ...initialState, isLoading: true };
      const state = searchAiReducer(
        loadingState,
        SearchAiActions.searchFailure({ error: 'Timeout del servicio IA' }),
      );
      expect(state.isLoading).toBeFalse();
      expect(state.error).toBe('Timeout del servicio IA');
    });
  });

  describe('clearResults action', () => {
    it('should reset to initial state', () => {
      const populatedState: SearchAiState = {
        ...initialState,
        recommendations: mockResult.recommendations,
        processingTimeMs: 1200,
      };
      const state = searchAiReducer(populatedState, SearchAiActions.clearResults());
      expect(state).toEqual(initialState);
    });
  });
});
