import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { AdminService } from '../../core/admin/admin.service';
import { ChatService } from '../../core/chat/chat.service';
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
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgIcon],
  template: `
    <!-- Modal compose -->
    @if (composing()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div class="neo-card-premium p-6 w-full max-w-[480px]">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-sm font-semibold text-text-primary">
                Mensaje a {{ selectedSeller()!.storeName }}
              </h2>
              <p class="text-[12px] text-text-muted mt-0.5">
                El vendedor lo verá en su bandeja de mensajes
              </p>
            </div>
            <button (click)="composing.set(false)"
              class="p-1.5 rounded-lg hover:bg-bg-elevated text-text-muted transition-colors">
              <ng-icon name="lucideX" size="16" />
            </button>
          </div>
          @if (composeError()) {
            <p class="text-xs text-error mb-3 flex items-center gap-1.5">
              <ng-icon name="lucideTriangleAlert" size="13" />{{ composeError() }}
            </p>
          }
          <form [formGroup]="composeForm" (ngSubmit)="sendMessage()">
            <textarea formControlName="message" rows="5"
              placeholder="Ej: El producto 'X' no cumple con las políticas de la plataforma y debe ser eliminado."
              class="w-full rounded-[10px] bg-bg-elevated border border-border px-3.5 py-2.5 text-sm
                     text-text-primary placeholder:text-text-muted outline-none focus:border-accent
                     transition-colors resize-none mb-4">
            </textarea>
            <div class="flex gap-3 justify-end">
              <button type="button" (click)="composing.set(false)"
                class="neo-btn-outline !py-2 !px-4 !text-[13px]">
                Cancelar
              </button>
              <button type="submit" [disabled]="composeForm.invalid || sending()"
                class="neo-btn-primary !py-2 !px-4 !text-[13px] disabled:opacity-50">
                @if (sending()) {
                  <ng-icon name="lucideRefreshCw" size="13" class="neo-spin" />
                } @else {
                  <ng-icon name="lucideSend" size="13" />
                }
                Enviar
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <div class="max-w-[1100px]">

      <!-- Header -->
      <div class="mb-6">
        <p class="neo-stat-label">Admin</p>
        <h1 class="font-display text-[26px] font-bold tracking-[-0.02em] text-text-primary mt-0.5">
          Vendedores
        </h1>
      </div>

      <!-- Search bar -->
      <div class="relative mb-4">
        <ng-icon name="lucideSearch" size="14"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input [(ngModel)]="searchQ" (ngModelChange)="onSearch($event)"
          placeholder="Buscar tienda por nombre…"
          class="w-full h-[38px] pl-9 pr-3 rounded-[10px] bg-bg-elevated border border-border
                 text-[13px] text-text-primary placeholder:text-text-muted outline-none
                 focus:border-accent/50 transition-colors" />
        @if (searchQ) {
          <button (click)="clearSearch()"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
            <ng-icon name="lucideX" size="13" />
          </button>
        }
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

        <!-- Panel acción vendedor seleccionado -->
        @if (selectedSeller()) {
          <div class="flex items-center justify-between gap-4 mb-4 px-4 py-3 rounded-[12px]
                      bg-accent/8 border border-accent/25 neo-reveal">
            <div class="flex items-center gap-3 min-w-0">
              <ng-icon name="lucideStore" size="16" class="text-accent shrink-0" />
              <div class="min-w-0">
                <p class="text-sm font-semibold text-text-primary truncate">
                  {{ selectedSeller()!.storeName }}
                </p>
                <p class="text-[12px] text-text-muted">Vendedor seleccionado</p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button (click)="openCompose()"
                class="neo-btn-primary !py-2 !px-3 sm:!px-4 !text-[13px]">
                <ng-icon name="lucideMessageCircle" size="14" />
                <span class="hidden sm:inline">Iniciar conversación</span>
              </button>
              <button (click)="selectedSeller.set(null)"
                class="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors">
                <ng-icon name="lucideX" size="14" />
              </button>
            </div>
          </div>
        }

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
                  <tr (click)="selectSeller(seller)"
                      class="border-t border-border transition-colors cursor-pointer"
                      [class.bg-accent-soft]="selectedSeller()?.id === seller.id"
                      [class.hover:bg-bg-elevated/60]="selectedSeller()?.id !== seller.id">
                    <td class="px-5 py-3.5">
                      <div class="flex items-center gap-2">
                        @if (selectedSeller()?.id === seller.id) {
                          <ng-icon name="lucideCircleCheck" size="14" class="text-accent shrink-0" />
                        }
                        <div>
                          <p class="font-semibold text-text-primary">{{ seller.storeName }}</p>
                          <p class="text-[12px] text-text-muted font-mono mt-0.5">{{ seller.razonSocial }}</p>
                        </div>
                      </div>
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
  private chatService  = inject(ChatService);
  private router       = inject(Router);
  private fb           = inject(FormBuilder);

  sellers        = signal<SellerResponse[]>([]);
  loading        = signal(true);
  page           = signal(0);
  totalPages     = signal(0);
  activeFilter   = signal<SellerStatus | undefined>(undefined);
  processing     = signal<string | null>(null);
  selectedSeller = signal<SellerResponse | null>(null);
  composing      = signal(false);
  composeError   = signal<string | null>(null);
  sending        = signal(false);

  composeForm = this.fb.nonNullable.group({
    message: ['', [Validators.required, Validators.minLength(5)]],
  });

  selectSeller(seller: SellerResponse): void {
    this.selectedSeller.set(
      this.selectedSeller()?.id === seller.id ? null : seller
    );
  }

  openCompose(): void {
    this.composeError.set(null);
    this.composeForm.reset();
    this.composing.set(true);
  }

  sendMessage(): void {
    const seller = this.selectedSeller();
    if (!seller || this.composeForm.invalid) return;
    this.sending.set(true);
    this.composeError.set(null);
    this.chatService.startConversation({
      sellerId: seller.id,
      firstMessage: this.composeForm.getRawValue().message,
    }).subscribe({
      next: (res) => {
        this.sending.set(false);
        this.composing.set(false);
        this.router.navigate(['/admin/messages', res.data.id]);
      },
      error: (err) => {
        this.sending.set(false);
        this.composeError.set(err.error?.message ?? 'Error al enviar');
      },
    });
  }

  readonly filters: { label: string; value: SellerStatus | undefined }[] = [
    { label: 'Todos',       value: undefined    },
    { label: 'Pendientes',  value: 'PENDING'    },
    { label: 'Activos',     value: 'ACTIVE'     },
    { label: 'Suspendidos', value: 'SUSPENDED'  },
  ];

  statusMeta(s: SellerStatus): StatusMeta { return STATUS_MAP[s] ?? STATUS_MAP.PENDING; }

  searchQ = '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  onSearch(q: string): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(0); this.load(); }, 300);
  }

  clearSearch(): void {
    this.searchQ = '';
    this.page.set(0);
    this.load();
  }

  ngOnInit(): void { this.load(); }

  setFilter(value: SellerStatus | undefined): void {
    this.activeFilter.set(value);
    this.page.set(0);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.adminService.getSellers(this.page(), 20, this.activeFilter(), this.searchQ || undefined).subscribe({
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
    let call$;
    if (status === 'ACTIVE' && seller.status === 'SUSPENDED') {
      call$ = this.adminService.reactivateSeller(seller.id);
    } else if (status === 'ACTIVE') {
      call$ = this.adminService.approveSeller(seller.id);
    } else {
      call$ = this.adminService.suspendSeller(seller.id);
    }
    call$.subscribe({
      next:  (res) => { this.sellers.update(list => list.map(s => s.id === seller.id ? res.data : s)); this.processing.set(null); },
      error: () => this.processing.set(null),
    });
  }

  prevPage(): void { if (this.page() > 0) { this.page.update(p => p - 1); this.load(); } }
  nextPage(): void { if (this.page() + 1 < this.totalPages()) { this.page.update(p => p + 1); this.load(); } }
}
