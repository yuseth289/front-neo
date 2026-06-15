import { createReducer, on } from '@ngrx/store';
import { Cart } from '../../../shared/models/cart.models';
import * as CartActions from './cart.actions';

export interface CartState {
  cart: Cart | null;
  loading: boolean;
  addingProductId: string | null;
  error: string | null;
}

const initialState: CartState = {
  cart: null,
  loading: false,
  addingProductId: null,
  error: null,
};

export const cartReducer = createReducer(
  initialState,

  on(CartActions.loadCart, (state) => ({ ...state, loading: true })),
  on(CartActions.loadCartSuccess, (state, { cart }) => ({ ...state, loading: false, cart })),
  on(CartActions.loadCartFailure, (state) => ({ ...state, loading: false })),
  on(CartActions.clearCartState, () => ({ ...initialState })),

  on(CartActions.addItem, (state, { request }) => ({ ...state, addingProductId: request.productId, error: null })),
  on(CartActions.addItemSuccess, (state, { cart }) => ({ ...state, addingProductId: null, cart })),
  on(CartActions.addItemFailure, (state, { error }) => ({ ...state, addingProductId: null, error })),

  on(CartActions.updateItemSuccess, (state, { cart }) => ({ ...state, cart, error: null })),
  on(CartActions.updateItemFailure, (state, { error }) => ({ ...state, error })),
  on(CartActions.removeItemSuccess, (state, { cart }) => ({ ...state, cart })),

  on(CartActions.clearCartSuccess, (state) => ({
    ...state,
    cart: state.cart ? { ...state.cart, items: [], total: 0, totalItems: 0, hasPriceChanges: false } : null,
  })),
);
