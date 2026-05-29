import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIcon],
  templateUrl: './admin-layout.html',
})
export class AdminLayoutComponent {
  readonly theme      = inject(ThemeService);
  readonly sidebarOpen = signal(false);

  closeSidebar(): void { this.sidebarOpen.set(false); }
}
