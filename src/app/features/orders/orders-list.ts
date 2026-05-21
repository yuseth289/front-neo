import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { OrderService } from '../../core/account/order.service';
import { OrderSummary } from '../../shared/models/order.models';
import { OrderStatus } from '../../shared/models/enums';

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  PAYMENT_PENDING: 'Pago pendiente',
  PAYMENT_APPROVED: 'Pago aprobado',
  PAYMENT_REJECTED: 'Pago rechazado',
  PROCESSING: 'En proceso',
  PARTIALLY_SHIPPED: 'Parcialmente enviado',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

const STATUS_CLASS: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-400',
  PAYMENT_PENDING: 'bg-yellow-500/15 text-yellow-400',
  PAYMENT_APPROVED: 'bg-green-500/15 text-green-400',
  PAYMENT_REJECTED: 'bg-red-500/15 text-red-400',
  PROCESSING: 'bg-blue-500/15 text-blue-400',
  PARTIALLY_SHIPPED: 'bg-blue-500/15 text-blue-400',
  SHIPPED: 'bg-blue-500/15 text-blue-400',
  DELIVERED: 'bg-green-500/15 text-green-400',
  CANCELLED: 'bg-red-500/15 text-red-400',
  REFUNDED: 'bg-purple-500/15 text-purple-400',
};

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon],
  template: `
    <div class="max-w-3xl">
      <h1 class="text-xl font-bold text-text-primary mb-6">Mis órdenes</h1>

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
          <a routerLink="/catalog"
            class="text-sm text-accent hover:underline">Explorar productos</a>
        </div>
      } @else {
        <div class="flex flex-col gap-3">
          @for (order of orders(); track order.id) {
            <a [routerLink]="['/orders', order.id]"
              class="bg-bg-surface border border-border rounded-xl p-4 hover:border-accent/40 transition-colors flex items-center justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-sm font-mono text-text-secondary">#{{ order.id.slice(-8).toUpperCase() }}</span>
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
              <div class="shrink-0 text-right">
                <p class="text-sm font-semibold text-text-primary">
                  {{ order.total | currency:'COP':'symbol-narrow':'1.0-0':'es' }}
                </p>
                <ng-icon name="lucideChevronRight" size="16" class="text-text-muted mt-1 inline-block" />
              </div>
            </a>
          }
        </div>

        <!-- Paginación -->
        @if (totalPages() > 1) {
          <div class="flex items-center justify-center gap-3 mt-6">
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
export class OrdersListComponent implements OnInit {
  private orderService = inject(OrderService);

  orders = signal<OrderSummary[]>([]);
  loading = signal(true);
  page = signal(0);
  totalPages = signal(0);

  statusLabel(status: OrderStatus): string { return STATUS_LABEL[status] ?? status; }
  statusClass(status: OrderStatus): string { return STATUS_CLASS[status] ?? ''; }

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
