import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { NgIcon } from '@ng-icons/core';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';
import { WishlistService } from '../../core/account/wishlist.service';
import { WishlistStateService } from '../../core/account/wishlist-state.service';
import { Wishlist, WishlistItem } from '../../shared/models/wishlist.models';
import * as CartActions from '../../core/cart/store/cart.actions';

@Component({
  selector: 'app-wishlists-list',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon, CopCurrencyPipe],
  template: `
    <div class="max-w-2xl">

      <!-- Header -->
      <div class="mb-6">
        <p class="neo-stat-label">Cuenta</p>
        <h1 class="font-display text-[26px] font-bold tracking-[-0.02em] text-text-primary mt-0.5">
          Lista de deseos
        </h1>
        <p class="text-[13px] text-text-muted mt-1">
          Guarda los productos que quieres comprar. Te avisamos cuando bajen de precio.
        </p>
      </div>

      <!-- Skeleton -->
      @if (loading()) {
        <div class="flex flex-col gap-3">
          @for (_ of [1,2,3]; track $index) {
            <div class="h-24 rounded-2xl bg-bg-surface border border-border animate-pulse"></div>
          }
        </div>

      <!-- Empty -->
      } @else if (wishlist()?.items?.length === 0) {
        <div class="neo-card-premium p-14 flex flex-col items-center gap-4 text-center">
          <div class="w-14 h-14 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center">
            <ng-icon name="lucideHeart" size="26" class="text-text-muted" />
          </div>
          <div>
            <p class="text-base font-semibold text-text-primary">Tu lista está vacía</p>
            <p class="text-sm text-text-muted mt-1">
              Presiona el corazón en cualquier producto del catálogo para guardarlo aquí.
            </p>
          </div>
          <a routerLink="/catalog" class="neo-btn-outline !text-[13px] !py-2.5 !px-5 mt-1">
            <ng-icon name="lucideLayoutGrid" size="14" />
            Explorar catálogo
          </a>
        </div>

      <!-- Items -->
      } @else {
        <!-- Aviso de ofertas -->
        @if (onSaleCount() > 0) {
          <div class="mb-4 flex items-center gap-3 px-4 py-3 rounded-[12px]
                      bg-success/10 border border-success/30">
            <ng-icon name="lucideBadgePercent" size="18" class="text-success shrink-0" />
            <p class="text-[13px] text-success font-medium">
              {{ onSaleCount() === 1 ? '1 producto bajó de precio' : onSaleCount() + ' productos bajaron de precio' }}
              desde que los guardaste.
            </p>
          </div>
        }

        <div class="flex flex-col gap-3">
          @for (item of wishlist()!.items; track item.itemId) {
            <div class="neo-card-premium p-4 flex items-center gap-4 transition-all"
                 [class.border-success]="item.onSale"
                 [class.!border-success/50]="item.onSale">

              <!-- Imagen -->
              <a [routerLink]="['/product', item.productSlug]" class="shrink-0">
                <div class="w-16 h-16 rounded-xl overflow-hidden bg-bg-elevated border border-border">
                  @if (item.productImageUrl) {
                    <img [src]="item.productImageUrl" [alt]="item.productName"
                      class="w-full h-full object-cover" loading="lazy" />
                  } @else {
                    <div class="w-full h-full flex items-center justify-center">
                      <ng-icon name="lucidePackage" size="18" class="text-text-muted" />
                    </div>
                  }
                </div>
              </a>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <a [routerLink]="['/product', item.productSlug]"
                  class="text-[13px] font-semibold text-text-primary hover:text-accent transition-colors line-clamp-1">
                  {{ item.productName }}
                </a>

                <div class="flex items-center gap-2 mt-1 flex-wrap">
                  <span class="text-sm font-bold tabular-nums"
                        [class.text-success]="item.onSale"
                        [class.text-text-primary]="!item.onSale">
                    {{ item.finalPrice | copCurrency }}
                  </span>

                  @if (item.onSale && item.priceAtAdding) {
                    <span class="text-[12px] text-text-muted line-through tabular-nums">
                      {{ item.priceAtAdding | copCurrency }}
                    </span>
                    <span class="text-[10px] font-bold uppercase tracking-wide font-mono
                                 text-success bg-success/12 border border-success/30 px-1.5 py-0.5 rounded-full">
                      ¡Bajó de precio!
                    </span>
                  }

                  @if (!item.inStock) {
                    <span class="text-[11px] font-semibold uppercase tracking-wide text-error">Sin stock</span>
                  }
                </div>
              </div>

              <!-- Acciones -->
              <div class="flex items-center gap-1 shrink-0">
                @if (item.inStock) {
                  <button (click)="addToCart(item)"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium
                           bg-accent text-white hover:bg-accent-hover transition-colors">
                    <ng-icon name="lucideShoppingCart" size="13" />
                    Comprar
                  </button>
                }
                <button (click)="remove(item)"
                  class="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors ml-1">
                  <ng-icon name="lucideX" size="15" />
                </button>
              </div>

            </div>
          }
        </div>
      }
    </div>
  `,
})
export class WishlistsListComponent implements OnInit {
  private wishlistService = inject(WishlistService);
  private wishlistState   = inject(WishlistStateService);
  private store           = inject(Store);

  wishlist    = signal<Wishlist | null>(null);
  loading     = signal(true);

  onSaleCount = () => this.wishlist()?.items.filter(i => i.onSale).length ?? 0;

  ngOnInit(): void {
    this.wishlistService.getMyWishlist().subscribe({
      next:  (res) => { this.wishlist.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  addToCart(item: WishlistItem): void {
    this.store.dispatch(CartActions.addItem({ request: { productId: item.productId, quantity: 1 } }));
  }

  remove(item: WishlistItem): void {
    this.wishlistState.toggle(item.productId);
    this.wishlist.update(wl => wl
      ? { ...wl, items: wl.items.filter(i => i.itemId !== item.itemId) }
      : wl
    );
  }
}
