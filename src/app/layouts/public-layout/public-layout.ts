import { Component, ElementRef, HostListener, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { NgIcon } from '@ng-icons/core';
import { map } from 'rxjs';
import { selectIsAuthenticated, selectUser, selectRole } from '../../core/auth/store/auth.selectors';
import { selectCartItems } from '../../core/cart/store/cart.selectors';
import * as AuthActions from '../../core/auth/store/auth.actions';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule, NgIcon],
  templateUrl: './public-layout.html',
})
export class PublicLayoutComponent {
  private store  = inject(Store);
  private router = inject(Router);

  isAuthenticated$ = this.store.select(selectIsAuthenticated);
  displayName$     = this.store.select(selectUser).pipe(map(u => u?.firstName ?? u?.email ?? 'Cuenta'));
  role$            = this.store.select(selectRole);
  cartCount$       = this.store.select(selectCartItems).pipe(map(items => items.reduce((s, it) => s + it.quantity, 0)));

  mobileOpen  = signal(false);
  searchQuery = '';

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null;
    if (e.key === '/' && target?.tagName !== 'INPUT' && target?.tagName !== 'TEXTAREA') {
      e.preventDefault();
      this.searchInput?.nativeElement.focus();
    }
  }

  submitSearch() {
    const q = (this.searchQuery ?? '').trim();
    this.router.navigate(['/catalog'], { queryParams: q ? { q } : {} });
  }

  logout() {
    this.store.dispatch(AuthActions.logout());
  }
}
