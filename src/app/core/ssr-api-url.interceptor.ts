import { isPlatformServer } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject, InjectionToken, PLATFORM_ID } from '@angular/core';
import { environment } from '../../environments/environment';

export const BACKEND_URL = new InjectionToken<string>('BACKEND_URL');

export const ssrApiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isPlatformServer(inject(PLATFORM_ID))) return next(req);

  const backendUrl = inject(BACKEND_URL, { optional: true }) ?? environment.apiUrl;
  if (req.url.startsWith(environment.apiUrl) && backendUrl !== environment.apiUrl) {
    return next(req.clone({ url: req.url.replace(environment.apiUrl, backendUrl) }));
  }
  return next(req);
};
