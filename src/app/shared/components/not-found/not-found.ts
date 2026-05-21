import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <p class="text-8xl font-black text-accent mb-4"
         style="text-shadow: 0 0 40px var(--color-accent-glow)">
        404
      </p>
      <h1 class="text-2xl font-bold text-text-primary mb-2">Página no encontrada</h1>
      <p class="text-text-secondary mb-8">La ruta que buscas no existe o fue movida.</p>
      <a routerLink="/"
         class="text-sm text-accent hover:text-accent-hover transition-colors">
        ← Volver al inicio
      </a>
    </div>
  `,
})
export class NotFoundComponent {}
