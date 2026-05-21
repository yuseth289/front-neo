import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { catchError, first, switchMap, throwError } from 'rxjs';
import { selectAccessToken, selectRefreshToken } from './store/auth.selectors';
import * as AuthActions from './store/auth.actions';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/auth/')) {
    return next(req);
  }

  const store = inject(Store);
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);

  return store.select(selectAccessToken).pipe(
    first(),
    switchMap((accessToken) => {
      const authedReq = accessToken ? addBearerHeader(req, accessToken) : req;
      return next(authedReq).pipe(
        catchError((err) => {
          if (err.status !== 401) {
            return throwError(() => err);
          }
          return store.select(selectRefreshToken).pipe(
            first(),
            switchMap((refreshToken) => {
              if (!refreshToken) {
                store.dispatch(AuthActions.logout());
                return throwError(() => err);
              }
              return authService.refresh({ refreshToken }).pipe(
                switchMap((res) => {
                  store.dispatch(AuthActions.refreshTokensSuccess({ tokens: res.data }));
                  if (isPlatformBrowser(platformId)) {
                    localStorage.setItem('neo_refresh_token', res.data.refreshToken);
                  }
                  return next(addBearerHeader(req, res.data.accessToken));
                }),
                catchError(() => {
                  store.dispatch(AuthActions.refreshTokensFailure());
                  store.dispatch(AuthActions.logout());
                  return throwError(() => err);
                }),
              );
            }),
          );
        }),
      );
    }),
  );
};

function addBearerHeader(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
