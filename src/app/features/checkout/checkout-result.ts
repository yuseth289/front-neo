import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { Store } from '@ngrx/store';
import * as CartActions from '../../core/cart/store/cart.actions';

@Component({
  selector: 'app-checkout-result',
  standalone: true,
  imports: [RouterLink, NgIcon],
  template: `
    <div class="relative min-h-[70vh] flex items-center justify-center px-4 py-16">
      <!-- Ambient backdrop -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden -z-[1]">
        <div class="neo-grid-bg absolute inset-0 opacity-20"></div>
        @if (status() === 'success') {
          <span class="neo-orb cyan" style="width:480px;height:480px;top:-10%;left:50%;transform:translateX(-50%);opacity:0.08;"></span>
        } @else if (status() === 'pending') {
          <span class="neo-orb red" style="width:400px;height:400px;top:-5%;right:-5%;opacity:0.09;"></span>
        } @else {
          <span class="neo-orb red" style="width:420px;height:420px;top:-10%;left:50%;transform:translateX(-50%);opacity:0.1;"></span>
        }
      </div>

      <div class="relative w-full max-w-[520px] text-center neo-reveal">

        @if (status() === 'success') {
          <!-- ── SUCCESS ─────────────────────────────────────── -->
          <div class="neo-card-premium p-10 flex flex-col items-center gap-5">
            <div class="w-20 h-20 rounded-full bg-success/10 border border-success/30 flex items-center justify-center
                        shadow-[0_0_40px_rgba(0,200,120,0.25)]">
              <ng-icon name="lucideCircleCheck" size="40" class="text-success" />
            </div>
            <div>
              <p class="neo-stat-label mb-1">Pago exitoso</p>
              <h1 class="font-display text-[30px] font-bold tracking-[-0.02em] text-text-primary">
                ¡Compra confirmada!
              </h1>
              <p class="mt-2.5 text-sm text-text-secondary leading-relaxed max-w-[360px] mx-auto">
                Tu pedido fue procesado correctamente. Recibirás una confirmación por correo electrónico en los próximos minutos.
              </p>
            </div>
            <div class="w-full flex flex-col gap-2.5 pt-2">
              <a routerLink="/orders" class="neo-btn-primary w-full justify-center !py-3.5">
                <ng-icon name="lucideClipboardList" size="15" />
                Ver mis órdenes
              </a>
              <a routerLink="/catalog" class="neo-btn-ghost w-full justify-center !py-2.5 text-sm">
                <ng-icon name="lucideLayoutGrid" size="14" />
                Seguir comprando
              </a>
            </div>
          </div>

        } @else if (status() === 'pending') {
          <!-- ── PENDING ──────────────────────────────────────── -->
          <div class="neo-card-premium p-10 flex flex-col items-center gap-5">
            <div class="w-20 h-20 rounded-full bg-warning/10 border border-warning/30 flex items-center justify-center
                        shadow-[0_0_32px_rgba(245,158,11,0.2)]">
              <ng-icon name="lucideRefreshCw" size="36" class="text-warning" />
            </div>
            <div>
              <p class="neo-stat-label mb-1">En proceso</p>
              <h1 class="font-display text-[30px] font-bold tracking-[-0.02em] text-text-primary">
                Checkout iniciado
              </h1>
              <p class="mt-2.5 text-sm text-text-secondary leading-relaxed max-w-[360px] mx-auto">
                Tu pedido está en proceso de pago. Tienes <span class="text-warning font-medium">30 minutos</span> para completarlo antes de que expire.
              </p>
            </div>

            <!-- Timer hint -->
            <div class="w-full flex items-center gap-2.5 rounded-[10px] bg-warning/8 border border-warning/25
                        px-3.5 py-2.5">
              <ng-icon name="lucideTriangleAlert" size="15" class="text-warning shrink-0" />
              <p class="text-[12px] text-warning leading-snug">
                Completa tu pago para confirmar el pedido.
              </p>
            </div>

            <div class="w-full flex flex-col gap-2.5">
              <a routerLink="/orders" class="neo-btn-primary w-full justify-center !py-3.5">
                <ng-icon name="lucideClipboardList" size="15" />
                Ver mis órdenes
              </a>
              <a routerLink="/" class="neo-btn-ghost w-full justify-center !py-2.5 text-sm text-text-muted">
                Volver al inicio
              </a>
            </div>
          </div>

        } @else {
          <!-- ── FAILED ───────────────────────────────────────── -->
          <div class="neo-card-premium p-10 flex flex-col items-center gap-5">
            <div class="w-20 h-20 rounded-full bg-error/10 border border-error/30 flex items-center justify-center
                        shadow-[0_0_32px_rgba(239,68,68,0.2)]">
              <ng-icon name="lucideTriangleAlert" size="36" class="text-error" />
            </div>
            <div>
              <p class="neo-stat-label mb-1 !text-error">Error de pago</p>
              <h1 class="font-display text-[30px] font-bold tracking-[-0.02em] text-text-primary">
                Pago no completado
              </h1>
              <p class="mt-2.5 text-sm text-text-secondary leading-relaxed max-w-[360px] mx-auto">
                No se pudo procesar tu pago. Verifica los datos ingresados e inténtalo nuevamente.
              </p>
            </div>
            <div class="w-full flex flex-col gap-2.5">
              <a routerLink="/cart" class="neo-btn-primary w-full justify-center !py-3.5">
                <ng-icon name="lucideShoppingCart" size="15" />
                Volver al carrito
              </a>
              <a routerLink="/" class="neo-btn-ghost w-full justify-center !py-2.5 text-sm text-text-muted">
                Volver al inicio
              </a>
            </div>
          </div>
        }

        <!-- Security note -->
        <div class="flex items-center gap-2.5 mt-4 px-4 py-3 rounded-[10px] bg-bg-surface border border-border">
          <ng-icon name="lucideShieldCheck" size="15" class="text-success shrink-0" />
          <p class="text-[11px] text-text-secondary leading-snug text-left">
            Pago 100% seguro con cifrado 3-D Secure.
            <a class="text-accent hover:underline ml-0.5">Política de devoluciones</a>
          </p>
        </div>

      </div>
    </div>
  `,
})
export class CheckoutResultComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private store = inject(Store);
  status = signal<'success' | 'pending' | 'failed'>('pending');

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;

    // El query param 'status' lo establece NeoGaming en la back_url configurada.
    // Mercado Pago también puede añadir 'collection_status' con el estado real del pago.
    const neoStatus          = params.get('status');
    const mpCollectionStatus = params.get('collection_status'); // "approved" | "rejected" | "pending"

    if (neoStatus === 'success' || mpCollectionStatus === 'approved') {
      this.status.set('success');
      // Pago confirmado: limpiar el carrito del store y recargar desde el backend
      // para reflejar que el checkout fue completado.
      this.store.dispatch(CartActions.clearCartState());
      this.store.dispatch(CartActions.loadCart());
    } else if (neoStatus === 'failed' || mpCollectionStatus === 'rejected') {
      this.status.set('failed');
      // Pago fallido: recargar carrito desde backend (preserva los ítems para que el usuario pueda reintentar)
      this.store.dispatch(CartActions.loadCart());
    }
    // En cualquier otro caso permanece 'pending' (PSE, Efecty en proceso)
  }
}
