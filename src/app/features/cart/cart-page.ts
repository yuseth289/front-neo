import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { NgIcon } from '@ng-icons/core';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';
import * as CartActions from '../../core/cart/store/cart.actions';
import {
  selectCartItems,
  selectCartTotal,
  selectCartLoading,
  selectCartHasPriceChanges,
  selectCartError,
} from '../../core/cart/store/cart.selectors';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon, CopCurrencyPipe],
  template: `
    <div class="relative">
      <!-- Ambient backdrop -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden -z-[1]">
        <div class="neo-grid-bg absolute inset-0 opacity-20"></div>
        <span class="neo-orb red" style="width:420px;height:420px;top:-10%;right:-5%;opacity:0.1;"></span>
      </div>

      <div class="relative max-w-[1024px] mx-auto px-4 py-8">

        <!-- Header -->
        <div class="neo-reveal mb-6">
          <p class="neo-stat-label">Compras</p>
          <h1 class="font-display text-[28px] font-bold tracking-[-0.02em] text-text-primary mt-0.5">
            Mi carrito
          </h1>
        </div>

        <!-- Loading -->
        @if (loading$ | async) {
          <div class="flex flex-col gap-3">
            @for (_ of [1,2,3]; track $index) {
              <div class="h-24 rounded-2xl bg-bg-surface border border-border animate-pulse"></div>
            }
          </div>

        <!-- Empty -->
        } @else if ((items$ | async)?.length === 0) {
          <div class="neo-card-premium p-14 flex flex-col items-center gap-4 text-center neo-reveal">
            <div class="w-16 h-16 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center">
              <ng-icon name="lucideShoppingCart" size="28" class="text-text-muted" />
            </div>
            <div>
              <p class="text-base font-semibold text-text-primary">Tu carrito está vacío</p>
              <p class="text-sm text-text-muted mt-1">Agrega productos desde el catálogo para comenzar.</p>
            </div>
            <a routerLink="/catalog" class="neo-btn-primary !text-[13px] !py-2.5 !px-5 mt-1">
              <ng-icon name="lucideLayoutGrid" size="14" />
              Explorar catálogo
            </a>
          </div>

        <!-- Items -->
        } @else {
          <div class="grid lg:grid-cols-[2fr_1fr] gap-6 items-start">

            <!-- Left: items list -->
            <div class="flex flex-col gap-3 neo-reveal">

              <!-- Price change warning -->
              @if (hasPriceChanges$ | async) {
                <div class="flex items-center gap-2.5 rounded-[10px] bg-warning/10 border border-warning/30
                            px-3.5 py-2.5 text-sm text-warning">
                  <ng-icon name="lucideTriangleAlert" size="16" />
                  Algunos precios cambiaron desde que los agregaste.
                </div>
              }

              <!-- Stock error -->
              @if (error$ | async; as cartError) {
                <div class="flex items-center gap-2.5 rounded-[10px] bg-error/10 border border-error/30
                            px-3.5 py-2.5 text-sm text-error">
                  <ng-icon name="lucideCircleAlert" size="16" class="shrink-0" />
                  {{ cartError }}
                </div>
              }

              <!-- Cart items -->
              @for (item of items$ | async; track item.id) {
                <div class="neo-card-premium flex gap-4 p-4">
                  <!-- Image -->
                  <div class="w-20 h-20 shrink-0 rounded-[10px] overflow-hidden bg-bg-elevated border border-border">
                    @if (item.productImageUrl) {
                      <img [src]="item.productImageUrl" [alt]="item.productName"
                           class="w-full h-full object-cover" />
                    } @else {
                      <div class="w-full h-full flex items-center justify-center">
                        <ng-icon name="lucidePackage" size="22" class="text-text-muted" />
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

                    <!-- Subtotal móvil (solo en xs) -->
                    @if (item.quantity > 1) {
                      <p class="text-xs text-text-muted mt-1 sm:hidden tabular-nums">
                        Total: <span class="font-semibold text-text-primary">{{ item.subtotal | copCurrency }}</span>
                      </p>
                    }

                    <!-- Qty controls -->
                    <div class="flex items-center gap-2 mt-2.5">
                      <div class="flex items-center rounded-[10px] border border-border overflow-hidden">
                        <button
                          (click)="updateQty(item.id, item.quantity - 1)"
                          [disabled]="item.quantity <= 1"
                          class="w-8 h-8 flex items-center justify-center text-text-secondary
                                 hover:bg-bg-elevated hover:text-text-primary transition-colors
                                 disabled:opacity-30 disabled:cursor-not-allowed">
                          <ng-icon name="lucideMinus" size="13" />
                        </button>
                        <span class="w-9 text-center text-sm font-semibold text-text-primary tabular-nums">
                          {{ item.quantity }}
                        </span>
                        <button
                          (click)="updateQty(item.id, item.quantity + 1)"
                          [disabled]="item.availableStock > 0 && item.quantity >= item.availableStock"
                          class="w-8 h-8 flex items-center justify-center text-text-secondary
                                 hover:bg-bg-elevated hover:text-text-primary transition-colors
                                 disabled:opacity-30 disabled:cursor-not-allowed">
                          <ng-icon name="lucidePlus" size="13" />
                        </button>
                      </div>
                      <button (click)="remove(item.id)"
                        class="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors ml-1">
                        <ng-icon name="lucideTrash2" size="14" />
                      </button>
                    </div>
                  </div>

                  <!-- Subtotal (solo visible en sm+) -->
                  <div class="hidden sm:block shrink-0 text-right self-center">
                    <p class="text-sm font-bold text-text-primary tabular-nums">
                      {{ item.subtotal | copCurrency }}
                    </p>
                  </div>
                </div>
              }

              <!-- Clear cart -->
              <button (click)="clearCart()"
                class="self-start text-xs text-text-muted hover:text-error transition-colors mt-1 flex items-center gap-1">
                <ng-icon name="lucideX" size="12" /> Vaciar carrito
              </button>
            </div>

            <!-- Right: sticky summary -->
            <aside style="position:sticky;top:92px;">
              <div class="neo-card-premium p-5 neo-reveal">
                <p class="text-[13px] font-semibold text-text-primary mb-4">Resumen del pedido</p>

                <div class="flex flex-col gap-2.5 text-sm">
                  <div class="flex justify-between text-text-secondary">
                    <span>Subtotal</span>
                    <span class="text-text-primary font-medium tabular-nums">
                      {{ total$ | async | copCurrency }}
                    </span>
                  </div>
                  <div class="flex justify-between text-text-secondary">
                    <span>Envío</span>
                    <span class="text-success font-medium">A confirmar</span>
                  </div>
                </div>

                <div class="border-t border-border mt-4 pt-4 flex justify-between items-baseline">
                  <span class="text-sm font-semibold text-text-primary">Total estimado</span>
                  <span class="font-display text-[20px] font-bold text-text-primary tabular-nums">
                    {{ total$ | async | copCurrency }}
                  </span>
                </div>

                <a routerLink="/checkout"
                   class="neo-btn-primary w-full justify-center !py-3.5 mt-5">
                  <ng-icon name="lucideShield" size="15" />
                  Proceder al pago
                  <ng-icon name="lucideArrowRight" size="14" />
                </a>
                <a routerLink="/catalog"
                   class="block text-center mt-2.5 text-xs text-text-muted hover:text-text-primary transition-colors py-1">
                  Seguir comprando
                </a>
              </div>

              <!-- Security note -->
              <div class="flex items-center gap-2.5 mt-3 px-4 py-3 rounded-[10px]
                          bg-bg-surface border border-border neo-reveal">
                <ng-icon name="lucideShieldCheck" size="16" class="text-success shrink-0" />
                <p class="text-xs text-text-secondary leading-snug">
                  Pago 100% seguro y encriptado.
                  <a class="text-accent hover:underline ml-0.5">Política de devoluciones</a>
                </p>
              </div>
            </aside>

          </div>
        }
      </div>
    </div>
  `,
})
export class CartPageComponent {
  private store = inject(Store);

  items$           = this.store.select(selectCartItems);
  total$           = this.store.select(selectCartTotal);
  loading$         = this.store.select(selectCartLoading);
  hasPriceChanges$ = this.store.select(selectCartHasPriceChanges);
  error$           = this.store.select(selectCartError);

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
