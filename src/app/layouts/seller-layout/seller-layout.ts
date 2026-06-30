import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgIcon } from '@ng-icons/core';
import { filter, map } from 'rxjs';
import { ThemeService } from '../../core/theme.service';
import { SellerAiTriggerService } from '../../core/services/seller-ai-trigger.service';
import { NeoAiFabComponent } from '../../shared/components/neo-ai-fab.component';
import { SellerAiPanelComponent } from '../../shared/components/seller-ai-panel.component';

const PRODUCT_FORM_ROUTE = /^\/seller\/products\/(new|[^/]+)$/;

@Component({
  selector: 'app-seller-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIcon, NeoAiFabComponent, SellerAiPanelComponent],
  templateUrl: './seller-layout.html',
  styles: [`
    @media (min-width: 1024px) {
      .sidebar-desktop-hidden {
        width: 0 !important;
        overflow: hidden;
        border-right: none !important;
      }
    }
  `],
})
export class SellerLayoutComponent {
  private readonly router  = inject(Router);
  private readonly aiTrigger = inject(SellerAiTriggerService);
  readonly theme       = inject(ThemeService);
  readonly chatOpen    = this.aiTrigger.genericChatOpen;
  readonly sidebarOpen = signal(false);
  readonly desktopOpen = signal(true);

  closeSidebar(): void { this.sidebarOpen.set(false); }

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  private readonly onProductFormRoute = computed(() => PRODUCT_FORM_ROUTE.test(this.currentUrl()));

  // En crear/editar producto, el FAB sigue visible pero abre el Asistente IA
  // propio de esa pagina (mejora de contenido, puntaje, imagenes) en vez del
  // panel generico de Seller Analytics.
  toggleChat(): void {
    if (this.onProductFormRoute()) {
      this.aiTrigger.requestProductChat();
      return;
    }
    this.aiTrigger.toggleGenericChat();
  }
}
