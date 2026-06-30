import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgIcon } from '@ng-icons/core';
import { filter, map } from 'rxjs';
import { ThemeService } from '../../core/theme.service';
import { NeoAiFabComponent } from '../../shared/components/neo-ai-fab.component';
import { SellerAiPanelComponent } from '../../shared/components/seller-ai-panel.component';

const PRODUCT_FORM_ROUTE = /^\/seller\/products\/(new|[^/]+)$/;

@Component({
  selector: 'app-seller-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIcon, NeoAiFabComponent, SellerAiPanelComponent],
  templateUrl: './seller-layout.html',
})
export class SellerLayoutComponent {
  private readonly router = inject(Router);
  readonly theme    = inject(ThemeService);
  readonly chatOpen = signal(false);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  // Crear/editar producto ya tiene su propio Asistente IA (mejora de contenido,
  // puntaje, imagenes) — el FAB generico de Seller Analytics seria redundante y confuso ahi.
  readonly hideAiFab = computed(() => PRODUCT_FORM_ROUTE.test(this.currentUrl()));

  toggleChat(): void { this.chatOpen.update(v => !v); }
}
