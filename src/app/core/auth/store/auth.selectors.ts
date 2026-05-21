import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectAccessToken = createSelector(selectAuthState, (s) => s.accessToken);
export const selectRefreshToken = createSelector(selectAuthState, (s) => s.refreshToken);
export const selectUser = createSelector(selectAuthState, (s) => s.user);
export const selectUserId = createSelector(selectAuthState, (s) => s.userId);
export const selectRole = createSelector(selectAuthState, (s) => s.role);
export const selectAuthLoading = createSelector(selectAuthState, (s) => s.loading);
export const selectAuthError = createSelector(selectAuthState, (s) => s.error);
export const selectAuthInitialized = createSelector(selectAuthState, (s) => s.initialized);

export const selectIsAuthenticated = createSelector(selectAccessToken, (token) => !!token);
export const selectIsSeller = createSelector(selectRole, (role) => role === 'SELLER');
export const selectIsAdmin = createSelector(selectRole, (role) => role === 'ADMIN');
export const selectIsClient = createSelector(selectRole, (role) => role === 'CLIENT');

export const selectUserDisplayName = createSelector(selectUser, (user) =>
  user ? `${user.firstName} ${user.lastName}` : null,
);
