import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { SellerService } from '../../../core/seller/seller.service';
import { PublicSellerResponse } from '../../../shared/models/seller.models';

@Component({
  selector: 'app-stores-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NgIcon],
  template: `
    <div class="relative pt-10 pb-20">

      <!-- Ambient backdrop -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div class="neo-grid-bg absolute inset-0 opacity-30"></div>
        <span class="neo-orb red"    style="width:500px;height:500px;top:-10%;left:-5%;opacity:0.20;"></span>
        <span class="neo-orb violet" style="width:350px;height:350px;top:40%;right:-5%;opacity:0.15;animation-delay:2s;"></span>
      </div>

      <div class="relative max-w-7xl mx-auto px-6">

        <!-- Title -->
        <div class="mb-8">
          <p class="neo-stat-label">Marketplace</p>
          <h1 class="font-display text-[40px] font-bold tracking-[-0.02em] mt-1">
            Tiendas
          </h1>
          <p class="text-[13px] text-text-muted mt-1">
            @if (!loading() && totalElements() > 0) {
              {{ totalElements() }} tienda{{ totalElements() === 1 ? '' : 's' }} activa{{ totalElements() === 1 ? '' : 's' }}
              @if (searchQuery) { · "{{ searchQuery }}" }
            }
          </p>
        </div>

        <!-- Search bar -->
        <div class="relative max-w-lg mb-8">
          <ng-icon name="lucideSearch" size="16"
            class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="search"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearch($event)"
            placeholder="Buscar tienda por nombre…"
            class="w-full h-11 pl-10 pr-4 bg-bg-elevated border border-border-strong rounded-[10px]
                   text-sm text-text-primary placeholder:text-text-muted outline-none
                   focus:border-accent focus:ring-[3px] focus:ring-accent/8 transition-all duration-200" />
          @if (searchQuery) {
            <button (click)="clearSearch()"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
              <ng-icon name="lucideX" size="14" />
            </button>
          }
        </div>

        <!-- Loading -->
        @if (loading()) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            @for (_ of [1,2,3,4,5,6,7,8]; track $index) {
              <div class="h-36 rounded-xl bg-bg-surface border border-border animate-pulse"></div>
            }
          </div>
        }

        <!-- Empty state -->
        @else if (stores().length === 0) {
          <div class="neo-card-premium flex flex-col items-center gap-4 py-20 text-center">
            <div class="w-16 h-16 rounded-full bg-bg-elevated border border-border
                        flex items-center justify-center">
              <ng-icon name="lucideStore" size="28" class="text-text-muted opacity-50" />
            </div>
            <div>
              <p class="text-[15px] font-medium text-text-secondary">
                @if (searchQuery) { No se encontraron tiendas para "{{ searchQuery }}" }
                @else { Aún no hay tiendas activas }
              </p>
              @if (searchQuery) {
                <p class="text-[13px] text-text-muted mt-1">Prueba con otro nombre</p>
              }
            </div>
            @if (searchQuery) {
              <button (click)="clearSearch()" class="neo-btn-outline !py-2 !px-4 !text-[13px]">
                Ver todas las tiendas
              </button>
            }
          </div>
        }

        <!-- Store grid -->
        @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            @for (store of stores(); track store.id) {
              <a [routerLink]="['/store', store.storeSlug]"
                 class="group neo-card-premium p-0 overflow-hidden
                        hover:border-accent/50 hover:-translate-y-0.5
                        transition-all duration-200 cursor-pointer">

                <!-- Mini banner -->
                <div class="relative h-16 bg-gradient-to-br from-[#120508] via-[#1c0a10] to-[#0d0d13] overflow-hidden">
                  @if (store.storeBannerUrl) {
                    <img [src]="store.storeBannerUrl" alt=""
                         class="w-full h-full object-cover opacity-70" />
                  } @else {
                    <!-- Decorative grid -->
                    <svg class="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="sg" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" stroke-width="0.5"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#sg)" />
                    </svg>
                    <div class="absolute inset-0 opacity-30"
                         style="background: radial-gradient(circle at 30% 50%, var(--color-accent), transparent 60%)"></div>
                  }
                  <!-- Bottom fade -->
                  <div class="absolute inset-x-0 bottom-0 h-8"
                       style="background: linear-gradient(to bottom, transparent, var(--color-bg-surface))"></div>
                </div>

                <!-- Store info -->
                <div class="px-4 pb-4 -mt-5 relative">
                  <!-- Logo -->
                  <div class="w-10 h-10 rounded-xl border-2 border-bg-surface bg-bg-elevated
                              overflow-hidden mb-2 shadow-sm flex items-center justify-center">
                    @if (store.storeLogoUrl) {
                      <img [src]="store.storeLogoUrl" [alt]="store.storeName"
                           class="w-full h-full object-cover" />
                    } @else {
                      <ng-icon name="lucideStore" size="16" class="text-text-muted" />
                    }
                  </div>

                  <p class="text-[13px] font-semibold text-text-primary truncate
                             group-hover:text-accent transition-colors">
                    {{ store.storeName }}
                  </p>

                  @if (store.averageRating) {
                    <div class="flex items-center gap-1 mt-1">
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

                  <div class="flex items-center justify-between mt-2">
                    <p class="text-[11px] text-text-muted flex items-center gap-1 truncate">
                      <ng-icon name="lucideMapPin" size="10" />
                      {{ store.city }}
                    </p>
                    <span class="text-[11px] text-accent font-medium shrink-0">
                      Ver tienda →
                    </span>
                  </div>
                </div>
              </a>
            }
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="flex items-center justify-center gap-3 mt-10">
              <button (click)="prevPage()" [disabled]="page() === 0"
                class="flex items-center gap-1.5 px-4 py-2 rounded-[10px] border border-border
                       text-sm text-text-secondary hover:bg-bg-subtle
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ng-icon name="lucideChevronLeft" size="14" />
                Anterior
              </button>
              <span class="text-sm text-text-muted px-2">
                {{ page() + 1 }} / {{ totalPages() }}
              </span>
              <button (click)="nextPage()" [disabled]="page() + 1 >= totalPages()"
                class="flex items-center gap-1.5 px-4 py-2 rounded-[10px] border border-border
                       text-sm text-text-secondary hover:bg-bg-subtle
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Siguiente
                <ng-icon name="lucideChevronRight" size="14" />
              </button>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class StoresPageComponent implements OnInit {
  private sellerService = inject(SellerService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private search$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  stores        = signal<PublicSellerResponse[]>([]);
  loading       = signal(true);
  page          = signal(0);
  totalPages    = signal(0);
  totalElements = signal(0);
  searchQuery   = '';

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap.get('q') ?? '';
    this.searchQuery = q;
    this.load();

    this.search$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(() => { this.page.set(0); this.load(); });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  onSearch(q: string): void {
    this.router.navigate([], { queryParams: q ? { q } : {}, replaceUrl: true });
    this.search$.next(q);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.onSearch('');
  }

  private load(): void {
    this.loading.set(true);
    this.sellerService.searchStores(this.searchQuery, 20, this.page()).subscribe({
      next: (res) => {
        this.stores.set(res.data.content);
        this.totalPages.set(res.data.totalPages);
        this.totalElements.set(res.data.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  prevPage(): void {
    if (this.page() > 0) { this.page.update(p => p - 1); this.load(); }
  }

  nextPage(): void {
    if (this.page() + 1 < this.totalPages()) { this.page.update(p => p + 1); this.load(); }
  }
}
