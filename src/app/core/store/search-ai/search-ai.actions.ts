import { createAction, props } from '@ngrx/store';
import { SearchResultResponse } from '../../../shared/models/search.models';

export const search = createAction(
  '[SearchAI] Search',
  props<{ query: string; clarification?: string }>(),
);

export const searchSuccess = createAction(
  '[SearchAI] Search Success',
  props<{ result: SearchResultResponse }>(),
);

export const searchFailure = createAction(
  '[SearchAI] Search Failure',
  props<{ error: string }>(),
);

export const submitClarification = createAction(
  '[SearchAI] Submit Clarification',
  props<{ query: string; clarification: string }>(),
);

export const clearResults = createAction('[SearchAI] Clear Results');
