import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly theme = signal<'dark' | 'light'>(
    this.isBrowser
      ? ((localStorage.getItem('neo-theme') as 'dark' | 'light') || 'dark')
      : 'dark'
  );

  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    effect(() => {
      const t = this.theme();
      if (!this.isBrowser) return;
      document.documentElement.classList.toggle('light', t === 'light');
      localStorage.setItem('neo-theme', t);
    });
  }

  toggle(): void {
    this.theme.update(t => (t === 'dark' ? 'light' : 'dark'));
  }
}
