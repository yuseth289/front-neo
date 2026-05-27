import { createAction, props } from '@ngrx/store';
import { SellerAssistResultResponse, ImageEnhancementResponse } from '../../../shared/models/seller.models';

export const assistProduct = createAction(
  '[SellerAI] Assist Product',
  props<{ name: string; description: string; price: number; category: string; images: File[] }>(),
);

export const assistProductSuccess = createAction(
  '[SellerAI] Assist Product Success',
  props<{ result: SellerAssistResultResponse }>(),
);

export const assistProductFailure = createAction(
  '[SellerAI] Assist Product Failure',
  props<{ error: string }>(),
);

export const analyzeImages = createAction(
  '[SellerAI] Analyze Images',
  props<{ name: string; images: File[]; category?: string; brand?: string }>(),
);

export const analyzeImagesSuccess = createAction(
  '[SellerAI] Analyze Images Success',
  props<{ result: SellerAssistResultResponse }>(),
);

export const analyzeImagesFailure = createAction(
  '[SellerAI] Analyze Images Failure',
  props<{ error: string }>(),
);

export const enhanceImages = createAction(
  '[SellerAI] Enhance Images',
  props<{ images: File[]; operations: string[] }>(),
);

export const enhanceImagesSuccess = createAction(
  '[SellerAI] Enhance Images Success',
  props<{ result: ImageEnhancementResponse }>(),
);

export const enhanceImagesFailure = createAction(
  '[SellerAI] Enhance Images Failure',
  props<{ error: string }>(),
);

export const reset = createAction('[SellerAI] Reset');
