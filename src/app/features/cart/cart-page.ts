import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { NgIcon } from '@ng-icons/core';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';
import * as CartActions from '../../core/cart/store/cart.actions';
import {
  selectCart,
  selectCartItems,
  selectCartTotal,
  selectCartLoading,
  selectCartHasPriceChanges,
} from '../../core/cart/store/cart.selectors';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon, CopCurrencyPipe],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold text-text-primary mb-6">Mi carrito</h1>

      @if (loading$ | async) {
        <div class="space-y-3">
          @for (_ of [1,2,3]; track $index) {
            <div class="h-24 rounded-xl bg-bg-surface border border-border animate-pulse"></div>
          }
        </div>

      } @else if ((items$ | async)?.length === 0) {
        <div class="flex flex-col items-center gap-4 py-20 text-text-muted">
          <ng-icon name="lucideShoppingCart" size="52" />
          <p class="text-lg font-medium text-text-primary">Tu carrito está vacío</p>
          <p class="text-sm">Agrega productos desde el catálogo para comenzar.</p>
          <a routerLink="/catalog"
             class="mt-2 px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors">
            Explorar catálogo
          </a>
        </div>

      } @else {
        <div class="grid lg:grid-cols-3 gap-6">

          <!-- Lista de ítems -->
          <div class="lg:col-span-2 flex flex-col gap-3">

            @if (hasPriceChanges$ | async) {
              <div class="flex items-center gap-2 rounded-lg bg-warning/10 border border-warning/30 px-4 py-3 text-sm text-warning">
                <ng-icon name="lucideTriangleAlert" size="16" />
                Algunos precios cambiaron desde que los agregaste.
              </div>
            }

            @for (item of items$ | async; track item.id) {
              <div class="flex gap-4 bg-bg-surface border border-border rounded-xl p-4">
                <!-- Imagen -->
                <div class="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-bg-elevated">
                  @if (item.productImageUrl) {
                    <img [src]="item.productImageUrl" [alt]="item.productName" class="w-full h-full object-cover" />
                  } @else {
                    <div class="w-full h-full flex items-center justify-center">
                      <ng-icon name="lucidePackage" size="24" class="text-text-muted" />
                    </div>
                  }
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-text-primary line-clamp-2 leading-snug">
                    {{ item.productName }}
                  </p>
                  <div class="flex items-center gap-2 mt-1">
                    <p class="text-sm font-bold text-text-primary">
                      {{ item.unitPrice | copCurrency }}
                    </p>
                    @if (item.priceChanged) {
                      <span class="text-xs text-warning">
                        Nuevo: {{ item.currentPrice | copCurrency }}
                      </span>
                    }
                  </div>

                  <!-- Cantidad -->
                  <div class="flex items-center gap-2 mt-2">
                    <button
                      (click)="updateQty(item.id, item.quantity - 1)"
                      [disabled]="item.quantity <= 1"
                      class="w-7 h-7 rounded-lg border border-border text-text-secondary hover:border-accent/60 hover:text-text-primary
                             disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-lg leading-none">
                      −
                    </button>
                    <span class="w-6 text-center text-sm font-medium text-text-primary">{{ item.quantity }}</span>
                    <button
                      (click)="updateQty(item.id, item.quantity + 1)"
                      class="w-7 h-7 rounded-lg border border-border text-text-secondary hover:border-accent/60 hover:text-text-primary
                             transition-colors flex items-center justify-center text-lg leading-none">
                      +
                    </button>
                    <button
                      (click)="remove(item.id)"
                      class="ml-2 text-text-muted hover:text-error transition-colors">
                      <ng-icon name="lucideX" size="16" />
                    </button>
                  </div>
                </div>

                <!-- Subtotal -->
                <div class="shrink-0 text-right">
                  <p class="text-sm font-bold text-text-primary">{{ item.subtotal | copCurrency }}</p>
                </div>
              </div>
            }

            <!-- Vaciar carrito -->
            <button
              (click)="clearCart()"
              class="self-start text-xs text-text-muted hover:text-error transition-colors mt-1">
              Vaciar carrito
            </button>
          </div>

          <!-- Resumen -->
          <aside class="lg:col-span-1">
            <div class="bg-bg-surface border border-border rounded-xl p-5 sticky top-20">
              <h2 class="text-base font-semibold text-text-primary mb-4">Resumen del pedido</h2>

              <div class="flex justify-between text-sm text-text-secondary mb-2">
                <span>Subtotal</span>
                <span class="text-text-primary font-medium">{{ total$ | async | copCurrency }}</span>
              </div>
              <div class="flex justify-between text-sm text-text-secondary mb-4">
                <span>Envío</span>
                <span class="text-success font-medium">A confirmar</span>
              </div>

              <div class="border-t border-border pt-4 flex justify-between font-bold text-text-primary mb-5">
                <span>Total estimado</span>
                <span>{{ total$ | async | copCurrency }}</span>
              </div>

              <a routerLink="/checkout"
                 class="block w-full text-center py-3 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors
                        shadow-[0_0_20px_theme(colors.accent-glow)]">
                Proceder al pago
              </a>
              <a routerLink="/catalog"
                 class="block w-full text-center mt-2 py-2 text-xs text-text-muted hover:text-text-primary transition-colors">
                Seguir comprando
              </a>
            </div>
          </aside>

        </div>
      }
    </div>
  `,
})
export class CartPageComponent {
  private store = inject(Store);

  items$ = this.store.select(selectCartItems);
  total$ = this.store.select(selectCartTotal);
  loading$ = this.store.select(selectCartLoading);
  hasPriceChanges$ = this.store.select(selectCartHasPriceChanges);

  updateQty(itemId: string, quantity: number): void {
    if (quantity < 1) return;
    this.store.dispatch(CartActions.updateItem({ itemId, quantity }));
  }

  remove(itemId: string): void {
    this.store.dispatch(CartActions.removeItem({ itemId }));
  }

  clearCart(): void {
    this.store.dispatch(CartActions.clearCart());
  }
}
