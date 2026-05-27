import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import * as AnalyticsAiActions from './analytics-ai.actions';
import { AnalyticsAiService } from '../../services/analytics-ai.service';

@Injectable()
export class AnalyticsAiEffects {
  private readonly actions$ = inject(Actions);
  private readonly analyticsAiService = inject(AnalyticsAiService);

  readonly queryAnalytics$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnalyticsAiActions.queryAnalytics),
      switchMap(({ query }) =>
        this.analyticsAiService.analyticsQuery(query).pipe(
          map(result => AnalyticsAiActions.queryAnalyticsSuccess({ result, query })),
          catchError(err =>
            of(AnalyticsAiActions.queryAnalyticsFailure({
              error: err.error?.message ?? 'Error al procesar la consulta de analytics',
            })),
          ),
        ),
      ),
    ),
  );
}
