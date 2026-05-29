import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';
import { SellerOrderService, SellerOrderSummary, SellerOrderGroup } from '../../core/seller/seller-order.service';
import { OrderGroupStatus } from '../../shared/models/enums';

type StatusMeta = { label: string; color: string; bg: string; border: string; icon: string };

const STATUS_META: Record<OrderGroupStatus, StatusMeta> = {
  PENDING:   { label: 'Pendiente',  color: 'var(--color-warning)',   bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.30)',  icon: 'lucideClipboardList' },
  CONFIRMED: { label: 'Confirmado', color: 'var(--color-neon-cyan)', bg: 'rgba(0,212,255,0.10)',   border: 'rgba(0,212,255,0.25)',   icon: 'lucideCheck'         },
  PREPARING: { label: 'Preparando', color: 'var(--color-neon-cyan)', bg: 'rgba(0,212,255,0.10)',   border: 'rgba(0,212,255,0.25)',   icon: 'lucidePackage'       },
  SHIPPED:   { label: 'Enviado',    color: '#818cf8',                bg: 'rgba(129,140,248,0.10)', border: 'rgba(129,140,248,0.28)', icon: 'lucideTruck'         },
  DELIVERED: { label: 'Entregado',  color: 'var(--color-success)',   bg: 'rgba(0,200,120,0.10)',   border: 'rgba(0,200,120,0.30)',   icon: 'lucideCircleCheck'   },
  CANCELLED: { label: 'Cancelado',  color: 'var(--color-error)',     bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.30)',   icon: 'lucideX'             },
};

const NEXT_STATUS: Partial<Record<OrderGroupStatus, OrderGroupStatus>> = {
  PENDING: 'CONFIRMED', CONFIRMED: 'PREPARING', PREPARING: 'SHIPPED', SHIPPED: 'DELIVERED',
};
const NEXT_LABEL: Partial<Record<OrderGroupStatus, string>> = {
  PENDING: 'Confirmar orden', CONFIRMED: 'Marcar en preparación', PREPARING: 'Marcar como enviado', SHIPPED: 'Marcar entregado',
};

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon, CopCurrencyPipe],
  template: `
    <div class="relative">
      <!-- Ambient backdrop -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden -z-[1]">
        <div class="neo-grid-bg absolute inset-0 opacity-20"></div>
        <span class="neo-orb red"  style="width:420px;height:420px;top:-12%;right:-6%;opacity:0.09;"></span>
        <span class="neo-orb cyan" style="width:320px;height:320px;bottom:0;left:-4%;opacity:0.07;animation-delay:2s;"></span>
      </div>

      <div class="relative max-w-[900px] mx-auto">

        <!-- Header -->
        <div class="neo-reveal mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="neo-stat-label">Seller</p>
            <h1 class="font-display text-[30px] font-bold tracking-[-0.02em] text-text-primary mt-1">
              Órdenes recibidas
            </h1>
          </div>
          @if (!loading() && orders().length > 0) {
            <div class="flex items-center gap-2 pb-0.5">
              <span class="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
                style="color:var(--color-warning);background:rgba(245,158,11,0.1);border-color:rgba(245,158,11,0.3);">
                {{ pendingCount() }} pendiente{{ pendingCount() !== 1 ? 's' : '' }}
              </span>
            </div>
          }
        </div>

        <!-- Search bar -->
        <div class="relative mb-5">
          <ng-icon name="lucideSearch" size="14"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input [(ngModel)]="searchQ"
            placeholder="Buscar por comprador…"
            class="w-full h-[38px] pl-9 pr-3 rounded-[10px] bg-bg-elevated border border-border
                   text-[13px] text-text-primary placeholder:text-text-muted outline-none
                   focus:border-accent/50 transition-colors" />
          @if (searchQ) {
            <button (click)="searchQ = ''"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
              <ng-icon name="lucideX" size="13" />
            </button>
          }
        </div>

        <!-- Loading -->
        @if (loading()) {
          <div class="flex flex-col gap-3">
            @for (_ of [1,2,3]; track $index) {
              <div class="h-24 rounded-2xl bg-bg-surface border border-border animate-pulse"></div>
            }
          </div>

        <!-- Empty -->
        } @else if (filteredOrders().length === 0) {
          <div class="neo-card-premium p-16 flex flex-col items-center gap-4 text-center neo-reveal">
            <div class="relative">
              <div class="absolute inset-0 rounded-2xl pointer-events-none"
                   style="background:radial-gradient(circle,var(--color-accent),transparent 70%);opacity:.2;filter:blur(24px);"></div>
              <div class="relative w-16 h-16 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center">
                <ng-icon name="lucideClipboardList" size="28" class="text-text-muted" />
              </div>
            </div>
            <div>
              <p class="text-[16px] font-semibold text-text-primary">Sin órdenes todavía</p>
              <p class="text-[13px] text-text-muted mt-1">Las órdenes de tus compradores aparecerán aquí.</p>
            </div>
          </div>

        <!-- Orders list -->
        } @else {
          <div class="neo-stagger flex flex-col gap-3">
            @for (order of filteredOrders(); track order.id) {
              <div class="neo-card-premium overflow-hidden">
                <!-- Card header -->
                <div class="relative px-5 py-4 flex items-start justify-between gap-3 flex-wrap overflow-hidden cursor-pointer
                            hover:bg-bg-elevated/30 transition-colors"
                     (click)="toggleExpand(order.id)">
                  <!-- Status glow -->
                  <div class="absolute -top-4 -right-4 w-[80px] h-[80px] rounded-full pointer-events-none"
                    [style.background]="'radial-gradient(circle,' + meta(order.status).color + ',transparent 70%)'"
                    style="opacity:.12;filter:blur(20px);"></div>

                  <div class="flex items-center gap-3 min-w-0">
                    <!-- Status icon circle -->
                    <div class="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
                      [style.background]="meta(order.status).bg"
                      [style.border-color]="meta(order.status).border">
                      <ng-icon [name]="meta(order.status).icon" size="16"
                        [style.color]="meta(order.status).color" />
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <p class="text-[13px] font-bold text-text-primary">{{ order.buyerName }}</p>
                        <span class="text-[10px] font-mono text-text-muted">#{{ order.id.slice(-8).toUpperCase() }}</span>
                      </div>
                      <p class="text-[12px] text-text-muted mt-0.5">
                        {{ order.totalItems }} {{ order.totalItems === 1 ? 'producto' : 'productos' }} ·
                        {{ order.createdAt | date:'d MMM yyyy, HH:mm':'':'es' }}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-3 shrink-0">
                    <span class="text-[11px] font-semibold px-2.5 py-1 rounded-full border"
                      [style.color]="meta(order.status).color"
                      [style.background]="meta(order.status).bg"
                      [style.border-color]="meta(order.status).border">
                      {{ meta(order.status).label }}
                    </span>
                    <p class="font-display text-[16px] font-bold text-text-primary tabular-nums">
                      {{ order.subtotal | copCurrency }}
                    </p>
                    <ng-icon name="lucideChevronRight" size="14" class="text-text-muted transition-transform duration-200"
                      [class.rotate-90]="expandedId() === order.id" />
                  </div>
                </div>

                <!-- Expanded detail -->
                @if (expandedId() === order.id) {
                  <div class="border-t border-border">
                    @if (loadingDetail()) {
                      <div class="p-5">
                        <div class="h-16 rounded-xl bg-bg-elevated animate-pulse"></div>
                      </div>
                    } @else if (orderDetail()) {
                      <!-- Items -->
                      <div class="px-5 pt-4 pb-2">
                        <p class="text-[11px] font-semibold uppercase tracking-[0.07em] text-text-muted font-mono mb-3">
                          Productos
                        </p>
                        <div class="flex flex-col divide-y divide-border/50">
                          @for (item of orderDetail()!.items; track item.productId) {
                            <div class="py-3 flex items-center justify-between gap-3">
                              <div class="flex items-center gap-2.5 min-w-0">
                                <div class="w-7 h-7 rounded-lg bg-bg-elevated border border-border flex items-center justify-center shrink-0">
                                  <ng-icon name="lucidePackage" size="12" class="text-text-muted" />
                                </div>
                                <div class="min-w-0">
                                  <p class="text-[13px] font-medium text-text-primary truncate">{{ item.productName }}</p>
                                  <p class="text-[11px] text-text-muted font-mono">{{ item.productSku }} · ×{{ item.quantity }}</p>
                                </div>
                              </div>
                              <div class="shrink-0 text-right">
                                <p class="text-[13px] font-semibold text-text-primary tabular-nums">{{ item.subtotal | copCurrency }}</p>
                                <p class="text-[11px] text-text-muted tabular-nums">{{ item.unitPrice | copCurrency }} c/u</p>
                              </div>
                            </div>
                          }
                        </div>
                      </div>

                      <!-- Tracking (when shipping) -->
                      @if (trackingInput() === order.id) {
                        <div class="px-5 py-3 border-t border-border bg-bg-elevated/30">
                          <p class="text-[11px] font-semibold uppercase tracking-[0.07em] text-text-muted font-mono mb-2">
                            Número de seguimiento (opcional)
                          </p>
                          <div class="flex gap-2">
                            <input type="text" [(ngModel)]="trackingNumberValue"
                              placeholder="Ej: 9400111899223397508670"
                              class="flex-1 rounded-[10px] bg-bg-elevated border border-border px-3.5 py-2.5 text-[13px]
                                     text-text-primary placeholder:text-text-muted outline-none
                                     focus:border-neon-cyan/50 focus:ring-[3px] focus:ring-neon-cyan/8 transition-all" />
                            <button (click)="confirmShip(order)" [disabled]="advancing() === order.id"
                              class="shrink-0 px-4 py-2.5 rounded-[10px] bg-neon-cyan/10 border border-neon-cyan/30 text-[12px]
                                     font-semibold text-neon-cyan hover:bg-neon-cyan/20 disabled:opacity-40 transition-all
                                     flex items-center gap-1.5">
                              @if (advancing() === order.id) {
                                <ng-icon name="lucideRefreshCw" size="12" class="animate-spin" />
                              } @else {
                                <ng-icon name="lucideTruck" size="12" />
                              }
                              Confirmar envío
                            </button>
                            <button (click)="cancelTracking()" class="neo-btn-outline !py-2.5 !px-3 !text-[12px]">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      }

                      <!-- Tracking badge (when already shipped) -->
                      @if (orderDetail()!.trackingNumber) {
                        <div class="px-5 py-3 border-t border-border">
                          <div class="flex items-center gap-2 text-[13px]">
                            <ng-icon name="lucideTruck" size="13" class="text-accent shrink-0" />
                            <span class="text-text-muted">Seguimiento:</span>
                            <span class="font-mono text-text-primary font-medium">{{ orderDetail()!.trackingNumber }}</span>
                          </div>
                        </div>
                      }

                      <!-- Actions -->
                      @if (nextStatus(order.status)) {
                        <div class="px-5 py-3.5 border-t border-border flex items-center gap-2.5 flex-wrap">
                          @if (trackingInput() !== order.id) {
                            <button (click)="advance(order)" [disabled]="advancing() === order.id"
                              class="neo-btn-primary !text-[12px] !py-2 !px-4 disabled:opacity-50 flex items-center gap-1.5">
                              @if (advancing() === order.id) {
                                <ng-icon name="lucideRefreshCw" size="12" class="animate-spin" />
                              } @else {
                                <ng-icon [name]="meta(nextStatus(order.status)!).icon" size="12" />
                              }
                              {{ NEXT_LABEL[order.status] }}
                            </button>
                            @if (order.status !== 'CANCELLED') {
                              <button (click)="cancel(order)" [disabled]="advancing() === order.id"
                                class="px-3.5 py-2 rounded-[10px] border border-border text-[12px] font-medium
                                       text-error hover:bg-error/10 disabled:opacity-40 transition-colors">
                                Cancelar orden
                              </button>
                            }
                          }
                        </div>
                      }
                    }
                  </div>
                }
              </div>
            }
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="flex items-center justify-center gap-3 mt-6">
              <button (click)="prevPage()" [disabled]="page() === 0"
                class="neo-btn-outline !py-2 !px-4 !text-[13px] disabled:opacity-40 disabled:cursor-not-allowed">
                <ng-icon name="lucideChevronLeft" size="13" />Anterior
              </button>
              <span class="text-sm text-text-muted tabular-nums">{{ page() + 1 }} / {{ totalPages() }}</span>
              <button (click)="nextPage()" [disabled]="page() + 1 >= totalPages()"
                class="neo-btn-outline !py-2 !px-4 !text-[13px] disabled:opacity-40 disabled:cursor-not-allowed">
                Siguiente<ng-icon name="lucideChevronRight" size="13" />
              </button>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class SellerOrdersComponent implements OnInit {
  private orderService = inject(SellerOrderService);

  orders       = signal<SellerOrderSummary[]>([]);
  loading      = signal(true);
  page         = signal(0);
  totalPages   = signal(0);
  advancing    = signal<string | null>(null);
  searchQ      = '';

  filteredOrders = computed(() => {
    const q = this.searchQ.toLowerCase().trim();
    if (!q) return this.orders();
    return this.orders().filter(o => o.buyerName.toLowerCase().includes(q));
  });
  trackingInput       = signal<string | null>(null);
  trackingNumberValue = '';
  expandedId   = signal<string | null>(null);
  orderDetail  = signal<SellerOrderGroup | null>(null);
  loadingDetail = signal(false);

  readonly NEXT_LABEL = NEXT_LABEL;

  meta(s: OrderGroupStatus): StatusMeta { return STATUS_META[s] ?? STATUS_META.PENDING; }
  nextStatus(s: OrderGroupStatus): OrderGroupStatus | undefined { return NEXT_STATUS[s]; }

  pendingCount() { return this.orders().filter(o => o.status === 'PENDING').length; }

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.orderService.getMyOrders(this.page(), 20).subscribe({
      next: (res) => {
        this.orders.set(res.data.content);
        this.totalPages.set(res.data.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleExpand(id: string): void {
    if (this.expandedId() === id) { this.expandedId.set(null); return; }
    this.expandedId.set(id);
    this.orderDetail.set(null);
    this.loadingDetail.set(true);
    this.orderService.getOrder(id).subscribe({
      next: (res) => { this.orderDetail.set(res.data); this.loadingDetail.set(false); },
      error: () => this.loadingDetail.set(false),
    });
  }

  advance(order: SellerOrderSummary): void {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    if (order.status === 'CONFIRMED') {
      this.trackingInput.set(order.id);
      this.trackingNumberValue = '';
      return;
    }
    this.advancing.set(order.id);
    this.orderService.updateStatus(order.id, next).subscribe({
      next: () => { this.advancing.set(null); this.load(); },
      error: () => this.advancing.set(null),
    });
  }

  confirmShip(order: SellerOrderSummary): void {
    this.advancing.set(order.id);
    this.trackingInput.set(null);
    this.orderService.updateStatus(order.id, 'SHIPPED', this.trackingNumberValue || undefined).subscribe({
      next: () => { this.advancing.set(null); this.load(); },
      error: () => this.advancing.set(null),
    });
  }

  cancelTracking(): void { this.trackingInput.set(null); }

  cancel(order: SellerOrderSummary): void {
    this.advancing.set(order.id);
    this.orderService.updateStatus(order.id, 'CANCELLED').subscribe({
      next: () => { this.advancing.set(null); this.load(); },
      error: () => this.advancing.set(null),
    });
  }

  prevPage(): void { if (this.page() > 0) { this.page.update(p => p - 1); this.load(); } }
  nextPage(): void { if (this.page() + 1 < this.totalPages()) { this.page.update(p => p + 1); this.load(); } }
}
