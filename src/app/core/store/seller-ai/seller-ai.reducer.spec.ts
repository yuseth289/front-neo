import { sellerAiReducer, SellerAiState } from './seller-ai.reducer';
import * as SellerAiActions from './seller-ai.actions';
import { SellerAssistResultResponse, ImageEnhancementResponse } from '../../../shared/models/seller.models';

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

const mockSellerResult: SellerAssistResultResponse = {
  optimizedContent: {
    seoTitle: 'Mouse Gamer Logitech G502 para FPS',
    commercialDescription: 'El mejor mouse para juegos de precisión',
    keyBenefits: ['Alta precisión', 'Ergonómico'],
    seoKeywords: ['mouse gamer', 'fps', 'logitech'],
    tags: ['gaming', 'mouse', 'fps'],
  },
  listingScore: {
    totalScore: 82,
    contentScore: 85,
    completenessScore: 90,
    seoScore: 78,
    imageScore: 75,
    missingFields: [],
    improvementSuggestions: ['Agrega más imágenes'],
  },
  imageAnalysis: [],
  processingTimeMs: 3200,
};

const mockEnhancementResult: ImageEnhancementResponse = {
  enhancedImages: [
    {
      originalIndex: 0,
      enhancedBase64: 'abc123',
      qualityBefore: 60,
      qualityAfter: 92,
      operationsApplied: ['background_removal', 'white_background'],
      modificationSummary: 'Fondo eliminado, fondo blanco aplicado',
    },
  ],
  promotionalImageBase64: 'promo456',
  totalProcessingTimeMs: 8000,
  providerUsed: 'nano_banana',
  overallQualityImprovement: 32,
};

describe('sellerAiReducer', () => {
  it('should return initial state by default', () => {
    const state = sellerAiReducer(undefined, { type: '@@INIT' } as never);
    expect(state).toEqual(initialState);
  });

  describe('assistProduct flow', () => {
    it('should set isLoading on assistProduct', () => {
      const state = sellerAiReducer(
        initialState,
        SellerAiActions.assistProduct({ name: 'Mouse', description: '', price: 0, category: '', images: [] }),
      );
      expect(state.isLoading).toBeTrue();
      expect(state.error).toBeNull();
    });

    it('should populate optimizedContent on success', () => {
      const loading: SellerAiState = { ...initialState, isLoading: true };
      const state = sellerAiReducer(
        loading,
        SellerAiActions.assistProductSuccess({ result: mockSellerResult }),
      );
      expect(state.isLoading).toBeFalse();
      expect(state.optimizedContent?.seoTitle).toBe('Mouse Gamer Logitech G502 para FPS');
      expect(state.listingScore?.totalScore).toBe(82);
    });

    it('should set error on failure', () => {
      const loading: SellerAiState = { ...initialState, isLoading: true };
      const state = sellerAiReducer(
        loading,
        SellerAiActions.assistProductFailure({ error: 'Error de IA' }),
      );
      expect(state.isLoading).toBeFalse();
      expect(state.error).toBe('Error de IA');
    });
  });

  describe('analyzeImages flow', () => {
    it('should set isAnalyzingImages on analyzeImages', () => {
      const state = sellerAiReducer(
        initialState,
        SellerAiActions.analyzeImages({ images: [] }),
      );
      expect(state.isAnalyzingImages).toBeTrue();
      expect(state.isEnhancingImages).toBeFalse();
    });

    it('should populate imageAnalysis on success', () => {
      const analyzing: SellerAiState = { ...initialState, isAnalyzingImages: true };
      const resultWithAnalysis: SellerAssistResultResponse = {
        ...mockSellerResult,
        imageAnalysis: [
          {
            imageIndex: 0,
            qualityScore: 72,
            issues: ['Fondo complejo'],
            recommendations: ['Usar fondo blanco'],
            backgroundType: 'colored',
            needsBackgroundRemoval: true,
            lightingQuality: 'good',
            sharpness: 'sharp',
          },
        ],
      };
      const state = sellerAiReducer(
        analyzing,
        SellerAiActions.analyzeImagesSuccess({ result: resultWithAnalysis }),
      );
      expect(state.isAnalyzingImages).toBeFalse();
      expect(state.imageAnalysis).toHaveSize(1);
      expect(state.imageAnalysis[0].qualityScore).toBe(72);
    });
  });

  describe('enhanceImages flow', () => {
    it('should set isEnhancingImages on enhanceImages', () => {
      const state = sellerAiReducer(
        initialState,
        SellerAiActions.enhanceImages({ images: [], operations: ['background_removal'] }),
      );
      expect(state.isEnhancingImages).toBeTrue();
    });

    it('should populate enhancedImages and promotionalImage on success', () => {
      const enhancing: SellerAiState = { ...initialState, isEnhancingImages: true };
      const state = sellerAiReducer(
        enhancing,
        SellerAiActions.enhanceImagesSuccess({ result: mockEnhancementResult }),
      );
      expect(state.isEnhancingImages).toBeFalse();
      expect(state.enhancedImages).toHaveSize(1);
      expect(state.enhancedImages[0].qualityAfter).toBe(92);
      expect(state.promotionalImage).toBe('promo456');
    });
  });

  describe('reset action', () => {
    it('should restore initial state', () => {
      const loaded: SellerAiState = {
        ...initialState,
        optimizedContent: mockSellerResult.optimizedContent,
        enhancedImages: mockEnhancementResult.enhancedImages,
        promotionalImage: 'promo456',
      };
      const state = sellerAiReducer(loaded, SellerAiActions.reset());
      expect(state).toEqual(initialState);
    });
  });
});
