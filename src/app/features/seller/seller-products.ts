import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';
import { SellerProductService } from '../../core/seller/seller-product.service';
import { ProductSummaryResponse } from '../../shared/models/product.models';
import { ProductStatus } from '../../shared/models/enums';

const STATUS_MAP: Record<ProductStatus, { color: string; bg: string; border: string; label: string }> = {
  DRAFT:   { color: 'var(--color-text-muted)',  bg: 'var(--color-bg-elevated)', border: 'var(--color-border)',         label: 'Borrador'  },
  ACTIVE:  { color: 'var(--color-success)',      bg: 'rgba(0,200,150,0.12)',     border: 'rgba(0,200,150,0.25)',        label: 'Activo'    },
  PAUSED:  { color: '#FF8C00',                  bg: 'rgba(255,140,0,0.12)',     border: 'rgba(255,140,0,0.25)',        label: 'Pausado'   },
  DELETED: { color: 'var(--color-error)',        bg: 'rgba(255,0,60,0.12)',      border: 'rgba(255,0,60,0.25)',         label: 'Eliminado' },
};

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon, CopCurrencyPipe],
  template: `
    <div class="relative">
      <!-- Ambient backdrop -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden -z-[1]">
        <div class="neo-grid-bg absolute inset-0 opacity-20"></div>
      </div>

      <div class="relative max-w-[1100px] mx-auto">

        <!-- Header -->
        <div class="neo-reveal flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p class="neo-stat-label">Gestión</p>
            <h1 class="font-display text-[28px] font-bold tracking-[-0.02em] text-text-primary mt-0.5">
              Mis productos
            </h1>
          </div>
          <a routerLink="/seller/products/new"
             class="neo-btn-primary !text-[13px] !py-2 !px-4">
            <ng-icon name="lucidePlus" size="14" />
            Nuevo producto
          </a>
        </div>

        <!-- Loading skeletons -->
        @if (loading()) {
          <div class="neo-card-premium overflow-hidden neo-reveal">
            <div class="p-4 space-y-2">
              @for (_ of [1,2,3,4,5]; track $index) {
                <div class="h-14 rounded-[10px] bg-bg-elevated animate-pulse"></div>
              }
            </div>
          </div>

        <!-- Empty state -->
        } @else if (products().length === 0) {
          <div class="neo-card-premium p-12 flex flex-col items-center gap-4 text-center neo-reveal">
            <div class="w-16 h-16 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center">
              <ng-icon name="lucidePackage" size="28" class="text-text-muted" />
            </div>
            <div>
              <p class="text-base font-semibold text-text-primary">No tienes productos todavía</p>
              <p class="text-sm text-text-muted mt-1">Crea tu primer producto para empezar a vender.</p>
            </div>
            <a routerLink="/seller/products/new" class="neo-btn-primary !text-[13px] !py-2 !px-4 mt-1">
              <ng-icon name="lucidePlus" size="14" />
              Crear primer producto
            </a>
          </div>

        <!-- Products table -->
        } @else {
          <div class="neo-card-premium overflow-hidden neo-reveal">
            <!-- Table header -->
            <div class="bg-bg-elevated border-b border-border">
              <div class="grid grid-cols-[1fr_auto_auto_auto] items-center px-5 py-2.5 gap-4">
                <span class="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted font-mono">Producto</span>
                <span class="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted font-mono hidden sm:block w-28 text-right">Precio</span>
                <span class="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted font-mono w-24 text-center">Estado</span>
                <span class="w-8"></span>
              </div>
            </div>

            <!-- Rows -->
            <div class="divide-y divide-border">
              @for (p of products(); track p.id) {
                <div class="grid grid-cols-[1fr_auto_auto_auto] items-center px-5 py-3 gap-4
                             transition-colors hover:bg-bg-elevated/50">

                  <!-- Product info -->
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-[10px] overflow-hidden bg-bg-elevated border border-border shrink-0">
                      @if (p.primaryImageUrl) {
                        <img [src]="p.primaryImageUrl" [alt]="p.name"
                          class="w-full h-full object-cover" loading="lazy" />
                      } @else {
                        <div class="w-full h-full flex items-center justify-center">
                          <ng-icon name="lucideImage" size="14" class="text-text-muted" />
                        </div>
                      }
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-text-primary truncate">{{ p.name }}</p>
                      <p class="text-xs text-text-muted font-mono">{{ p.brand }}</p>
                    </div>
                  </div>

                  <!-- Price -->
                  <span class="hidden sm:block text-sm font-semibold text-text-primary w-28 text-right tabular-nums">
                    {{ p.finalPrice | copCurrency }}
                  </span>

                  <!-- Status pill -->
                  <div class="w-24 flex justify-center">
                    <span class="text-[11px] font-semibold px-[10px] py-[3px] rounded-full border whitespace-nowrap"
                      [style.color]="statusColor(p.status)"
                      [style.background]="statusBg(p.status)"
                      [style.border-color]="statusBorder(p.status)">
                      {{ statusLabel(p.status) }}
                    </span>
                  </div>

                  <!-- Edit action -->
                  <div class="w-8 flex justify-center">
                    <a [routerLink]="['/seller/products', p.id]"
                      class="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated
                             transition-colors inline-flex" aria-label="Editar">
                      <ng-icon name="lucideSettings" size="15" />
                    </a>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="flex items-center justify-center gap-3 mt-5">
              <button (click)="prevPage()" [disabled]="page() === 0"
                class="neo-btn-outline !text-[13px] !py-1.5 !px-3 disabled:opacity-40 disabled:cursor-not-allowed">
                <ng-icon name="lucideChevronLeft" size="14" />
                Anterior
              </button>
              <span class="text-sm text-text-muted font-mono">{{ page() + 1 }} / {{ totalPages() }}</span>
              <button (click)="nextPage()" [disabled]="page() + 1 >= totalPages()"
                class="neo-btn-outline !text-[13px] !py-1.5 !px-3 disabled:opacity-40 disabled:cursor-not-allowed">
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
export class SellerProductsComponent implements OnInit {
  private productService = inject(SellerProductService);

  products   = signal<ProductSummaryResponse[]>([]);
  loading    = signal(true);
  page       = signal(0);
  totalPages = signal(0);

  statusColor(s: ProductStatus):  string { return (STATUS_MAP[s] ?? STATUS_MAP.DRAFT).color;  }
  statusBg(s: ProductStatus):     string { return (STATUS_MAP[s] ?? STATUS_MAP.DRAFT).bg;     }
  statusBorder(s: ProductStatus): string { return (STATUS_MAP[s] ?? STATUS_MAP.DRAFT).border; }
  statusLabel(s: ProductStatus):  string { return (STATUS_MAP[s] ?? STATUS_MAP.DRAFT).label;  }

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.productService.getMyProducts(this.page(), 20).subscribe({
      next: (res) => {
        this.products.set(res.data.content);
        this.totalPages.set(res.data.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  prevPage(): void { if (this.page() > 0) { this.page.update(p => p - 1); this.load(); } }
  nextPage(): void { if (this.page() + 1 < this.totalPages()) { this.page.update(p => p + 1); this.load(); } }
}
