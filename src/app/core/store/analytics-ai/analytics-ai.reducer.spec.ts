import { analyticsAiReducer, AnalyticsAiState } from './analytics-ai.reducer';
import * as AnalyticsAiActions from './analytics-ai.actions';
import { AnalyticsResultResponse } from '../../../shared/models/analytics.models';

const initialState: AnalyticsAiState = {
  messages: [],
  currentResult: null,
  isLoading: false,
  error: null,
};

const mockResult: AnalyticsResultResponse = {
  narrative: 'Las ventas del mes aumentaron un 12% respecto al mes anterior.',
  summary: {
    title: 'Resumen ejecutivo — Mayo 2026',
    period: 'Mayo 2026',
    highlights: ['+12% en ventas'],
    kpis: [
      { name: 'Ventas totales', value: 45_200_000, unit: 'COP', period: 'Mayo 2026',
        variationPct: 12, trend: 'up', isAlert: false },
    ],
    topProducts: [],
    alerts: [],
    recommendations: ['Aumentar inventario de gaming mice'],
    chartData: {},
  },
  queryIntent: 'sales_analysis',
  processingTimeMs: 2800,
};

describe('analyticsAiReducer', () => {
  it('should return initial state by default', () => {
    const state = analyticsAiReducer(undefined, { type: '@@INIT' } as never);
    expect(state).toEqual(initialState);
  });

  describe('queryAnalytics action', () => {
    it('should set isLoading and add user message', () => {
      const state = analyticsAiReducer(
        initialState,
        AnalyticsAiActions.queryAnalytics({ query: '¿Cuáles son los productos más vendidos?' }),
      );
      expect(state.isLoading).toBeTrue();
      expect(state.messages).toHaveSize(1);
      expect(state.messages[0].role).toBe('user');
      expect(state.messages[0].content).toBe('¿Cuáles son los productos más vendidos?');
    });

    it('should accumulate messages on multiple queries', () => {
      let state = analyticsAiReducer(
        initialState,
        AnalyticsAiActions.queryAnalytics({ query: 'Primera pregunta' }),
      );
      state = analyticsAiReducer(state, AnalyticsAiActions.queryAnalyticsSuccess({ result: mockResult, query: 'Primera pregunta' }));
      state = analyticsAiReducer(state, AnalyticsAiActions.queryAnalytics({ query: 'Segunda pregunta' }));
      expect(state.messages).toHaveSize(3);
    });
  });

  describe('queryAnalyticsSuccess action', () => {
    it('should add AI message with narrative and set currentResult', () => {
      const withUserMsg: AnalyticsAiState = {
        ...initialState,
        isLoading: true,
        messages: [{ id: 'user-0', role: 'user', content: '¿Ventas?', timestamp: Date.now() }],
      };
      const state = analyticsAiReducer(
        withUserMsg,
        AnalyticsAiActions.queryAnalyticsSuccess({ result: mockResult, query: '¿Ventas?' }),
      );
      expect(state.isLoading).toBeFalse();
      expect(state.currentResult).toEqual(mockResult);
      expect(state.messages).toHaveSize(2);
      expect(state.messages[1].role).toBe('ai');
      expect(state.messages[1].content).toBe(mockResult.narrative);
      expect(state.messages[1].result).toEqual(mockResult);
    });
  });

  describe('queryAnalyticsFailure action', () => {
    it('should set error and clear loading', () => {
      const loading: AnalyticsAiState = { ...initialState, isLoading: true };
      const state = analyticsAiReducer(
        loading,
        AnalyticsAiActions.queryAnalyticsFailure({ error: 'Error de conexión' }),
      );
      expect(state.isLoading).toBeFalse();
      expect(state.error).toBe('Error de conexión');
    });
  });

  describe('clearChat action', () => {
    it('should reset to initial state', () => {
      const withData: AnalyticsAiState = {
        ...initialState,
        messages: [{ id: 'u0', role: 'user', content: 'Hola', timestamp: 0 }],
        currentResult: mockResult,
      };
      const state = analyticsAiReducer(withData, AnalyticsAiActions.clearChat());
      expect(state).toEqual(initialState);
    });
  });
});
