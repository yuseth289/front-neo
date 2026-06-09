import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIcon],
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
  readonly sidebarOpen = signal(false);   // mobile
  readonly desktopOpen = signal(true);    // desktop

  closeSidebar(): void { this.sidebarOpen.set(false); }
}
