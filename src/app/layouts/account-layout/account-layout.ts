import { Component, ElementRef, HostListener, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { NgIcon } from '@ng-icons/core';
import { selectUserDisplayName, selectRole, selectUser } from '../../core/auth/store/auth.selectors';
import { selectCartItemCount } from '../../core/cart/store/cart.selectors';
import * as AuthActions from '../../core/auth/store/auth.actions';
import { map } from 'rxjs';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'app-account-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule, NgIcon],
  templateUrl: './account-layout.html',
})
export class AccountLayoutComponent {
  private store  = inject(Store);
  private router = inject(Router);
  readonly theme = inject(ThemeService);

  displayName$ = this.store.select(selectUserDisplayName);
  avatarUrl$   = this.store.select(selectUser).pipe(map(u => u?.avatarUrl ?? null));
  initials$    = this.store.select(selectUser).pipe(map(u => u ? ((u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')).toUpperCase() || u.email[0].toUpperCase() : ''));
  role$      = this.store.select(selectRole);
  cartCount$ = this.store.select(selectCartItemCount);

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

  submitSearch(): void {
    const q = (this.searchQuery ?? '').trim();
    this.router.navigate(['/catalog'], { queryParams: q ? { q } : {} });
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
