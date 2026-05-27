import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { InvoiceService } from '../../../core/account/invoice.service';
import { Invoice } from '../../../shared/models/invoice.models';
import { InvoiceStatus } from '../../../shared/models/enums';

type StatusMeta = { label: string; color: string; bg: string; border: string };

const STATUS_MAP: Record<InvoiceStatus, StatusMeta> = {
  DRAFT:     { label: 'Borrador', color: 'var(--color-warning)',    bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  ISSUED:    { label: 'Emitida',  color: 'var(--color-success)',    bg: 'rgba(0,200,120,0.1)',  border: 'rgba(0,200,120,0.3)'  },
  CANCELLED: { label: 'Anulada',  color: 'var(--color-error)',      bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)'  },
};

@Component({
  selector: 'app-my-invoices',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon, CopCurrencyPipe],
  template: `
    <div class="max-w-3xl">

      <!-- Header -->
      <div class="mb-6">
        <p class="neo-stat-label">Cuenta</p>
        <h1 class="font-display text-[26px] font-bold tracking-[-0.02em] text-text-primary mt-0.5">
          Mis facturas
        </h1>
      </div>

      @if (loading()) {
        <div class="flex flex-col gap-3">
          @for (_ of [1,2,3]; track $index) {
            <div class="h-20 rounded-2xl bg-bg-surface border border-border animate-pulse"></div>
          }
        </div>

      } @else if (invoices().length === 0) {
        <div class="neo-card-premium p-14 flex flex-col items-center gap-4 text-center">
          <div class="w-14 h-14 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center">
            <ng-icon name="lucideReceipt" size="26" class="text-text-muted" />
          </div>
          <div>
            <p class="text-base font-semibold text-text-primary">Sin facturas todavía</p>
            <p class="text-sm text-text-muted mt-1">Las facturas se generan con cada compra completada.</p>
          </div>
          <a routerLink="/orders" class="neo-btn-outline !text-[13px] !py-2.5 !px-5 mt-1">
            <ng-icon name="lucideClipboardList" size="14" />
            Ver mis órdenes
          </a>
        </div>

      } @else {
        <div class="neo-card-premium overflow-hidden">
          @for (invoice of invoices(); track invoice.id; let last = $last) {
            <div [class.border-b]="!last" [class.border-border]="!last">

              <!-- Row -->
              <div class="flex items-center justify-between gap-4 px-5 py-4 flex-wrap">
                <div class="flex flex-col gap-0.5 min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-[13px] font-semibold font-mono text-text-primary">
                      {{ invoice.invoiceNumber }}
                    </span>
                    <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                      [style.color]="statusMeta(invoice.status).color"
                      [style.background]="statusMeta(invoice.status).bg"
                      [style.border-color]="statusMeta(invoice.status).border">
                      {{ statusMeta(invoice.status).label }}
                    </span>
                  </div>
                  <p class="text-[12px] text-text-muted">
                    {{ invoice.issuedAt | date:'d MMM yyyy, HH:mm':'':'es' }}
                    · Orden #{{ invoice.orderId.slice(-8).toUpperCase() }}
                  </p>
                </div>

                <div class="flex items-center gap-3 shrink-0">
                  <div class="text-right">
                    <p class="text-sm font-bold text-text-primary tabular-nums">
                      {{ invoice.total | copCurrency }}
                    </p>
                    <p class="text-[11px] text-text-muted">
                      IVA: {{ invoice.taxAmount | copCurrency }}
                    </p>
                  </div>
                  <button (click)="toggle(invoice.id)"
                    class="p-2 rounded-[10px] border border-border hover:border-accent/40 text-text-muted
                           hover:text-accent transition-colors">
                    <ng-icon
                      [name]="expanded() === invoice.id ? 'lucideChevronUp' : 'lucideChevronDown'"
                      size="14" />
                  </button>
                </div>
              </div>

              <!-- Expandible detail -->
              @if (expanded() === invoice.id) {
                <div class="px-5 pb-5 border-t border-border pt-4 bg-bg-elevated/40">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-xs text-text-secondary">
                    <div class="bg-bg-elevated rounded-[10px] border border-border p-3.5">
                      <p class="text-[11px] font-mono uppercase tracking-wide text-text-muted mb-2">Comprador</p>
                      <p class="text-text-primary font-semibold">{{ invoice.buyerName }}</p>
                      <p class="mt-0.5">{{ invoice.buyerEmail }}</p>
                      <p class="mt-0.5 font-mono">{{ invoice.buyerDocument }}</p>
                    </div>
                    <div class="bg-bg-elevated rounded-[10px] border border-border p-3.5">
                      <p class="text-[11px] font-mono uppercase tracking-wide text-text-muted mb-2">Totales</p>
                      <div class="flex justify-between">
                        <span>Subtotal</span>
                        <span class="text-text-primary tabular-nums">{{ invoice.subtotal | copCurrency }}</span>
                      </div>
                      <div class="flex justify-between mt-0.5">
                        <span>IVA</span>
                        <span class="text-text-primary tabular-nums">{{ invoice.taxAmount | copCurrency }}</span>
                      </div>
                      <div class="flex justify-between mt-1.5 pt-1.5 border-t border-border font-semibold text-text-primary">
                        <span>Total</span>
                        <span class="tabular-nums">{{ invoice.total | copCurrency }}</span>
                      </div>
                    </div>
                  </div>

                  <table class="w-full text-xs">
                    <thead>
                      <tr class="border-b border-border text-text-muted">
                        <th class="pb-2 text-left font-medium">Producto</th>
                        <th class="pb-2 text-right font-medium">Cant.</th>
                        <th class="pb-2 text-right font-medium">Precio</th>
                        <th class="pb-2 text-right font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of invoice.items; track item.productId) {
                        <tr class="border-b border-border last:border-0">
                          <td class="py-2 text-text-primary">
                            {{ item.productName }}
                            <span class="text-text-muted ml-1 font-mono">{{ item.productSku }}</span>
                          </td>
                          <td class="py-2 text-right text-text-secondary tabular-nums">{{ item.quantity }}</td>
                          <td class="py-2 text-right text-text-secondary tabular-nums">
                            {{ item.unitPrice | copCurrency }}
                          </td>
                          <td class="py-2 text-right text-text-primary font-semibold tabular-nums">
                            {{ item.subtotal | copCurrency }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>

                  @if (invoice.cancelReason) {
                    <p class="mt-3 text-xs text-error flex items-center gap-1.5">
                      <ng-icon name="lucideTriangleAlert" size="12" />
                      Motivo de anulación: {{ invoice.cancelReason }}
                    </p>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Cargar más -->
        @if (hasMore()) {
          <div class="mt-4 text-center">
            <button (click)="loadMore()" [disabled]="loadingMore()"
              class="neo-btn-outline !py-2.5 !px-5 !text-[13px] disabled:opacity-50 mx-auto">
              @if (loadingMore()) {
                <ng-icon name="lucideRefreshCw" size="14" class="neo-spin" />
                Cargando…
              } @else {
                Cargar más
              }
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class MyInvoicesComponent implements OnInit {
  private invoiceService = inject(InvoiceService);

  invoices    = signal<Invoice[]>([]);
  loading     = signal(true);
  loadingMore = signal(false);
  hasMore     = signal(false);
  expanded    = signal<string | null>(null);
  private page = 0;

  statusMeta(s: InvoiceStatus): StatusMeta { return STATUS_MAP[s] ?? STATUS_MAP.DRAFT; }

  toggle(id: string): void { this.expanded.set(this.expanded() === id ? null : id); }

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
      next:  (res) => {
        this.invoices.update(list => [...list, ...res.data.content]);
        this.hasMore.set(!res.data.last);
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false),
    });
  }
}
