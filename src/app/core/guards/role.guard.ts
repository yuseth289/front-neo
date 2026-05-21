import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, switchMap, take } from 'rxjs';
import { selectAuthInitialized, selectRole } from '../auth/store/auth.selectors';
import { Role } from '../../shared/models/enums';

export const roleGuard =
  (requiredRole: Role): CanActivateFn =>
  () => {
    const store = inject(Store);
    const router = inject(Router);

    return store.select(selectAuthInitialized).pipe(
      filter((initialized) => initialized),
      take(1),
      switchMap(() => store.select(selectRole).pipe(take(1))),
      map((role) => (role === requiredRole ? true : router.createUrlTree(['/']))),
    );
  };
