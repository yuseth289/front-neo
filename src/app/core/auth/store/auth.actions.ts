import { createAction, props } from '@ngrx/store';
import { TokenResponse, UserResponse, LoginRequest, RegisterRequest } from '../../../shared/models/auth.models';

export const login = createAction(
  '[Auth] Login',
  props<{ credentials: LoginRequest }>(),
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ tokens: TokenResponse }>(),
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>(),
);

export const register = createAction(
  '[Auth] Register',
  props<{ data: RegisterRequest }>(),
);

export const registerSuccess = createAction(
  '[Auth] Register Success',
  props<{ tokens: TokenResponse }>(),
);

export const registerFailure = createAction(
  '[Auth] Register Failure',
  props<{ error: string }>(),
);

export const logout = createAction('[Auth] Logout');

export const logoutComplete = createAction('[Auth] Logout Complete');

export const restoreSession = createAction('[Auth] Restore Session');

export const restoreSessionSuccess = createAction(
  '[Auth] Restore Session Success',
  props<{ tokens: TokenResponse }>(),
);

export const restoreSessionFailure = createAction('[Auth] Restore Session Failure');

export const refreshTokensSuccess = createAction(
  '[Auth] Refresh Tokens Success',
  props<{ tokens: TokenResponse }>(),
);

export const refreshTokensFailure = createAction('[Auth] Refresh Tokens Failure');

export const loadUserSuccess = createAction(
  '[Auth] Load User Success',
  props<{ user: UserResponse }>(),
);

export const loadUserFailure = createAction('[Auth] Load User Failure');

export const clearError = createAction('[Auth] Clear Error');
