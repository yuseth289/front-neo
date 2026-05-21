import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of, switchMap, map, catchError, tap } from 'rxjs';
import * as CartActions from './cart.actions';
import * as AuthActions from '../../auth/store/auth.actions';
import { CartService } from '../cart.service';
import { selectCartItems } from './cart.selectors';
import { first } from 'rxjs/operators';

@Injectable()
export class CartEffects {
  private actions$ = inject(Actions);
  private cartService = inject(CartService);
  private store = inject(Store);

  readonly loadCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.loadCart),
      switchMap(() =>
        this.cartService.getCart().pipe(
          map((res) => CartActions.loadCartSuccess({ cart: res.data })),
          catchError(() => of(CartActions.loadCartFailure())),
        ),
      ),
    ),
  );

  readonly loadCartOnAuth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadUserSuccess),
      map(() => CartActions.loadCart()),
    ),
  );

  readonly clearCartOnLogout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logoutComplete),
      map(() => CartActions.clearCartState()),
    ),
  );

  readonly addItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.addItem),
      switchMap(({ request }) =>
        this.cartService.addItem(request).pipe(
          map((res) => CartActions.addItemSuccess({ cart: res.data })),
          catchError((err) =>
            of(CartActions.addItemFailure({ error: err.error?.message ?? 'Error al agregar al carrito' })),
          ),
        ),
      ),
    ),
  );

  readonly updateItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.updateItem),
      switchMap(({ itemId, quantity }) =>
        this.cartService.updateItem(itemId, quantity).pipe(
          map((res) => CartActions.updateItemSuccess({ cart: res.data })),
          catchError(() => of(CartActions.loadCartFailure())),
        ),
      ),
    ),
  );

  readonly removeItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.removeItem),
      switchMap(({ itemId }) =>
        this.cartService.removeItem(itemId).pipe(
          switchMap(() =>
            this.cartService.getCart().pipe(
              map((res) => CartActions.removeItemSuccess({ cart: res.data })),
              catchError(() => of(CartActions.loadCartFailure())),
            ),
          ),
          catchError(() => of(CartActions.loadCartFailure())),
        ),
      ),
    ),
  );

  readonly clearCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CartActions.clearCart),
      switchMap(() =>
        this.cartService.clearCart().pipe(
          map(() => CartActions.clearCartSuccess()),
          catchError(() => of(CartActions.loadCartFailure())),
        ),
      ),
    ),
  );
}
