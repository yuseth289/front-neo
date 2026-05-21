import { createAction, props } from '@ngrx/store';
import { Cart, AddCartItemRequest } from '../../../shared/models/cart.models';

export const loadCart = createAction('[Cart] Load Cart');
export const loadCartSuccess = createAction('[Cart] Load Cart Success', props<{ cart: Cart }>());
export const loadCartFailure = createAction('[Cart] Load Cart Failure');
export const clearCartState = createAction('[Cart] Clear Cart State');

export const addItem = createAction('[Cart] Add Item', props<{ request: AddCartItemRequest }>());
export const addItemSuccess = createAction('[Cart] Add Item Success', props<{ cart: Cart }>());
export const addItemFailure = createAction('[Cart] Add Item Failure', props<{ error: string }>());

export const updateItem = createAction('[Cart] Update Item', props<{ itemId: string; quantity: number }>());
export const updateItemSuccess = createAction('[Cart] Update Item Success', props<{ cart: Cart }>());

export const removeItem = createAction('[Cart] Remove Item', props<{ itemId: string }>());
export const removeItemSuccess = createAction('[Cart] Remove Item Success', props<{ cart: Cart }>());

export const clearCart = createAction('[Cart] Clear Cart');
export const clearCartSuccess = createAction('[Cart] Clear Cart Success');
