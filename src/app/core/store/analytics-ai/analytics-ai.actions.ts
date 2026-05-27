import { createAction, props } from '@ngrx/store';
import { AnalyticsResultResponse } from '../../../shared/models/analytics.models';

export const queryAnalytics = createAction(
  '[AnalyticsAI] Query',
  props<{ query: string }>(),
);

export const queryAnalyticsSuccess = createAction(
  '[AnalyticsAI] Query Success',
  props<{ result: AnalyticsResultResponse; query: string }>(),
);

export const queryAnalyticsFailure = createAction(
  '[AnalyticsAI] Query Failure',
  props<{ error: string }>(),
);

export const clearChat = createAction('[AnalyticsAI] Clear Chat');
