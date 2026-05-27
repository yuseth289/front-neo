import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import * as SearchAiActions from './search-ai.actions';
import { SearchAiService } from '../../services/search-ai.service';

@Injectable()
export class SearchAiEffects {
  private readonly actions$ = inject(Actions);
  private readonly searchAiService = inject(SearchAiService);

  readonly search$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SearchAiActions.search),
      switchMap(({ query, clarification }) =>
        this.searchAiService.intelligentSearch(query, clarification).pipe(
          map(result => SearchAiActions.searchSuccess({ result })),
          catchError(err =>
            of(SearchAiActions.searchFailure({
              error: err.error?.message ?? 'Error al realizar la búsqueda',
            })),
          ),
        ),
      ),
    ),
  );

  readonly submitClarification$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SearchAiActions.submitClarification),
      map(({ query, clarification }) => SearchAiActions.search({ query, clarification })),
    ),
  );
}
