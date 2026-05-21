import { Component, inject, OnInit, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { WishlistService } from '../../core/account/wishlist.service';
import { Wishlist } from '../../shared/models/wishlist.models';

@Component({
  selector: 'app-wishlist-public',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon],
  template: `
    @if (loading()) {
      <div class="max-w-2xl animate-pulse space-y-4">
        <div class="h-12 rounded-xl bg-bg-surface border border-border"></div>
        @for (_ of [1,2,3]; track $index) {
          <div class="h-20 rounded-xl bg-bg-surface border border-border"></div>
        }
      </div>
    } @else if (notFound()) {
      <div class="flex flex-col items-center gap-4 py-24 text-text-muted">
        <ng-icon name="lucideHeartCrack" size="48" />
        <p class="text-lg font-medium text-text-secondary">Wishlist no encontrada</p>
        <p class="text-sm">El enlace puede haber expirado o la wishlist fue marcada como privada.</p>
        <a routerLink="/" class="text-sm text-accent hover:underline">Ir al inicio</a>
      </div>
    } @else if (wishlist()) {
      <div class="max-w-2xl">
        <div class="mb-6">
          <div class="flex items-center gap-2 mb-1">
            <ng-icon name="lucideHeart" size="18" class="text-accent" />
            <h1 class="text-xl font-bold text-text-primary">{{ wishlist()!.name }}</h1>
            <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">
              Pública
            </span>
          </div>
          <p class="text-sm text-text-muted">{{ wishlist()!.items.length }} productos</p>
        </div>

        @if (wishlist()!.items.length === 0) {
          <div class="flex flex-col items-center gap-3 py-16 text-text-muted">
            <ng-icon name="lucideHeart" size="40" />
            <p>Esta wishlist está vacía.</p>
          </div>
        } @else {
          <div class="flex flex-col gap-3">
            @for (item of wishlist()!.items; track item.itemId) {
              <a [routerLink]="['/product', item.productSlug]"
                class="flex items-center gap-4 bg-bg-surface border border-border rounded-xl p-4
                       hover:border-accent/50 transition-colors group">
                <div class="w-14 h-14 rounded-lg bg-bg-elevated shrink-0 overflow-hidden">
                  @if (item.productImageUrl) {
                    <img [src]="item.productImageUrl" [alt]="item.productName"
                      class="w-full h-full object-cover" />
                  } @else {
                    <div class="w-full h-full flex items-center justify-center">
                      <ng-icon name="lucideImage" size="20" class="text-text-muted" />
                    </div>
                  }
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                    {{ item.productName }}
                  </p>
                  <p class="text-sm font-bold text-accent mt-0.5">
                    {{ item.finalPrice | currency:'COP':'symbol-narrow':'1.0-0':'es-CO' }}
                  </p>
                </div>
                @if (!item.inStock) {
                  <span class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-error/15 text-error shrink-0">
                    Sin stock
                  </span>
                }
                <ng-icon name="lucideChevronRight" size="16" class="text-text-muted shrink-0" />
              </a>
            }
          </div>
        }
      </div>
    }
  `,
})
export class WishlistPublicComponent implements OnInit {
  readonly id = input.required<string>();

  private wishlistService = inject(WishlistService);

  wishlist = signal<Wishlist | null>(null);
  loading = signal(true);
  notFound = signal(false);

  ngOnInit(): void {
    this.wishlistService.getPublic(this.id()).subscribe({
      next: (res) => { this.wishlist.set(res.data); this.loading.set(false); },
      error: (err) => {
        this.loading.set(false);
        this.notFound.set(true);
      },
    });
  }
}
