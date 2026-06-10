import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
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
  readonly theme       = inject(ThemeService);
  readonly sidebarOpen = signal(false);
  readonly desktopOpen = signal(true);
  readonly chatOpen    = signal(false);

  closeSidebar(): void { this.sidebarOpen.set(false); }
  toggleChat(): void   { this.chatOpen.update(v => !v); }
}
