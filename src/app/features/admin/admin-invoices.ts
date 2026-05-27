import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { AdminService } from '../../core/admin/admin.service';
import { Invoice } from '../../shared/models/invoice.models';
import { InvoiceStatus } from '../../shared/models/enums';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';

type StatusMeta = { label: string; color: string; bg: string; border: string };

const STATUS_MAP: Record<InvoiceStatus, StatusMeta> = {
  DRAFT:     { label: 'Borrador', color: 'var(--color-warning)', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)'  },
  ISSUED:    { label: 'Emitida',  color: 'var(--color-success)', bg: 'rgba(0,200,120,0.1)',   border: 'rgba(0,200,120,0.3)'   },
  CANCELLED: { label: 'Anulada', color: 'var(--color-error)',   bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)'   },
};

@Component({
  selector: 'app-admin-invoices',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon, CopCurrencyPipe],
  template: `
    <div class="max-w-5xl">

      <!-- Header -->
      <div class="mb-6">
        <p class="neo-stat-label">Admin</p>
        <h1 class="font-display text-[26px] font-bold tracking-[-0.02em] text-text-primary mt-0.5">
          Facturas
        </h1>
      </div>

      @if (loading()) {
        <div class="flex flex-col gap-3">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="h-16 rounded-2xl bg-bg-surface border border-border animate-pulse"></div>
          }
        </div>

      } @else if (invoices().length === 0) {
        <div class="neo-card-premium p-14 flex flex-col items-center gap-4 text-center">
          <div class="w-14 h-14 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center">
            <ng-icon name="lucideReceipt" size="26" class="text-text-muted" />
          </div>
          <p class="text-base font-semibold text-text-primary">No hay facturas en el sistema</p>
        </div>

      } @else {
        <div class="neo-card-premium overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-[13px] border-collapse">
              <thead>
                <tr class="bg-bg-elevated">
                  <th class="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted font-mono whitespace-nowrap">N° Factura</th>
                  <th class="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted font-mono whitespace-nowrap hidden md:table-cell">Comprador</th>
                  <th class="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted font-mono whitespace-nowrap hidden lg:table-cell">Fecha</th>
                  <th class="text-right px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted font-mono whitespace-nowrap">Total</th>
                  <th class="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted font-mono whitespace-nowrap">Estado</th>
                  <th class="text-right px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted font-mono whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (invoice of invoices(); track invoice.id) {
                  <!-- Main row -->
                  <tr class="border-t border-border transition-colors hover:bg-bg-elevated/60">
                    <td class="px-5 py-3.5">
                      <p class="font-mono text-[12px] font-semibold text-text-primary">{{ invoice.invoiceNumber }}</p>
                      <p class="text-[11px] text-text-muted mt-0.5 font-mono">#{{ invoice.orderId.slice(-8).toUpperCase() }}</p>
                    </td>
                    <td class="px-5 py-3.5 hidden md:table-cell">
                      <p class="text-[13px] text-text-primary truncate max-w-[160px]">{{ invoice.buyerName }}</p>
                      <p class="text-[12px] text-text-muted truncate max-w-[160px]">{{ invoice.buyerEmail }}</p>
                    </td>
                    <td class="px-5 py-3.5 hidden lg:table-cell">
                      <span class="text-[12px] text-text-secondary">{{ invoice.issuedAt | date:'d MMM yyyy':'':'es' }}</span>
                    </td>
                    <td class="px-5 py-3.5 text-right">
                      <p class="text-[13px] font-semibold text-text-primary">{{ invoice.total | copCurrency }}</p>
                      <p class="text-[11px] text-text-muted mt-0.5">IVA {{ invoice.taxAmount | copCurrency }}</p>
                    </td>
                    <td class="px-5 py-3.5">
                      <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap"
                        [style.color]="statusMeta(invoice.status).color"
                        [style.background]="statusMeta(invoice.status).bg"
                        [style.border-color]="statusMeta(invoice.status).border">
                        {{ statusMeta(invoice.status).label }}
                      </span>
                    </td>
                    <td class="px-5 py-3.5">
                      <div class="flex items-center gap-1.5 justify-end">
                        <button (click)="toggleDetail(invoice.id)"
                          class="p-1.5 rounded-[8px] border transition-colors"
                          [style.border-color]="expanded() === invoice.id ? 'var(--color-accent)' : 'var(--color-border)'"
                          [style.color]="expanded() === invoice.id ? 'var(--color-accent)' : 'var(--color-text-muted)'">
                          <ng-icon [name]="expanded() === invoice.id ? 'lucideChevronUp' : 'lucideEye'" size="13" />
                        </button>
                        @if (invoice.status === 'ISSUED') {
                          <button (click)="startCancel(invoice.id)"
                            class="p-1.5 rounded-[8px] border border-border text-text-muted
                                   hover:border-error/50 hover:text-error transition-colors">
                            <ng-icon name="lucideX" size="13" />
                          </button>
                        }
                      </div>
                    </td>
                  </tr>

                  <!-- Expanded detail row -->
                  @if (expanded() === invoice.id) {
                    <tr class="border-t border-border">
                      <td colspan="6" class="px-5 pb-5 pt-4 bg-bg-elevated/30">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div class="neo-card-premium p-4">
                            <p class="text-[11px] font-semibold text-text-muted uppercase tracking-[0.06em] mb-2.5">Datos del comprador</p>
                            <p class="text-[13px] font-semibold text-text-primary">{{ invoice.buyerName }}</p>
                            <p class="text-[12px] text-text-secondary mt-0.5">{{ invoice.buyerEmail }}</p>
                            <p class="text-[12px] text-text-muted mt-0.5 font-mono">Doc: {{ invoice.buyerDocument }}</p>
                          </div>
                          <div class="neo-card-premium p-4">
                            <p class="text-[11px] font-semibold text-text-muted uppercase tracking-[0.06em] mb-2.5">Resumen financiero</p>
                            <div class="flex flex-col gap-1">
                              <div class="flex justify-between text-[12px]">
                                <span class="text-text-secondary">Subtotal</span>
                                <span class="text-text-primary">{{ invoice.subtotal | copCurrency }}</span>
                              </div>
                              <div class="flex justify-between text-[12px]">
                                <span class="text-text-secondary">IVA</span>
                                <span class="text-text-primary">{{ invoice.taxAmount | copCurrency }}</span>
                              </div>
                              <div class="flex justify-between text-[13px] font-semibold border-t border-border pt-1.5 mt-1">
                                <span class="text-text-primary">Total</span>
                                <span class="text-text-primary">{{ invoice.total | copCurrency }}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Items table -->
                        <div class="neo-card-premium overflow-hidden">
                          <table class="w-full text-[12px] border-collapse">
                            <thead>
                              <tr class="bg-bg-elevated border-b border-border">
                                <th class="px-4 py-2 text-left text-[11px] font-semibold text-text-muted font-mono uppercase tracking-[0.06em]">Producto</th>
                                <th class="px-4 py-2 text-right text-[11px] font-semibold text-text-muted font-mono uppercase tracking-[0.06em]">Cant.</th>
                                <th class="px-4 py-2 text-right text-[11px] font-semibold text-text-muted font-mono uppercase tracking-[0.06em]">Precio</th>
                                <th class="px-4 py-2 text-right text-[11px] font-semibold text-text-muted font-mono uppercase tracking-[0.06em]">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              @for (item of invoice.items; track item.productId) {
                                <tr class="border-t border-border hover:bg-bg-elevated/40 transition-colors">
                                  <td class="px-4 py-2.5 text-text-primary">
                                    {{ item.productName }}
                                    <span class="text-text-muted ml-1 font-mono">{{ item.productSku }}</span>
                                  </td>
                                  <td class="px-4 py-2.5 text-right text-text-secondary tabular-nums">{{ item.quantity }}</td>
                                  <td class="px-4 py-2.5 text-right text-text-secondary tabular-nums">{{ item.unitPrice | copCurrency }}</td>
                                  <td class="px-4 py-2.5 text-right font-semibold text-text-primary tabular-nums">{{ item.subtotal | copCurrency }}</td>
                                </tr>
                              }
                            </tbody>
                          </table>
                        </div>

                        @if (invoice.cancelReason) {
                          <div class="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-[10px] text-[12px]"
                               style="background:rgba(239,68,68,0.08);color:var(--color-error);border:1px solid rgba(239,68,68,0.2);">
                            <ng-icon name="lucideTriangleAlert" size="12" />
                            Anulada: {{ invoice.cancelReason }}
                          </div>
                        }
                      </td>
                    </tr>
                  }

                  <!-- Cancel form row -->
                  @if (cancellingId() === invoice.id) {
                    <tr class="border-t border-border">
                      <td colspan="6" class="px-5 py-4 bg-bg-elevated/30">
                        <form [formGroup]="cancelForm" (ngSubmit)="confirmCancel(invoice.id)" novalidate
                          class="flex gap-2 items-center">
                          <input type="text" formControlName="reason"
                            placeholder="Motivo de la anulación"
                            class="flex-1 rounded-[10px] bg-bg-surface border border-border px-3.5 py-2 text-[13px]
                                   text-text-primary focus:outline-none focus:ring-2 focus:ring-error/20
                                   focus:border-error transition-colors" />
                          <button type="submit" [disabled]="processing() === invoice.id"
                            class="px-3.5 py-2 rounded-[10px] text-[12px] font-semibold border transition-colors
                                   disabled:opacity-50 flex items-center gap-1.5"
                            style="color:var(--color-error);background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.3);">
                            @if (processing() === invoice.id) {
                              <ng-icon name="lucideRefreshCw" size="11" class="neo-spin" />
                            }
                            Anular
                          </button>
                          <button type="button" (click)="cancellingId.set(null)"
                            class="neo-btn-outline !py-2 !px-3.5 !text-[12px]">
                            Cancelar
                          </button>
                        </form>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>

        @if (hasMore()) {
          <div class="mt-5 flex justify-center">
            <button (click)="loadMore()" [disabled]="loadingMore()"
              class="neo-btn-outline flex items-center gap-2 disabled:opacity-50">
              @if (loadingMore()) {
                <ng-icon name="lucideRefreshCw" size="13" class="neo-spin" />
              }
              Cargar más
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class AdminInvoicesComponent implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);

  invoices = signal<Invoice[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  hasMore = signal(false);
  expanded = signal<string | null>(null);
  cancellingId = signal<string | null>(null);
  processing = signal<string | null>(null);
  private page = 0;

  cancelForm = this.fb.nonNullable.group({
    reason: ['', Validators.required],
  });

  statusMeta(s: InvoiceStatus): StatusMeta { return STATUS_MAP[s] ?? STATUS_MAP.DRAFT; }

  toggleDetail(id: string): void {
    this.expanded.set(this.expanded() === id ? null : id);
  }

  startCancel(id: string): void {
    this.cancelForm.reset({ reason: '' });
    this.cancellingId.set(id);
    this.expanded.set(null);
  }

  ngOnInit(): void {
    this.adminService.getInvoices(0).subscribe({
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
    this.adminService.getInvoices(this.page).subscribe({
      next: (res) => {
        this.invoices.update(list => [...list, ...res.data.content]);
        this.hasMore.set(!res.data.last);
        this.loadingMore.set(false);
      },
      error: () => this.loadingMore.set(false),
    });
  }

  confirmCancel(invoiceId: string): void {
    if (this.cancelForm.invalid) return;
    this.processing.set(invoiceId);
    const { reason } = this.cancelForm.getRawValue();
    this.adminService.cancelInvoice(invoiceId, reason).subscribe({
      next: (res) => {
        this.invoices.update(list =>
          list.map(inv => inv.id === invoiceId ? res.data : inv)
        );
        this.cancellingId.set(null);
        this.processing.set(null);
      },
      error: () => this.processing.set(null),
    });
  }
}
