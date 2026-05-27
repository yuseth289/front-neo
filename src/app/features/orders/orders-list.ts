import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';
import { OrderService } from '../../core/account/order.service';
import { OrderSummary } from '../../shared/models/order.models';
import { OrderStatus } from '../../shared/models/enums';

type StatusMeta = { label: string; color: string; bg: string; border: string; icon: string };

const STATUS_MAP: Record<OrderStatus, StatusMeta> = {
  PENDING:           { label: 'Pendiente',             color: 'var(--color-warning)',     bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  icon: 'lucideClipboardList' },
  PAYMENT_PENDING:   { label: 'Pago pendiente',         color: 'var(--color-warning)',     bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  icon: 'lucideCreditCard'    },
  PAYMENT_APPROVED:  { label: 'Pago aprobado',          color: 'var(--color-success)',     bg: 'rgba(0,200,120,0.08)',   border: 'rgba(0,200,120,0.25)',   icon: 'lucideCheck'         },
  PAYMENT_REJECTED:  { label: 'Pago rechazado',         color: 'var(--color-error)',       bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   icon: 'lucideX'             },
  PROCESSING:        { label: 'En proceso',             color: 'var(--color-neon-cyan)',   bg: 'rgba(0,212,255,0.08)',   border: 'rgba(0,212,255,0.22)',   icon: 'lucideRefreshCw'     },
  PARTIALLY_SHIPPED: { label: 'Parcialmente enviado',   color: 'var(--color-neon-cyan)',   bg: 'rgba(0,212,255,0.08)',   border: 'rgba(0,212,255,0.22)',   icon: 'lucideTruck'         },
  SHIPPED:           { label: 'Enviado',                color: '#818cf8',                  bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.25)', icon: 'lucideTruck'         },
  DELIVERED:         { label: 'Entregado',              color: 'var(--color-success)',     bg: 'rgba(0,200,120,0.08)',   border: 'rgba(0,200,120,0.25)',   icon: 'lucideCircleCheck'   },
  CANCELLED:         { label: 'Cancelado',              color: 'var(--color-error)',       bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   icon: 'lucideX'             },
  REFUNDED:          { label: 'Reembolsado',            color: 'var(--color-text-muted)',  bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.22)', icon: 'lucideReceipt'       },
};

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon, CopCurrencyPipe],
  template: `
    <div class="relative">

      <!-- Ambient backdrop -->
      <div class="neo-grid-bg pointer-events-none absolute inset-0 opacity-30 rounded-3xl"></div>
      <div class="pointer-events-none absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full"
           style="background: radial-gradient(circle, var(--color-accent) 0%, transparent 70%); opacity: 0.04"></div>
      <div class="pointer-events-none absolute -bottom-24 -left-24 w-[360px] h-[360px] rounded-full"
           style="background: radial-gradient(circle, var(--color-neon-cyan) 0%, transparent 70%); opacity: 0.03"></div>

      <div class="relative max-w-3xl">

        <!-- Header -->
        <div class="mb-6 flex items-start justify-between gap-4">
          <div>
            <p class="neo-stat-label">Cuenta</p>
            <h1 class="font-display text-[26px] font-bold tracking-[-0.02em] text-text-primary mt-0.5">
              Mis órdenes
            </h1>
          </div>
          @if (!loading() && orders().length > 0) {
            <div class="shrink-0 self-end mb-1 px-3 py-1 rounded-full bg-bg-elevated border border-border
                        text-[12px] font-mono text-text-muted">
              {{ orders().length }} orden{{ orders().length !== 1 ? 'es' : '' }}
            </div>
          }
        </div>

        <!-- Loading skeletons -->
        @if (loading()) {
          <div class="flex flex-col gap-3">
            @for (_ of [1,2,3,4]; track $index) {
              <div class="h-[72px] rounded-2xl bg-bg-surface border border-border animate-pulse"></div>
            }
          </div>

        <!-- Empty state -->
        } @else if (orders().length === 0) {
          <div class="neo-card-premium p-14 flex flex-col items-center gap-5 text-center neo-reveal">
            <div class="w-16 h-16 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center">
              <ng-icon name="lucideClipboardList" size="28" class="text-text-muted" />
            </div>
            <div>
              <p class="text-base font-semibold text-text-primary">Sin órdenes todavía</p>
              <p class="text-sm text-text-muted mt-1 max-w-xs">
                Explora el catálogo, encuentra lo que buscas y realiza tu primera compra.
              </p>
            </div>
            <a routerLink="/catalog" class="neo-btn-primary !text-[13px] !py-2.5 !px-5">
              <ng-icon name="lucideLayoutGrid" size="14" />
              Explorar catálogo
            </a>
          </div>

        <!-- Order list -->
        } @else {
          <div class="neo-card-premium overflow-hidden">
            @for (order of orders(); track order.id; let i = $index; let last = $last) {
              <a [routerLink]="['/orders', order.id]"
                class="neo-reveal flex items-center gap-4 px-5 py-4 hover:bg-bg-elevated/60 transition-colors group"
                [style.animation-delay]="i * 40 + 'ms'"
                [class.border-b]="!last" [class.border-border]="!last">

                <!-- Status icon badge -->
                <div class="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-all"
                  [style.background]="statusMeta(order.status).bg"
                  [style.border-color]="statusMeta(order.status).border">
                  <ng-icon [name]="statusMeta(order.status).icon" size="16"
                    [style.color]="statusMeta(order.status).color" />
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span class="text-[13px] font-mono font-semibold text-text-secondary">
                      #{{ order.id.slice(-8).toUpperCase() }}
                    </span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide"
                      [style.color]="statusMeta(order.status).color"
                      [style.background]="statusMeta(order.status).bg"
                      [style.border-color]="statusMeta(order.status).border">
                      {{ statusMeta(order.status).label }}
                    </span>
                  </div>
                  <p class="text-[12px] text-text-muted">
                    {{ order.totalItems }} {{ order.totalItems === 1 ? 'producto' : 'productos' }} ·
                    {{ order.createdAt | date:'d MMM yyyy':'':'es' }}
                  </p>
                </div>

                <!-- Total + arrow -->
                <div class="shrink-0 flex items-center gap-2.5">
                  <p class="text-sm font-bold text-text-primary tabular-nums">
                    {{ order.total | copCurrency }}
                  </p>
                  <ng-icon name="lucideChevronRight" size="15"
                    class="text-text-muted group-hover:text-text-primary transition-colors" />
                </div>
              </a>
            }
          </div>

          <!-- Paginación -->
          @if (totalPages() > 1) {
            <div class="flex items-center justify-center gap-3 mt-5">
              <button (click)="prevPage()" [disabled]="page() === 0"
                class="neo-btn-outline !py-2 !px-4 !text-[13px] disabled:opacity-40 disabled:cursor-not-allowed">
                <ng-icon name="lucideChevronLeft" size="13" />
                Anterior
              </button>
              <span class="text-sm text-text-muted tabular-nums font-mono">
                {{ page() + 1 }} / {{ totalPages() }}
              </span>
              <button (click)="nextPage()" [disabled]="page() + 1 >= totalPages()"
                class="neo-btn-outline !py-2 !px-4 !text-[13px] disabled:opacity-40 disabled:cursor-not-allowed">
                Siguiente
                <ng-icon name="lucideChevronRight" size="13" />
              </button>
            </div>
          }
        }

      </div>
    </div>
  `,
})
export class OrdersListComponent implements OnInit {
  private orderService = inject(OrderService);

  orders      = signal<OrderSummary[]>([]);
  loading     = signal(true);
  page        = signal(0);
  totalPages  = signal(0);

  statusMeta(status: OrderStatus): StatusMeta { return STATUS_MAP[status] ?? STATUS_MAP.PENDING; }

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.orderService.getMyOrders(this.page(), 10).subscribe({
      next: (res) => {
        this.orders.set(res.data.content);
        this.totalPages.set(res.data.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  prevPage(): void { if (this.page() > 0) { this.page.update(p => p - 1); this.load(); } }
  nextPage(): void { if (this.page() + 1 < this.totalPages()) { this.page.update(p => p + 1); this.load(); } }
}
