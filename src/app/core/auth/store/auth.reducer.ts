import { createReducer, on } from '@ngrx/store';
import { Role } from '../../../shared/models/enums';
import { UserResponse } from '../../../shared/models/auth.models';
import * as AuthActions from './auth.actions';

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  role: Role | null;
  user: UserResponse | null;
  initialized: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  userId: null,
  role: null,
  user: null,
  initialized: false,
  loading: false,
  error: null,
};

export const authReducer = createReducer(
  initialState,

  // Login
  on(AuthActions.login, (state) => ({ ...state, loading: true, error: null })),
  on(AuthActions.loginSuccess, (state, { tokens }) => ({
    ...state,
    loading: false,
    initialized: true,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    userId: tokens.userId,
    role: tokens.role,
    error: null,
  })),
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Register
  on(AuthActions.register, (state) => ({ ...state, loading: true, error: null })),
  on(AuthActions.registerSuccess, (state, { tokens }) => ({
    ...state,
    loading: false,
    initialized: true,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    userId: tokens.userId,
    role: tokens.role,
    error: null,
  })),
  on(AuthActions.registerFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Logout
  on(AuthActions.logout, (state) => ({ ...state, loading: true })),
  on(AuthActions.logoutComplete, () => ({
    ...initialState,
    initialized: true,
  })),

  // Restore session
  on(AuthActions.restoreSession, (state) => ({ ...state, loading: true })),
  on(AuthActions.restoreSessionSuccess, (state, { tokens }) => ({
    ...state,
    loading: false,
    initialized: true,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    userId: tokens.userId,
    role: tokens.role,
  })),
  on(AuthActions.restoreSessionFailure, (state) => ({
    ...state,
    loading: false,
    initialized: true,
  })),

  // Refresh tokens (called from interceptor)
  on(AuthActions.refreshTokensSuccess, (state, { tokens }) => ({
    ...state,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    userId: tokens.userId,
    role: tokens.role,
  })),
  on(AuthActions.refreshTokensFailure, () => ({
    ...initialState,
    initialized: true,
  })),

  // Load user
  on(AuthActions.loadUserSuccess, (state, { user }) => ({ ...state, user })),

  // Misc
  on(AuthActions.clearError, (state) => ({ ...state, error: null })),
);
