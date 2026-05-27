import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { SellerService } from '../../../core/seller/seller.service';
import { PublicSellerResponse } from '../../../shared/models/seller.models';

@Component({
  selector: 'app-followed-stores',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon],
  template: `
    <div class="neo-card-premium p-6">

      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <div class="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20
                    flex items-center justify-center shrink-0">
          <ng-icon name="lucideHeart" size="16" class="text-accent" />
        </div>
        <div>
          <h2 class="text-[15px] font-semibold text-text-primary">Tiendas seguidas</h2>
          <p class="text-[12px] text-text-muted mt-0.5">
            Las tiendas que sigues aparecerán aquí
          </p>
        </div>
        @if (!loading() && stores().length > 0) {
          <span class="ml-auto px-2.5 py-1 rounded-full bg-bg-elevated border border-border
                       text-[12px] font-mono text-text-muted">
            {{ stores().length }}
          </span>
        }
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="h-20 rounded-xl bg-bg-elevated border border-border animate-pulse"></div>
          }
        </div>
      }

      <!-- Empty state -->
      @else if (stores().length === 0) {
        <div class="flex flex-col items-center gap-4 py-14 text-center">
          <div class="w-16 h-16 rounded-full bg-bg-elevated border border-border
                      flex items-center justify-center">
            <ng-icon name="lucideStore" size="28" class="text-text-muted opacity-50" />
          </div>
          <div>
            <p class="text-[14px] font-medium text-text-secondary">Aún no sigues ninguna tienda</p>
            <p class="text-[13px] text-text-muted mt-1">
              Visita una tienda y haz clic en "Seguir" para que aparezca aquí.
            </p>
          </div>
          <a routerLink="/stores"
             class="neo-btn-outline !py-2 !px-5 !text-[13px] mt-1">
            <ng-icon name="lucideStore" size="13" />
            Explorar tiendas
          </a>
        </div>
      }

      <!-- Store grid -->
      @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          @for (store of stores(); track store.id) {
            <a [routerLink]="['/store', store.storeSlug]"
               class="group flex items-center gap-3 p-3.5 rounded-xl border border-border
                      bg-bg-elevated hover:border-accent/50 hover:bg-bg-surface
                      transition-all duration-200">

              <!-- Logo -->
              <div class="w-11 h-11 rounded-xl border border-border bg-bg-surface
                          overflow-hidden shrink-0 flex items-center justify-center">
                @if (store.storeLogoUrl) {
                  <img [src]="store.storeLogoUrl" [alt]="store.storeName"
                       class="w-full h-full object-cover" />
                } @else {
                  <ng-icon name="lucideStore" size="18" class="text-text-muted" />
                }
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="text-[13px] font-semibold text-text-primary truncate
                           group-hover:text-accent transition-colors">
                  {{ store.storeName }}
                </p>
                @if (store.averageRating) {
                  <div class="flex items-center gap-1 mt-0.5">
                    <span class="inline-flex gap-px">
                      @for (i of [1,2,3,4,5]; track i) {
                        <ng-icon name="lucideStar" size="10"
                          [class.text-star]="i <= store.averageRating!"
                          [class.text-border-strong]="i > store.averageRating!" />
                      }
                    </span>
                    <span class="text-[11px] text-text-muted">
                      {{ store.averageRating | number:'1.1-1' }}
                    </span>
                  </div>
                }
                <p class="text-[11px] text-text-muted mt-0.5 flex items-center gap-1 truncate">
                  <ng-icon name="lucideMapPin" size="10" />
                  {{ store.city }}, {{ store.department }}
                </p>
              </div>

              <!-- Arrow -->
              <ng-icon name="lucideChevronRight" size="14"
                class="text-text-muted shrink-0
                       group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class FollowedStoresComponent implements OnInit {
  private sellerService = inject(SellerService);

  stores  = signal<PublicSellerResponse[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.sellerService.getFollowedStores().subscribe({
      next: (res) => { this.stores.set(res.data); this.loading.set(false); },
      error: ()    => this.loading.set(false),
    });
  }
}
