import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { AdminService } from '../../core/admin/admin.service';
import { SellerResponse } from '../../shared/models/seller.models';
import { SellerStatus } from '../../shared/models/enums';

const STATUS_LABEL: Record<SellerStatus, string> = {
  PENDING: 'Pendiente',
  ACTIVE: 'Activo',
  SUSPENDED: 'Suspendido',
};

const STATUS_CLASS: Record<SellerStatus, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-400',
  ACTIVE: 'bg-green-500/15 text-green-400',
  SUSPENDED: 'bg-red-500/15 text-red-400',
};

@Component({
  selector: 'app-admin-sellers',
  standalone: true,
  imports: [CommonModule, NgIcon],
  template: `
    <div>
      <h1 class="text-xl font-bold text-text-primary mb-6">Vendedores</h1>

      <!-- Filtro de estado -->
      <div class="flex gap-2 mb-5">
        @for (f of filters; track f.value) {
          <button (click)="setFilter(f.value)"
            class="px-3 py-1.5 rounded-lg text-sm transition-colors"
            [class]="activeFilter() === f.value
              ? 'bg-accent text-white font-medium'
              : 'border border-border text-text-secondary hover:bg-bg-subtle'">
            {{ f.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="space-y-3">
          @for (_ of [1,2,3]; track $index) {
            <div class="h-20 rounded-xl bg-bg-surface border border-border animate-pulse"></div>
          }
        </div>
      } @else if (sellers().length === 0) {
        <div class="flex flex-col items-center gap-3 py-16 text-text-muted">
          <ng-icon name="lucideUsers" size="40" />
          <p>No hay vendedores con este estado.</p>
        </div>
      } @else {
        <div class="bg-bg-surface border border-border rounded-xl overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border text-left">
                <th class="px-4 py-3 text-xs text-text-muted font-medium">Tienda</th>
                <th class="px-4 py-3 text-xs text-text-muted font-medium hidden md:table-cell">Ubicación</th>
                <th class="px-4 py-3 text-xs text-text-muted font-medium">Estado</th>
                <th class="px-4 py-3 text-xs text-text-muted font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @for (seller of sellers(); track seller.id) {
                <tr class="hover:bg-bg-elevated transition-colors">
                  <td class="px-4 py-3">
                    <p class="font-medium text-text-primary">{{ seller.storeName }}</p>
                    <p class="text-xs text-text-muted">{{ seller.razonSocial }}</p>
                  </td>
                  <td class="px-4 py-3 hidden md:table-cell text-text-secondary text-xs">
                    {{ seller.city }}, {{ seller.department }}
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      [ngClass]="statusClass(seller.status)">
                      {{ statusLabel(seller.status) }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex gap-1.5">
                      @if (seller.status === 'PENDING') {
                        <button (click)="updateStatus(seller, 'ACTIVE')"
                          [disabled]="processing() === seller.id"
                          class="px-2.5 py-1 rounded-lg text-xs font-medium bg-green-500/15 text-green-400
                                 hover:bg-green-500/25 disabled:opacity-50 transition-colors flex items-center gap-1">
                          @if (processing() === seller.id) {
                            <ng-icon name="lucideRefreshCw" size="11" class="animate-spin" />
                          }
                          Aprobar
                        </button>
                        <button (click)="updateStatus(seller, 'SUSPENDED')"
                          [disabled]="processing() === seller.id"
                          class="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/15 text-error
                                 hover:bg-red-500/25 disabled:opacity-50 transition-colors">
                          Rechazar
                        </button>
                      }
                      @if (seller.status === 'ACTIVE') {
                        <button (click)="updateStatus(seller, 'SUSPENDED')"
                          [disabled]="processing() === seller.id"
                          class="px-2.5 py-1 rounded-lg text-xs font-medium border border-border text-text-secondary
                                 hover:border-error hover:text-error disabled:opacity-50 transition-colors">
                          Suspender
                        </button>
                      }
                      @if (seller.status === 'SUSPENDED') {
                        <button (click)="updateStatus(seller, 'ACTIVE')"
                          [disabled]="processing() === seller.id"
                          class="px-2.5 py-1 rounded-lg text-xs font-medium bg-green-500/15 text-green-400
                                 hover:bg-green-500/25 disabled:opacity-50 transition-colors">
                          Reactivar
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
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
export class AdminSellersComponent implements OnInit {
  private adminService = inject(AdminService);

  sellers = signal<SellerResponse[]>([]);
  loading = signal(true);
  page = signal(0);
  totalPages = signal(0);
  activeFilter = signal<SellerStatus | undefined>(undefined);
  processing = signal<string | null>(null);

  readonly filters: { label: string; value: SellerStatus | undefined }[] = [
    { label: 'Todos', value: undefined },
    { label: 'Pendientes', value: 'PENDING' },
    { label: 'Activos', value: 'ACTIVE' },
    { label: 'Suspendidos', value: 'SUSPENDED' },
  ];

  statusLabel(s: SellerStatus): string { return STATUS_LABEL[s] ?? s; }
  statusClass(s: SellerStatus): string { return STATUS_CLASS[s] ?? ''; }

  ngOnInit(): void { this.load(); }

  setFilter(value: SellerStatus | undefined): void {
    this.activeFilter.set(value);
    this.page.set(0);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.adminService.getSellers(this.page(), 20, this.activeFilter()).subscribe({
      next: (res) => {
        this.sellers.set(res.data.content);
        this.totalPages.set(res.data.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  updateStatus(seller: SellerResponse, status: SellerStatus): void {
    this.processing.set(seller.id);
    this.adminService.updateSellerStatus(seller.id, status).subscribe({
      next: (res) => {
        this.sellers.update(list => list.map(s => s.id === seller.id ? res.data : s));
        this.processing.set(null);
      },
      error: () => this.processing.set(null),
    });
  }

  prevPage(): void { if (this.page() > 0) { this.page.update(p => p - 1); this.load(); } }
  nextPage(): void { if (this.page() + 1 < this.totalPages()) { this.page.update(p => p + 1); this.load(); } }
}
