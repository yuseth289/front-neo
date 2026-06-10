import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { ThemeService } from '../../core/theme.service';
import { NeoAiFabComponent } from '../../shared/components/neo-ai-fab.component';
import { SellerAiPanelComponent } from '../../shared/components/seller-ai-panel.component';

@Component({
  selector: 'app-seller-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIcon, NeoAiFabComponent, SellerAiPanelComponent],
  templateUrl: './seller-layout.html',
})
export class SellerLayoutComponent {
  readonly theme    = inject(ThemeService);
  readonly chatOpen = signal(false);

  toggleChat(): void { this.chatOpen.update(v => !v); }
}
