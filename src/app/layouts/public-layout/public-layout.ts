import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { NgIcon } from '@ng-icons/core';
import { selectIsAuthenticated, selectUserDisplayName, selectRole } from '../../core/auth/store/auth.selectors';
import * as AuthActions from '../../core/auth/store/auth.actions';
import { selectCartItemCount } from '../../core/cart/store/cart.selectors';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, NgIcon],
  templateUrl: './public-layout.html',
})
export class PublicLayoutComponent {
  private store = inject(Store);

  isAuthenticated$ = this.store.select(selectIsAuthenticated);
  displayName$ = this.store.select(selectUserDisplayName);
  role$ = this.store.select(selectRole);
  cartCount$ = this.store.select(selectCartItemCount);

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
