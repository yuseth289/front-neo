import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CartState } from './cart.reducer';

export const selectCartState = createFeatureSelector<CartState>('cart');

export const selectCart = createSelector(selectCartState, (s) => s.cart);
export const selectCartLoading = createSelector(selectCartState, (s) => s.loading);
export const selectCartError = createSelector(selectCartState, (s) => s.error);
export const selectAddingProductId = createSelector(selectCartState, (s) => s.addingProductId);

export const selectCartItemCount = createSelector(selectCart, (cart) => cart?.totalItems ?? 0);
export const selectCartTotal = createSelector(selectCart, (cart) => cart?.total ?? 0);
export const selectCartItems = createSelector(selectCart, (cart) => cart?.items ?? []);
export const selectCartHasPriceChanges = createSelector(selectCart, (cart) => cart?.hasPriceChanges ?? false);
