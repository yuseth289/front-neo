import { Component, ElementRef, HostListener, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgIcon } from '@ng-icons/core';
import { filter, map } from 'rxjs';
import { selectIsAuthenticated, selectUser, selectRole } from '../../core/auth/store/auth.selectors';
import { selectCartItems } from '../../core/cart/store/cart.selectors';
import * as AuthActions from '../../core/auth/store/auth.actions';
import { ThemeService } from '../../core/theme.service';
import { NeoAiFabComponent } from '../../shared/components/neo-ai-fab.component';
import { UserAiPanelComponent } from '../../shared/components/user-ai-panel.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule, NgIcon, NeoAiFabComponent, UserAiPanelComponent],
  templateUrl: './public-layout.html',
})
export class PublicLayoutComponent {
  private store  = inject(Store);
  private router = inject(Router);
  readonly theme = inject(ThemeService);

  isAuthenticated$ = this.store.select(selectIsAuthenticated);
  displayName$     = this.store.select(selectUser).pipe(map(u => u?.firstName ?? u?.email ?? 'Cuenta'));
  avatarUrl$       = this.store.select(selectUser).pipe(map(u => u?.avatarUrl ?? null));
  initials$        = this.store.select(selectUser).pipe(map(u => u ? ((u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')).toUpperCase() || u.email[0].toUpperCase() : ''));
  role$            = this.store.select(selectRole);
  cartCount$       = this.store.select(selectCartItems).pipe(map(items => items.reduce((s, it) => s + it.quantity, 0)));

  mobileOpen  = signal(false);
  chatOpen    = signal(false);
  searchQuery = '';

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  // La pagina /search ya es la interfaz de IA — el FAB flotante y el footer
  // (que obliga a scrollear la pagina entera) serian redundantes/molestos ahi,
  // en cualquier estado (vacio, cargando, con resultados, aclaracion, etc).
  readonly onAiSearchPage = computed(() => this.currentUrl().startsWith('/search'));

  toggleChat(): void { this.chatOpen.update(v => !v); }

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
    if (!q) return;
    if (this.isNaturalLanguage(q)) {
      this.router.navigate(['/search'], { queryParams: { q } });
    } else {
      this.router.navigate(['/catalog'], { queryParams: { q } });
    }
  }

  private isNaturalLanguage(q: string): boolean {
    const words = q.split(/\s+/);
    if (words.length >= 5) return true;
    const nlPattern = /\b(para|que|con|sin|como|regalo|regalar|madre|padre|papá|mamá|hermano|hijo|qué|cuál|cuales|quiero|busco|necesito|menos de|más de|máximo|mínimo|pesos|presupuesto|jugar|sirve|recomienda|mejor)\b/i;
    return words.length >= 3 && nlPattern.test(q);
  }

  logout() {
    this.store.dispatch(AuthActions.logout());
  }
}
