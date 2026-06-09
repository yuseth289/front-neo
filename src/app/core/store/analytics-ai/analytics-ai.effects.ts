import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { switchMap, map, catchError, withLatestFrom } from 'rxjs/operators';
import * as AnalyticsAiActions from './analytics-ai.actions';
import { AnalyticsAiService } from '../../services/analytics-ai.service';
import { selectUserId } from '../../auth/store/auth.selectors';

@Injectable()
export class AnalyticsAiEffects {
  private readonly actions$ = inject(Actions);
  private readonly analyticsAiService = inject(AnalyticsAiService);
  private readonly store = inject(Store);

  readonly queryAnalytics$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnalyticsAiActions.queryAnalytics),
      withLatestFrom(this.store.select(selectUserId)),
      switchMap(([{ query }, adminId]) =>
        this.analyticsAiService.analyticsQuery(query, adminId).pipe(
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
