import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { switchMap, map, catchError, tap } from 'rxjs/operators';
import * as AuthActions from './auth.actions';
import { AuthService } from '../auth.service';

const REFRESH_TOKEN_KEY = 'neo_refresh_token';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);
  private store = inject(Store);
  private platformId = inject(PLATFORM_ID);

  // ── LOGIN ─────────────────────────────────────────────────────────────────

  readonly login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ credentials }) =>
        this.authService.login(credentials).pipe(
          map((res) => AuthActions.loginSuccess({ tokens: res.data })),
          catchError((err) =>
            of(
              AuthActions.loginFailure({
                error: err.error?.message ?? 'Credenciales incorrectas',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  // ── GOOGLE LOGIN ──────────────────────────────────────────────────────────

  readonly googleLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.googleLogin),
      switchMap(({ idToken }) =>
        this.authService.googleLogin(idToken).pipe(
          map((res) => AuthActions.loginSuccess({ tokens: res.data })),
          catchError((err) =>
            of(
              AuthActions.googleLoginFailure({
                error: err.error?.message ?? 'No se pudo iniciar sesión con Google',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  // ── REGISTER ──────────────────────────────────────────────────────────────

  readonly register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      switchMap(({ data }) =>
        this.authService.register(data).pipe(
          map((res) => AuthActions.registerSuccess({ tokens: res.data })),
          catchError((err) =>
            of(
              AuthActions.registerFailure({
                error: err.error?.message ?? 'Error al crear la cuenta',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  // ── PERSIST refreshToken en localStorage después de auth exitosa ──────────

  readonly persistRefreshToken$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          AuthActions.loginSuccess,
          AuthActions.registerSuccess,
          AuthActions.restoreSessionSuccess,
          AuthActions.refreshTokensSuccess,
        ),
        tap(({ tokens }) => {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
          }
        }),
      ),
    { dispatch: false },
  );

  // ── CARGAR USUARIO después de auth exitosa ────────────────────────────────

  readonly loadUserOnAuth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        AuthActions.loginSuccess,
        AuthActions.registerSuccess,
        AuthActions.restoreSessionSuccess,
      ),
      switchMap(() =>
        this.authService.getMe().pipe(
          map((res) => AuthActions.loadUserSuccess({ user: res.data })),
          catchError(() => of(AuthActions.loadUserFailure())),
        ),
      ),
    ),
  );

  // ── NAVEGAR después de login/register ─────────────────────────────────────

  readonly navigateAfterAuth$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess, AuthActions.registerSuccess),
        tap(({ tokens }) => {
          const dest =
            tokens.role === 'SELLER'
              ? '/seller/dashboard'
              : tokens.role === 'ADMIN'
                ? '/admin'
                : '/';
          this.router.navigate([dest]);
        }),
      ),
    { dispatch: false },
  );

  // ── LOGOUT ────────────────────────────────────────────────────────────────

  readonly logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      switchMap(() =>
        this.authService.logout().pipe(
          map(() => AuthActions.logoutComplete()),
          catchError(() => of(AuthActions.logoutComplete())),
        ),
      ),
    ),
  );

  readonly clearStorageOnLogout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutComplete, AuthActions.refreshTokensFailure),
        tap(() => {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.removeItem(REFRESH_TOKEN_KEY);
          }
        }),
      ),
    { dispatch: false },
  );

  readonly navigateAfterLogout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutComplete),
        tap(() => this.router.navigate(['/login'])),
      ),
    { dispatch: false },
  );

  // ── RESTORE SESSION (APP_INITIALIZER) ─────────────────────────────────────

  readonly restoreSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.restoreSession),
      switchMap(() => {
        if (!isPlatformBrowser(this.platformId)) {
          return of(AuthActions.restoreSessionFailure());
        }

        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) {
          return of(AuthActions.restoreSessionFailure());
        }

        return this.authService.refresh({ refreshToken }).pipe(
          map((res) => AuthActions.restoreSessionSuccess({ tokens: res.data })),
          catchError(() => of(AuthActions.restoreSessionFailure())),
        );
      }),
    ),
  );
}
