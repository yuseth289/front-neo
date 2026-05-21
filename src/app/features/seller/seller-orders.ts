import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { SellerOrderService, SellerOrderSummary, SellerOrderGroup } from '../../core/seller/seller-order.service';
import { OrderGroupStatus } from '../../shared/models/enums';

const STATUS_LABEL: Record<OrderGroupStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const STATUS_CLASS: Record<OrderGroupStatus, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-400',
  CONFIRMED: 'bg-blue-500/15 text-blue-400',
  PREPARING: 'bg-blue-500/15 text-blue-400',
  SHIPPED: 'bg-blue-500/15 text-blue-400',
  DELIVERED: 'bg-green-500/15 text-green-400',
  CANCELLED: 'bg-red-500/15 text-red-400',
};

const NEXT_STATUS: Partial<Record<OrderGroupStatus, OrderGroupStatus>> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'SHIPPED',
  SHIPPED: 'DELIVERED',
};

const NEXT_LABEL: Partial<Record<OrderGroupStatus, string>> = {
  PENDING: 'Confirmar',
  CONFIRMED: 'Preparar',
  PREPARING: 'Marcar enviado',
  SHIPPED: 'Marcar entregado',
};

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon],
  template: `
    <div>
      <h1 class="text-xl font-bold text-text-primary mb-6">Órdenes recibidas</h1>

      @if (loading()) {
        <div class="space-y-3">
          @for (_ of [1,2,3]; track $index) {
            <div class="h-20 rounded-xl bg-bg-surface border border-border animate-pulse"></div>
          }
        </div>
      } @else if (orders().length === 0) {
        <div class="flex flex-col items-center gap-3 py-16 text-text-muted">
          <ng-icon name="lucideClipboardList" size="40" />
          <p>No tienes órdenes todavía.</p>
        </div>
      } @else {
        <div class="flex flex-col gap-3">
          @for (order of orders(); track order.id) {
            <div class="bg-bg-surface border border-border rounded-xl p-4">
              <div class="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div>
                  <div class="flex items-center gap-2 mb-0.5">
                    <p class="text-sm font-medium text-text-primary">{{ order.buyerName }}</p>
                    <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      [ngClass]="statusClass(order.status)">
                      {{ statusLabel(order.status) }}
                    </span>
                  </div>
                  <p class="text-xs text-text-muted">
                    {{ order.totalItems }} {{ order.totalItems === 1 ? 'producto' : 'productos' }} ·
                    {{ order.createdAt | date:'d MMM yyyy, HH:mm':'':'es' }}
                  </p>
                </div>
                <p class="text-sm font-semibold text-text-primary">
                  {{ order.subtotal | currency:'COP':'symbol-narrow':'1.0-0':'es' }}
                </p>
              </div>

              @if (nextStatus(order.status)) {
                <div class="flex items-center gap-2">
                  <button (click)="advance(order)"
                    [disabled]="advancing() === order.id"
                    class="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-xs font-medium transition-colors flex items-center gap-1.5">
                    @if (advancing() === order.id) {
                      <ng-icon name="lucideRefreshCw" size="12" class="animate-spin" />
                    }
                    {{ nextLabel(order.status) }}
                  </button>

                  @if (order.status !== 'CANCELLED') {
                    <button (click)="cancel(order)"
                      [disabled]="advancing() === order.id"
                      class="px-3 py-1.5 rounded-lg border border-border text-xs text-error hover:bg-error/10 disabled:opacity-50 transition-colors">
                      Cancelar
                    </button>
                  }
                </div>
              }

              @if (trackingInput() === order.id) {
                <div class="mt-3 flex items-center gap-2">
                  <input type="text" [(ngModel)]="trackingNumberValue"
                    placeholder="Número de seguimiento (opcional)"
                    class="flex-1 rounded-lg bg-bg-elevated border border-border px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors" />
                  <button (click)="confirmShip(order)"
                    class="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors">
                    Confirmar envío
                  </button>
                  <button (click)="cancelTracking()"
                    class="px-3 py-1.5 rounded-lg border border-border text-xs text-text-secondary transition-colors">
                    Cancelar
                  </button>
                </div>
              }
            </div>
          }
        </div>

        @if (totalPages() > 1) {
          <div class="flex items-center justify-center gap-3 mt-5">
            <button (click)="prevPage()" [disabled]="page() === 0"
              class="px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary
                     hover:bg-bg-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Anterior
            </button>
            <span class="text-sm text-text-muted">{{ page() + 1 }} / {{ totalPages() }}</span>
            <button (click)="nextPage()" [disabled]="page() + 1 >= totalPages()"
              class="px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary
                     hover:bg-bg-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Siguiente
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class SellerOrdersComponent implements OnInit {
  private orderService = inject(SellerOrderService);

  orders = signal<SellerOrderSummary[]>([]);
  loading = signal(true);
  page = signal(0);
  totalPages = signal(0);
  advancing = signal<string | null>(null);
  trackingInput = signal<string | null>(null);
  trackingNumberValue = '';

  statusLabel(s: OrderGroupStatus): string { return STATUS_LABEL[s] ?? s; }
  statusClass(s: OrderGroupStatus): string { return STATUS_CLASS[s] ?? ''; }
  nextStatus(s: OrderGroupStatus): OrderGroupStatus | undefined { return NEXT_STATUS[s]; }
  nextLabel(s: OrderGroupStatus): string { return NEXT_LABEL[s] ?? ''; }

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
