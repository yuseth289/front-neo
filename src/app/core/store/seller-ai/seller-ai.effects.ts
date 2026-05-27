import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import * as SellerAiActions from './seller-ai.actions';
import { SellerAiService } from '../../services/seller-ai.service';

@Injectable()
export class SellerAiEffects {
  private readonly actions$ = inject(Actions);
  private readonly sellerAiService = inject(SellerAiService);

  readonly assistProduct$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SellerAiActions.assistProduct),
      switchMap(({ name, description, price, category }) =>
        this.sellerAiService.optimizeProduct({ name, description, price, category }).pipe(
          map(result => SellerAiActions.assistProductSuccess({ result })),
          catchError(err =>
            of(SellerAiActions.assistProductFailure({
              error: err.error?.message ?? 'Error al optimizar el producto',
            })),
          ),
        ),
      ),
    ),
  );

  readonly analyzeImages$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SellerAiActions.analyzeImages),
      switchMap(({ name, images, category, brand }) =>
        this.sellerAiService.analyzeImages(name, images, category, brand).pipe(
          map(result => SellerAiActions.analyzeImagesSuccess({ result })),
          catchError(err =>
            of(SellerAiActions.analyzeImagesFailure({
              error: err.error?.message ?? 'Error al analizar las imágenes',
            })),
          ),
        ),
      ),
    ),
  );

  readonly enhanceImages$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SellerAiActions.enhanceImages),
      switchMap(({ images, operations }) =>
        this.sellerAiService.enhanceImages(images, operations).pipe(
          map(result => SellerAiActions.enhanceImagesSuccess({ result })),
          catchError(err =>
            of(SellerAiActions.enhanceImagesFailure({
              error: err.error?.message ?? 'Error al mejorar las imágenes',
            })),
          ),
        ),
      ),
    ),
  );
}
