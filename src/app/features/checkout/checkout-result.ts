import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-checkout-result',
  standalone: true,
  imports: [RouterLink, NgIcon],
  template: `
    <div class="min-h-[60vh] flex items-center justify-center px-4">
      <div class="max-w-sm w-full text-center flex flex-col items-center gap-5">

        @if (status() === 'success') {
          <div class="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center">
            <ng-icon name="lucideCircleCheck" size="36" class="text-success" />
          </div>
          <h1 class="text-xl font-bold text-text-primary">¡Pedido confirmado!</h1>
          <p class="text-sm text-text-secondary">
            Tu pedido fue procesado correctamente. Recibirás una confirmación por correo.
          </p>
          <a routerLink="/orders"
             class="px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors">
            Ver mis órdenes
          </a>

        } @else if (status() === 'pending') {
          <div class="w-16 h-16 rounded-full bg-warning/15 flex items-center justify-center">
            <ng-icon name="lucideRefreshCw" size="36" class="text-warning" />
          </div>
          <h1 class="text-xl font-bold text-text-primary">Checkout iniciado</h1>
          <p class="text-sm text-text-secondary">
            Tu pedido está en proceso de pago. Tienes 30 minutos para completarlo.
          </p>
          <a routerLink="/orders"
             class="px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors">
            Ver mis órdenes
          </a>

        } @else {
          <div class="w-16 h-16 rounded-full bg-error/15 flex items-center justify-center">
            <ng-icon name="lucideTriangleAlert" size="36" class="text-error" />
          </div>
          <h1 class="text-xl font-bold text-text-primary">Pago no completado</h1>
          <p class="text-sm text-text-secondary">
            No se pudo procesar tu pago. Puedes intentarlo nuevamente.
          </p>
          <a routerLink="/cart"
             class="px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors">
            Volver al carrito
          </a>
        }

        <a routerLink="/" class="text-xs text-text-muted hover:text-text-primary transition-colors">
          Volver al inicio
        </a>
      </div>
    </div>
  `,
})
export class CheckoutResultComponent implements OnInit {
  private route = inject(ActivatedRoute);
  status = signal<'success' | 'pending' | 'failed'>('pending');

  ngOnInit(): void {
    const s = this.route.snapshot.queryParamMap.get('status');
    if (s === 'success' || s === 'failed') this.status.set(s);
  }
}
