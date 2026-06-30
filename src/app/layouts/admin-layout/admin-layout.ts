import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgIcon } from '@ng-icons/core';
import { filter, map } from 'rxjs';
import { ThemeService } from '../../core/theme.service';
import { NeoAiFabComponent } from '../../shared/components/neo-ai-fab.component';
import { AnalyticsChatComponent } from '../../features/admin/analytics-dashboard/analytics-chat.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIcon, NeoAiFabComponent, AnalyticsChatComponent],
  templateUrl: './admin-layout.html',
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
export class AdminLayoutComponent {
  private readonly router = inject(Router);
  readonly theme       = inject(ThemeService);
  readonly sidebarOpen = signal(false);
  readonly desktopOpen = signal(true);
  readonly chatOpen    = signal(false);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  // En una conversacion de mensajes, el FAB se superpone con la barra de
  // escribir mensaje — se oculta ahi, igual que en /search.
  readonly onMessagesRoute = computed(() => this.currentUrl().startsWith('/admin/messages'));

  closeSidebar(): void { this.sidebarOpen.set(false); }
  toggleChat(): void   { this.chatOpen.update(v => !v); }
}
