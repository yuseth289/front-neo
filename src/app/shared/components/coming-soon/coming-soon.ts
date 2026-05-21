import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div class="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
        <span class="text-3xl">🎮</span>
      </div>
      <h1 class="text-2xl font-bold text-text-primary mb-2">{{ title }}</h1>
      <p class="text-text-secondary mb-8">Esta sección estará disponible próximamente.</p>
      <a routerLink="/"
         class="text-sm text-accent hover:text-accent-hover transition-colors">
        ← Volver al inicio
      </a>
    </div>
  `,
})
export class ComingSoonComponent {
  protected title = inject(ActivatedRoute).snapshot.data['title'] ?? 'Próximamente';
}
