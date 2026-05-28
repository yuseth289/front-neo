import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { AdminService } from '../../core/admin/admin.service';
import { SellerResponse } from '../../shared/models/seller.models';
import { SellerStatus } from '../../shared/models/enums';

type StatusMeta = { label: string; color: string; bg: string; border: string };

const STATUS_MAP: Record<SellerStatus, StatusMeta> = {
  PENDING:   { label: 'Pendiente',   color: 'var(--color-warning)',    bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)'  },
  ACTIVE:    { label: 'Activo',      color: 'var(--color-success)',    bg: 'rgba(0,200,120,0.1)',   border: 'rgba(0,200,120,0.3)'   },
  SUSPENDED: { label: 'Suspendido',  color: 'var(--color-error)',      bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)'   },
};

@Component({
  selector: 'app-admin-sellers',
  standalone: true,
  imports: [CommonModule, NgIcon],
  template: `
    <div class="max-w-[1100px]">

      <!-- Header -->
      <div class="mb-6">
        <p class="neo-stat-label">Admin</p>
        <h1 class="font-display text-[26px] font-bold tracking-[-0.02em] text-text-primary mt-0.5">
          Vendedores
        </h1>
      </div>

      <!-- Filter tabs -->
      <div class="flex gap-2 mb-5 flex-wrap">
        @for (f of filters; track f.value) {
          <button (click)="setFilter(f.value)"
            class="px-3.5 py-1.5 rounded-[10px] text-[13px] font-medium transition-all duration-200"
            [style.background]="activeFilter() === f.value ? 'var(--color-accent)' : 'transparent'"
            [style.color]="activeFilter() === f.value ? 'white' : 'var(--color-text-secondary)'"
            [style.border]="activeFilter() === f.value ? '1px solid var(--color-accent)' : '1px solid var(--color-border)'"
            [style.box-shadow]="activeFilter() === f.value ? '0 0 12px var(--color-accent-glow)' : 'none'">
            {{ f.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="flex flex-col gap-3">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="h-16 rounded-2xl bg-bg-surface border border-border animate-pulse"></div>
          }
        </div>

      } @else if (sellers().length === 0) {
        <div class="neo-card-premium p-14 flex flex-col items-center gap-4 text-center">
          <div class="w-14 h-14 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center">
            <ng-icon name="lucideUsers" size="26" class="text-text-muted" />
          </div>
          <p class="text-base font-semibold text-text-primary">Sin vendedores en este estado</p>
        </div>

      } @else {
        <div class="neo-card-premium overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-[13px] border-collapse">
              <thead>
                <tr class="bg-bg-elevated">
                  @for (h of ['Tienda','Ubicación','Estado','Acciones']; track h) {
                    <th class="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]
                               text-text-muted font-mono whitespace-nowrap last:text-right"
                        [class.hidden]="h === 'Ubicación'"
                        [class.md:table-cell]="h === 'Ubicación'">{{ h }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (seller of sellers(); track seller.id) {
                  <tr class="border-t border-border transition-colors hover:bg-bg-elevated/60">
                    <td class="px-5 py-3.5">
                      <p class="font-semibold text-text-primary">{{ seller.storeName }}</p>
                      <p class="text-[12px] text-text-muted font-mono mt-0.5">{{ seller.razonSocial }}</p>
                    </td>
                    <td class="px-5 py-3.5 hidden md:table-cell text-text-secondary text-[12px]">
                      {{ seller.city }}, {{ seller.department }}
                    </td>
                    <td class="px-5 py-3.5">
                      <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap"
                        [style.color]="statusMeta(seller.status).color"
                        [style.background]="statusMeta(seller.status).bg"
                        [style.border-color]="statusMeta(seller.status).border">
                        {{ statusMeta(seller.status).label }}
                      </span>
                    </td>
                    <td class="px-5 py-3.5">
                      <div class="flex gap-1.5 justify-end">
                        @if (seller.status === 'PENDING') {
                          <button (click)="updateStatus(seller, 'ACTIVE')"
                            [disabled]="processing() === seller.id"
                            class="px-2.5 py-1 rounded-[8px] text-[12px] font-semibold border transition-colors
                                   disabled:opacity-50 flex items-center gap-1"
                            style="color:var(--color-success);background:rgba(0,200,120,0.1);border-color:rgba(0,200,120,0.3);">
                            @if (processing() === seller.id) {
                              <ng-icon name="lucideRefreshCw" size="11" class="neo-spin" />
                            } @else {
                              <ng-icon name="lucideCheck" size="11" />
                            }
                            Aprobar
                          </button>
                          <button (click)="updateStatus(seller, 'SUSPENDED')"
                            [disabled]="processing() === seller.id"
                            class="px-2.5 py-1 rounded-[8px] text-[12px] font-semibold border transition-colors
                                   disabled:opacity-50 flex items-center gap-1"
                            style="color:var(--color-error);background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.3);">
                            <ng-icon name="lucideX" size="11" />
                            Rechazar
                          </button>
                        }
                        @if (seller.status === 'ACTIVE') {
                          <button (click)="updateStatus(seller, 'SUSPENDED')"
                            [disabled]="processing() === seller.id"
                            class="px-2.5 py-1 rounded-[8px] text-[12px] font-medium border border-border
                                   text-text-secondary hover:border-error hover:text-error disabled:opacity-50 transition-colors">
                            Suspender
                          </button>
                        }
                        @if (seller.status === 'SUSPENDED') {
                          <button (click)="updateStatus(seller, 'ACTIVE')"
                            [disabled]="processing() === seller.id"
                            class="px-2.5 py-1 rounded-[8px] text-[12px] font-semibold border transition-colors
                                   disabled:opacity-50 flex items-center gap-1"
                            style="color:var(--color-success);background:rgba(0,200,120,0.1);border-color:rgba(0,200,120,0.3);">
                            <ng-icon name="lucideCheck" size="11" />
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
        </div>

        @if (totalPages() > 1) {
          <div class="flex items-center justify-center gap-3 mt-5">
            <button (click)="prevPage()" [disabled]="page() === 0"
              class="neo-btn-outline !py-2 !px-4 !text-[13px] disabled:opacity-40 disabled:cursor-not-allowed">
              <ng-icon name="lucideChevronLeft" size="13" />
              Anterior
            </button>
            <span class="text-sm text-text-muted tabular-nums">{{ page() + 1 }} / {{ totalPages() }}</span>
            <button (click)="nextPage()" [disabled]="page() + 1 >= totalPages()"
              class="neo-btn-outline !py-2 !px-4 !text-[13px] disabled:opacity-40 disabled:cursor-not-allowed">
              Siguiente
              <ng-icon name="lucideChevronRight" size="13" />
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class AdminSellersComponent implements OnInit {
  private adminService = inject(AdminService);

  sellers      = signal<SellerResponse[]>([]);
  loading      = signal(true);
  page         = signal(0);
  totalPages   = signal(0);
  activeFilter = signal<SellerStatus | undefined>(undefined);
  processing   = signal<string | null>(null);

  readonly filters: { label: string; value: SellerStatus | undefined }[] = [
    { label: 'Todos',       value: undefined    },
    { label: 'Pendientes',  value: 'PENDING'    },
    { label: 'Activos',     value: 'ACTIVE'     },
    { label: 'Suspendidos', value: 'SUSPENDED'  },
  ];

  statusMeta(s: SellerStatus): StatusMeta { return STATUS_MAP[s] ?? STATUS_MAP.PENDING; }

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
    const call$ = status === 'ACTIVE'
      ? this.adminService.approveSeller(seller.id)
      : this.adminService.suspendSeller(seller.id);
    call$.subscribe({
      next:  (res) => { this.sellers.update(list => list.map(s => s.id === seller.id ? res.data : s)); this.processing.set(null); },
      error: () => this.processing.set(null),
    });
  }

  prevPage(): void { if (this.page() > 0) { this.page.update(p => p - 1); this.load(); } }
  nextPage(): void { if (this.page() + 1 < this.totalPages()) { this.page.update(p => p + 1); this.load(); } }
}
