import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { NgIcon } from '@ng-icons/core';
import { selectUserDisplayName, selectRole } from '../../core/auth/store/auth.selectors';
import { selectCartItemCount } from '../../core/cart/store/cart.selectors';
import * as AuthActions from '../../core/auth/store/auth.actions';

@Component({
  selector: 'app-account-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, NgIcon],
  templateUrl: './account-layout.html',
})
export class AccountLayoutComponent {
  private store = inject(Store);

  displayName$ = this.store.select(selectUserDisplayName);
  role$ = this.store.select(selectRole);
  cartCount$ = this.store.select(selectCartItemCount);

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
