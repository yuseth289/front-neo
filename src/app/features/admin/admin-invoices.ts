import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { AdminService } from '../../core/admin/admin.service';
import { Invoice } from '../../shared/models/invoice.models';
import { InvoiceStatus } from '../../shared/models/enums';

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
  selector: 'app-admin-invoices',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  template: `
    <div class="max-w-5xl">
      <h1 class="text-xl font-bold text-text-primary mb-6">Facturas</h1>

      @if (loading()) {
        <div class="space-y-3">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="h-16 rounded-xl bg-bg-surface border border-border animate-pulse"></div>
          }
        </div>
      } @else if (invoices().length === 0) {
        <div class="flex flex-col items-center gap-3 py-16 text-text-muted">
          <ng-icon name="lucideReceipt" size="40" />
          <p>No hay facturas en el sistema.</p>
        </div>
      } @else {
        <div class="bg-bg-surface border border-border rounded-xl overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border text-left bg-bg-elevated">
                <th class="px-4 py-3 text-xs text-text-muted font-medium">N° Factura</th>
                <th class="px-4 py-3 text-xs text-text-muted font-medium hidden md:table-cell">Comprador</th>
                <th class="px-4 py-3 text-xs text-text-muted font-medium hidden lg:table-cell">Fecha</th>
                <th class="px-4 py-3 text-xs text-text-muted font-medium text-right">Total</th>
                <th class="px-4 py-3 text-xs text-text-muted font-medium">Estado</th>
                <th class="px-4 py-3 text-xs text-text-muted font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @for (invoice of invoices(); track invoice.id) {
                <tr class="hover:bg-bg-elevated/50 transition-colors">
                  <td class="px-4 py-3">
                    <p class="font-mono text-xs text-text-primary font-semibold">
                      {{ invoice.invoiceNumber }}
                    </p>
                    <p class="text-[11px] text-text-muted mt-0.5">
                      #{{ invoice.orderId.slice(-8).toUpperCase() }}
                    </p>
                  </td>
                  <td class="px-4 py-3 hidden md:table-cell">
                    <p class="text-text-primary truncate max-w-[160px]">{{ invoice.buyerName }}</p>
                    <p class="text-xs text-text-muted truncate max-w-[160px]">{{ invoice.buyerEmail }}</p>
                  </td>
                  <td class="px-4 py-3 text-xs text-text-muted hidden lg:table-cell">
                    {{ invoice.issuedAt | date:'d MMM yyyy':'':'es' }}
                  </td>
                  <td class="px-4 py-3 text-right">
                    <p class="text-sm font-semibold text-text-primary">
                      {{ invoice.total | currency:'COP':'symbol-narrow':'1.0-0':'es' }}
                    </p>
                    <p class="text-[11px] text-text-muted">
                      IVA {{ invoice.taxAmount | currency:'COP':'symbol-narrow':'1.0-0':'es' }}
                    </p>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      [ngClass]="statusClass(invoice.status)">
                      {{ statusLabel(invoice.status) }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <button (click)="toggleDetail(invoice.id)"
                        class="p-1.5 rounded-lg border border-border hover:border-accent/50 text-text-muted
                               hover:text-accent transition-colors">
                        <ng-icon
                          [name]="expanded() === invoice.id ? 'lucideChevronUp' : 'lucideEye'"
                          size="13" />
                      </button>
                      @if (invoice.status === 'ISSUED') {
                        <button (click)="startCancel(invoice.id)"
                          class="p-1.5 rounded-lg border border-border hover:border-error/50 text-text-muted
                                 hover:text-error transition-colors">
                          <ng-icon name="lucideX" size="13" />
                        </button>
                      }
                    </div>
                  </td>
                </tr>

                <!-- Fila expandida con detalle -->
                @if (expanded() === invoice.id) {
                  <tr>
                    <td colspan="6" class="px-4 pb-4 bg-bg-elevated/30">
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                        <div class="text-xs text-text-secondary">
                          <p class="text-text-muted font-medium mb-1">Datos del comprador</p>
                          <p>{{ invoice.buyerName }}</p>
                          <p>{{ invoice.buyerEmail }}</p>
                          <p>Doc: {{ invoice.buyerDocument }}</p>
                        </div>
                        <div class="text-xs text-text-secondary">
                          <p class="text-text-muted font-medium mb-1">Resumen financiero</p>
                          <p>Subtotal: {{ invoice.subtotal | currency:'COP':'symbol-narrow':'1.0-0':'es' }}</p>
                          <p>IVA: {{ invoice.taxAmount | currency:'COP':'symbol-narrow':'1.0-0':'es' }}</p>
                          <p class="font-semibold text-text-primary">
                            Total: {{ invoice.total | currency:'COP':'symbol-narrow':'1.0-0':'es' }}
                          </p>
                        </div>
                      </div>
                      <table class="w-full text-xs mt-3">
                        <thead>
                          <tr class="text-text-muted border-b border-border">
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
                              <td class="py-1.5 text-right font-medium text-text-primary">
                                {{ item.subtotal | currency:'COP':'symbol-narrow':'1.0-0':'es' }}
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                      @if (invoice.cancelReason) {
                        <p class="mt-2 text-xs text-error flex items-center gap-1">
                          <ng-icon name="lucideTriangleAlert" size="12" />
                          Anulada: {{ invoice.cancelReason }}
                        </p>
                      }
                    </td>
                  </tr>
                }

                <!-- Fila de formulario de anulación -->
                @if (cancellingId() === invoice.id) {
                  <tr>
                    <td colspan="6" class="px-4 pb-4 bg-bg-elevated/30">
                      <form [formGroup]="cancelForm" (ngSubmit)="confirmCancel(invoice.id)" novalidate
                        class="flex gap-2 pt-3">
                        <input type="text" formControlName="reason"
                          placeholder="Motivo de la anulación"
                          class="flex-1 rounded-lg bg-bg-surface border border-border px-3 py-1.5 text-sm
                                 text-text-primary focus:outline-none focus:border-error transition-colors" />
                        <button type="submit" [disabled]="processing() === invoice.id"
                          class="px-3 py-1.5 rounded-lg bg-error/80 hover:bg-error disabled:opacity-50
                                 text-white text-xs font-medium transition-colors flex items-center gap-1.5">
                          @if (processing() === invoice.id) {
                            <ng-icon name="lucideRefreshCw" size="11" class="animate-spin" />
                          }
                          Anular
                        </button>
                        <button type="button" (click)="cancellingId.set(null)"
                          class="px-3 py-1.5 rounded-lg border border-border text-text-secondary
                                 text-xs transition-colors">
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

  statusLabel(s: InvoiceStatus): string { return STATUS_LABEL[s] ?? s; }
  statusClass(s: InvoiceStatus): string { return STATUS_CLASS[s] ?? ''; }

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
