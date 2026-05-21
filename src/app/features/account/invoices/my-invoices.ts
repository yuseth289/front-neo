import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { InvoiceService } from '../../../core/account/invoice.service';
import { Invoice } from '../../../shared/models/invoice.models';
import { InvoiceStatus } from '../../../shared/models/enums';

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: 'Borrador',
  ISSUED: 'Emitida',
  CANCELLED: 'Anulada',
};

const STATUS_CLASS: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-yellow-500/15 text-yellow-400',
  ISSUED: 'bg-green-500/15 text-green-400',
  CANCELLED: 'bg-red-500/15 text-red-400',
};

@Component({
  selector: 'app-my-invoices',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon],
  template: `
    <div class="max-w-3xl">
      <h1 class="text-xl font-bold text-text-primary mb-6">Mis facturas</h1>

      @if (loading()) {
        <div class="space-y-3">
          @for (_ of [1,2,3]; track $index) {
            <div class="h-20 rounded-xl bg-bg-surface border border-border animate-pulse"></div>
          }
        </div>
      } @else if (invoices().length === 0) {
        <div class="flex flex-col items-center gap-3 py-16 text-text-muted">
          <ng-icon name="lucideReceipt" size="40" />
          <p>No tienes facturas todavía.</p>
          <a routerLink="/orders" class="text-sm text-accent hover:text-accent-hover">
            Ver mis órdenes
          </a>
        </div>
      } @else {
        <div class="bg-bg-surface border border-border rounded-xl overflow-hidden">
          @for (invoice of invoices(); track invoice.id; let last = $last) {
            <div class="px-5 py-4 flex items-center justify-between gap-4 flex-wrap"
              [class.border-b]="!last" [class.border-border]="!last">

              <!-- Info principal -->
              <div class="flex flex-col gap-0.5 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-sm font-semibold text-text-primary font-mono">
                    {{ invoice.invoiceNumber }}
                  </span>
                  <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    [ngClass]="statusClass(invoice.status)">
                    {{ statusLabel(invoice.status) }}
                  </span>
                </div>
                <p class="text-xs text-text-muted">
                  {{ invoice.issuedAt | date:'d MMM yyyy, HH:mm':'':'es' }}
                  · Orden #{{ invoice.orderId.slice(-8).toUpperCase() }}
                </p>
              </div>

              <!-- Total + acciones -->
              <div class="flex items-center gap-4 shrink-0">
                <div class="text-right">
                  <p class="text-sm font-bold text-text-primary">
                    {{ invoice.total | currency:'COP':'symbol-narrow':'1.0-0':'es' }}
                  </p>
                  <p class="text-xs text-text-muted">
                    IVA: {{ invoice.taxAmount | currency:'COP':'symbol-narrow':'1.0-0':'es' }}
                  </p>
                </div>
                <button (click)="toggle(invoice.id)"
                  class="p-2 rounded-lg border border-border hover:border-accent/50 text-text-muted
                         hover:text-accent transition-colors">
                  <ng-icon
                    [name]="expanded() === invoice.id ? 'lucideChevronUp' : 'lucideChevronDown'"
                    size="14" />
                </button>
              </div>

              <!-- Detalle expandible -->
              @if (expanded() === invoice.id) {
                <div class="w-full mt-2 pt-3 border-t border-border">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs text-text-secondary">
                    <div>
                      <p class="text-text-muted mb-0.5">Comprador</p>
                      <p class="text-text-primary font-medium">{{ invoice.buyerName }}</p>
                      <p>{{ invoice.buyerEmail }}</p>
                      <p>Doc: {{ invoice.buyerDocument }}</p>
                    </div>
                    <div>
                      <p class="text-text-muted mb-0.5">Totales</p>
                      <p>Subtotal: {{ invoice.subtotal | currency:'COP':'symbol-narrow':'1.0-0':'es' }}</p>
                      <p>IVA: {{ invoice.taxAmount | currency:'COP':'symbol-narrow':'1.0-0':'es' }}</p>
                      <p class="font-semibold text-text-primary">
                        Total: {{ invoice.total | currency:'COP':'symbol-narrow':'1.0-0':'es' }}
                      </p>
                    </div>
                  </div>

                  <table class="w-full text-xs">
                    <thead>
                      <tr class="border-b border-border text-text-muted">
                        <th class="pb-1.5 text-left font-medium">Producto</th>
                        <th class="pb-1.5 text-right font-medium">Cant.</th>
                        <th class="pb-1.5 text-right font-medium">Precio</th>
                        <th class="pb-1.5 text-right font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-border">
                      @for (item of invoice.items; track item.productId) {
                        <tr>
                          <td class="py-1.5 text-text-primary">
                            {{ item.productName }}
                            <span class="text-text-muted ml-1">{{ item.productSku }}</span>
                          </td>
                          <td class="py-1.5 text-right text-text-secondary">{{ item.quantity }}</td>
                          <td class="py-1.5 text-right text-text-secondary">
                            {{ item.unitPrice | currency:'COP':'symbol-narrow':'1.0-0':'es' }}
                          </td>
                          <td class="py-1.5 text-right text-text-primary font-medium">
                            {{ item.subtotal | currency:'COP':'symbol-narrow':'1.0-0':'es' }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>

                  @if (invoice.cancelReason) {
                    <p class="mt-3 text-xs text-error flex items-center gap-1">
                      <ng-icon name="lucideTriangleAlert" size="12" />
                      Motivo de anulación: {{ invoice.cancelReason }}
                    </p>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Paginación -->
        @if (hasMore()) {
          <div class="mt-4 text-center">
            <button (click)="loadMore()" [disabled]="loadingMore()"
              class="px-5 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary
                     text-sm transition-colors flex items-center gap-2 mx-auto disabled:opacity-50">
              @if (loadingMore()) {
                <ng-icon name="lucideRefreshCw" size="14" class="animate-spin" />
              }
              Cargar más
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class MyInvoicesComponent implements OnInit {
  private invoiceService = inject(InvoiceService);

  invoices = signal<Invoice[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  hasMore = signal(false);
  expanded = signal<string | null>(null);
  private page = 0;

  statusLabel(s: InvoiceStatus): string { return STATUS_LABEL[s] ?? s; }
  statusClass(s: InvoiceStatus): string { return STATUS_CLASS[s] ?? ''; }

  toggle(id: string): void {
    this.expanded.set(this.expanded() === id ? null : id);
  }

  ngOnInit(): void {
    this.invoiceService.getMyInvoices(0).subscribe({
      next: (res) => {
        this.invoices.set(res.data.content);
        this.hasMore.set(!res.data.last);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadMore(): void {
    this.loadingMore.set(true);
    this.page++;
    this.invoiceService.getMyInvoices(this.page).subscribe({
      next: (res) => {
        this.invoices.update(list => [...list, ...res.data.content]);
        this.hasMore.set(!res.data.last);
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false),
    });
  }
}
