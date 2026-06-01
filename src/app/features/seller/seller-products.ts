import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';
import { SellerProductService } from '../../core/seller/seller-product.service';
import { ProductSummaryResponse } from '../../shared/models/product.models';
import { ProductStatus } from '../../shared/models/enums';

const STATUS_MAP: Record<ProductStatus, { color: string; bg: string; border: string; label: string }> = {
  DRAFT:   { color: 'var(--color-text-muted)',  bg: 'var(--color-bg-elevated)', border: 'var(--color-border)',  label: 'Borrador' },
  ACTIVE:  { color: 'var(--color-success)',      bg: 'rgba(0,200,150,0.12)',     border: 'rgba(0,200,150,0.25)', label: 'Activo'   },
  PAUSED:  { color: '#FF8C00',                  bg: 'rgba(255,140,0,0.12)',     border: 'rgba(255,140,0,0.25)', label: 'Pausado'  },
  DELETED: { color: 'var(--color-error)',        bg: 'rgba(255,0,60,0.12)',      border: 'rgba(255,0,60,0.25)',  label: 'Eliminado'},
};

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NgIcon, CopCurrencyPipe],
  template: `

    <!-- ── Modal confirmar eliminación ───────────────────────── -->
    @if (confirmDelete()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div class="neo-card-premium p-6 w-full max-w-[400px]">
          <div class="w-10 h-10 rounded-full bg-error/10 border border-error/30
                      flex items-center justify-center mb-4">
            <ng-icon name="lucideTrash2" size="18" class="text-error" />
          </div>
          <p class="text-[15px] font-semibold text-text-primary">¿Eliminar este producto?</p>
          <p class="text-[13px] text-text-muted mt-1 mb-5">
            "<span class="text-text-secondary">{{ confirmDelete()!.name }}</span>" dejará de estar disponible.
            Esta acción no se puede deshacer.
          </p>
          <div class="flex gap-2">
            <button (click)="confirmDelete.set(null)"
              class="flex-1 py-2.5 rounded-[10px] border border-border text-[13px]
                     text-text-secondary hover:bg-bg-elevated transition-colors">
              Cancelar
            </button>
            <button (click)="doDelete()"
              [disabled]="processing() === confirmDelete()!.id"
              class="flex-1 py-2.5 rounded-[10px] bg-error text-white text-[13px] font-medium
                     hover:bg-error/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              @if (processing() === confirmDelete()!.id) {
                <ng-icon name="lucideRefreshCw" size="13" class="animate-spin" />
              }
              Eliminar
            </button>
          </div>
        </div>
      </div>
    }

    <div class="relative">
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
          <a routerLink="/seller/products/new" class="neo-btn-primary !text-[13px] !py-2 !px-4">
            <ng-icon name="lucidePlus" size="14" /> Nuevo producto
          </a>
        </div>

        <!-- Search bar -->
        <div class="relative mb-5">
          <ng-icon name="lucideSearch" size="14"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input [(ngModel)]="searchQ" (ngModelChange)="onSearch($event)"
            placeholder="Buscar producto por nombre…"
            class="w-full h-[38px] pl-9 pr-3 rounded-[10px] bg-bg-elevated border border-border
                   text-[13px] text-text-primary placeholder:text-text-muted outline-none
                   focus:border-accent/50 transition-colors" />
          @if (searchQ) {
            <button (click)="clearSearch()"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
              <ng-icon name="lucideX" size="13" />
            </button>
          }
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
              <ng-icon name="lucidePlus" size="14" /> Crear primer producto
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
                      @if (p.status === 'DRAFT') {
                        <a [routerLink]="['/seller/products', p.id]"
                          class="text-[11px] font-medium text-accent hover:underline inline-flex items-center gap-0.5 mt-0.5">
                          <ng-icon name="lucidePencil" size="10" />
                          Continuar editando
                        </a>
                      } @else {
                        <p class="text-xs text-text-muted font-mono">{{ p.brand }}</p>
                      }
                    </div>
                  </div>

                  <!-- Price -->
                  <span class="hidden sm:block text-sm font-semibold text-text-primary w-28 text-right tabular-nums">
                    {{ p.finalPrice | copCurrency }}
                  </span>

                  <!-- Toggle activar / pausar -->
                  <div class="w-24 flex flex-col items-center gap-1">
                    @if (p.status !== 'DELETED') {
                      <button
                        (click)="toggleStatus(p); $event.stopPropagation()"
                        [disabled]="processing() === p.id"
                        class="relative inline-flex h-[22px] w-10 shrink-0 rounded-full border-2 border-transparent
                               transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                        [class.bg-success]="p.status === 'ACTIVE'"
                        [class.bg-bg-elevated]="p.status !== 'ACTIVE'"
                        [style.box-shadow]="p.status === 'ACTIVE' ? '0 0 10px rgba(0,200,120,0.4)' : ''"
                        [attr.aria-checked]="p.status === 'ACTIVE'"
                        role="switch">
                        <span class="pointer-events-none inline-block h-[14px] w-[14px] rounded-full
                                     bg-white shadow-sm transform transition-transform duration-200 mt-[1px]"
                              [class.translate-x-[20px]]="p.status === 'ACTIVE'"
                              [class.translate-x-[1px]]="p.status !== 'ACTIVE'">
                        </span>
                      </button>
                      <span class="text-[10px] font-medium whitespace-nowrap"
                            [style.color]="statusColor(p.status)">
                        {{ statusLabel(p.status) }}
                      </span>
                    } @else {
                      <span class="text-[11px] font-semibold px-[10px] py-[3px] rounded-full border whitespace-nowrap"
                        [style.color]="statusColor(p.status)"
                        [style.background]="statusBg(p.status)"
                        [style.border-color]="statusBorder(p.status)">
                        {{ statusLabel(p.status) }}
                      </span>
                    }
                  </div>

                  <!-- Actions dropdown -->
                  <div class="relative" data-menu>
                    <button (click)="toggleMenu(p.id)"
                      [disabled]="processing() === p.id"
                      class="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted
                             hover:text-text-primary hover:bg-bg-elevated transition-colors
                             disabled:opacity-40 disabled:cursor-not-allowed"
                      [ngClass]="openMenu() === p.id ? 'bg-bg-elevated text-text-primary' : ''">
                      @if (processing() === p.id) {
                        <ng-icon name="lucideRefreshCw" size="15" class="animate-spin" />
                      } @else {
                        <ng-icon name="lucideMoreVertical" size="15" />
                      }
                    </button>

                    @if (openMenu() === p.id) {
                      <div class="absolute right-0 top-full mt-1 w-44 z-20
                                  bg-bg-surface border border-border rounded-[12px]
                                  shadow-[var(--shadow-card-lift)] overflow-hidden py-1">

                        <!-- Editar -->
                        <a [routerLink]="['/seller/products', p.id]"
                           (click)="openMenu.set(null)"
                           class="flex items-center gap-2.5 px-4 py-2.5 text-[13px]
                                  text-text-primary hover:bg-bg-elevated transition-colors">
                          <ng-icon name="lucidePencil" size="14" class="text-text-muted shrink-0" />
                          Editar
                        </a>

                        <!-- Stock -->
                        <a [routerLink]="['/seller/products', p.id, 'inventory']"
                           (click)="openMenu.set(null)"
                           class="flex items-center gap-2.5 px-4 py-2.5 text-[13px]
                                  text-text-primary hover:bg-bg-elevated transition-colors">
                          <ng-icon name="lucidePackage" size="14" class="text-text-muted shrink-0" />
                          Gestionar stock
                        </a>

                        <!-- Preview -->
                        <a [routerLink]="['/seller/products', p.id, 'preview']"
                           (click)="openMenu.set(null)"
                           class="flex items-center gap-2.5 px-4 py-2.5 text-[13px]
                                  text-text-primary hover:bg-bg-elevated transition-colors">
                          <ng-icon name="lucideEye" size="14" class="text-text-muted shrink-0" />
                          Vista previa
                        </a>

                        <!-- Descuentos -->
                        <a [routerLink]="['/seller/products', p.id, 'offers']"
                           (click)="openMenu.set(null)"
                           class="flex items-center gap-2.5 px-4 py-2.5 text-[13px]
                                  text-text-primary hover:bg-bg-elevated transition-colors">
                          <ng-icon name="lucideTag" size="14" class="text-text-muted shrink-0" />
                          Descuentos
                        </a>

                        @if (p.status !== 'DELETED') {
                          <div class="my-1 border-t border-border mx-2"></div>

                          <!-- Publicar (DRAFT o PAUSED) -->
                          @if (p.status === 'DRAFT' || p.status === 'PAUSED') {
                            <button (click)="publish(p)"
                              class="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px]
                                     text-success hover:bg-success/8 transition-colors text-left">
                              <ng-icon name="lucidePlay" size="14" class="shrink-0" />
                              Publicar
                            </button>
                          }

                          <!-- Pausar (solo ACTIVE) -->
                          @if (p.status === 'ACTIVE') {
                            <button (click)="pause(p)"
                              class="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px]
                                     hover:bg-bg-elevated transition-colors text-left"
                              style="color:#FF8C00">
                              <ng-icon name="lucidePause" size="14" class="shrink-0" />
                              Pausar publicación
                            </button>
                          }

                          <div class="my-1 border-t border-border mx-2"></div>

                          <!-- Eliminar -->
                          <button (click)="askDelete(p)"
                            class="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px]
                                   text-error hover:bg-error/8 transition-colors text-left">
                            <ng-icon name="lucideTrash2" size="14" class="shrink-0" />
                            Eliminar
                          </button>
                        }
                      </div>
                    }
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
                <ng-icon name="lucideChevronLeft" size="14" /> Anterior
              </button>
              <span class="text-sm text-text-muted font-mono">{{ page() + 1 }} / {{ totalPages() }}</span>
              <button (click)="nextPage()" [disabled]="page() + 1 >= totalPages()"
                class="neo-btn-outline !text-[13px] !py-1.5 !px-3 disabled:opacity-40 disabled:cursor-not-allowed">
                Siguiente <ng-icon name="lucideChevronRight" size="14" />
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

  products      = signal<ProductSummaryResponse[]>([]);
  loading       = signal(true);
  page          = signal(0);
  totalPages    = signal(0);
  processing    = signal<string | null>(null);
  openMenu      = signal<string | null>(null);
  confirmDelete = signal<ProductSummaryResponse | null>(null);

  statusColor(s: ProductStatus):  string { return (STATUS_MAP[s] ?? STATUS_MAP.DRAFT).color;  }
  statusBg(s: ProductStatus):     string { return (STATUS_MAP[s] ?? STATUS_MAP.DRAFT).bg;     }
  statusBorder(s: ProductStatus): string { return (STATUS_MAP[s] ?? STATUS_MAP.DRAFT).border; }
  statusLabel(s: ProductStatus):  string { return (STATUS_MAP[s] ?? STATUS_MAP.DRAFT).label;  }

  toggleMenu(id: string): void {
    this.openMenu.set(this.openMenu() === id ? null : id);
  }

  publish(p: ProductSummaryResponse): void {
    this.openMenu.set(null);
    this.processing.set(p.id);
    this.productService.publish(p.id).subscribe({
      next: res => {
        this.products.update(list => list.map(x => x.id === p.id ? { ...x, status: res.data.status } : x));
        this.processing.set(null);
      },
      error: () => this.processing.set(null),
    });
  }

  pause(p: ProductSummaryResponse): void {
    this.openMenu.set(null);
    this.processing.set(p.id);
    this.productService.pause(p.id).subscribe({
      next: res => {
        this.products.update(list => list.map(x => x.id === p.id ? { ...x, status: res.data.status } : x));
        this.processing.set(null);
      },
      error: () => this.processing.set(null),
    });
  }

  toggleStatus(p: ProductSummaryResponse): void {
    if (p.status === 'ACTIVE') {
      this.pause(p);
    } else if (p.status === 'PAUSED' || p.status === 'DRAFT') {
      this.publish(p);
    }
  }

  askDelete(p: ProductSummaryResponse): void {
    this.openMenu.set(null);
    this.confirmDelete.set(p);
  }

  doDelete(): void {
    const p = this.confirmDelete();
    if (!p) return;
    this.processing.set(p.id);
    this.productService.delete(p.id).subscribe({
      next: () => {
        this.products.update(list => list.filter(x => x.id !== p.id));
        this.confirmDelete.set(null);
        this.processing.set(null);
      },
      error: () => { this.confirmDelete.set(null); this.processing.set(null); },
    });
  }

  searchQ = '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  onSearch(q: string): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(0); this.load(); }, 300);
  }

  clearSearch(): void {
    this.searchQ = '';
    this.page.set(0);
    this.load();
  }

  ngOnInit(): void {
    this.load();
    document.addEventListener('click', this.closeMenu);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.closeMenu);
  }

  private closeMenu = (e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest('[data-menu]')) {
      this.openMenu.set(null);
    }
  };

  private load(): void {
    this.loading.set(true);
    this.productService.getMyProducts(this.page(), 20, this.searchQ || undefined).subscribe({
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
