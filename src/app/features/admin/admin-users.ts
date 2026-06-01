import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { AdminService } from '../../core/admin/admin.service';
import { UserResponse } from '../../shared/models/auth.models';
import { UserStatus } from '../../shared/models/enums';

type StatusMeta = { label: string; color: string; bg: string; border: string };

const STATUS_MAP: Record<UserStatus, StatusMeta> = {
  ACTIVE:    { label: 'Activo',      color: 'var(--color-success)', bg: 'rgba(0,200,120,0.1)',  border: 'rgba(0,200,120,0.3)'  },
  INACTIVE:  { label: 'Inactivo',    color: 'var(--color-warning)', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  SUSPENDED: { label: 'Suspendido',  color: 'var(--color-error)',   bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)'  },
};

const ROLE_LABEL: Record<string, string> = {
  CLIENT: 'Cliente',
  SELLER: 'Vendedor',
  ADMIN:  'Admin',
};

@Component({
  selector: 'app-admin-users',
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
                Mensaje a {{ selectedUser()!.firstName }} {{ selectedUser()!.lastName }}
              </h2>
              <p class="text-[12px] text-text-muted mt-0.5">
                El usuario lo verá en su bandeja de mensajes
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
              placeholder="Ej: Tu cuenta ha sido suspendida por incumplir las políticas de la plataforma."
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
          Usuarios
        </h1>
      </div>

      <!-- Search bar -->
      <div class="relative mb-4">
        <ng-icon name="lucideSearch" size="14"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input [(ngModel)]="searchQ" (ngModelChange)="onSearch($event)"
          placeholder="Buscar por nombre o correo…"
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

      } @else if (users().length === 0) {
        <div class="neo-card-premium p-14 flex flex-col items-center gap-4 text-center">
          <div class="w-14 h-14 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center">
            <ng-icon name="lucideUser" size="26" class="text-text-muted" />
          </div>
          <p class="text-base font-semibold text-text-primary">Sin usuarios en este estado</p>
        </div>

      } @else {

        <!-- Panel usuario seleccionado -->
        @if (selectedUser()) {
          <div class="flex items-center justify-between gap-4 mb-4 px-4 py-3 rounded-[12px]
                      bg-accent/8 border border-accent/25 neo-reveal">
            <div class="flex items-center gap-3 min-w-0">
              <ng-icon name="lucideUser" size="16" class="text-accent shrink-0" />
              <div class="min-w-0">
                <p class="text-sm font-semibold text-text-primary truncate">
                  {{ selectedUser()!.firstName }} {{ selectedUser()!.lastName }}
                </p>
                <p class="text-[12px] text-text-muted">Usuario seleccionado</p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button (click)="openCompose()"
                class="neo-btn-primary !py-2 !px-3 sm:!px-4 !text-[13px]">
                <ng-icon name="lucideMessageCircle" size="14" />
                <span class="hidden sm:inline">Iniciar conversación</span>
              </button>
              <button (click)="selectedUser.set(null)"
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
                  @for (h of ['Usuario','Rol','Estado','Acciones']; track h) {
                    <th class="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]
                               text-text-muted font-mono whitespace-nowrap last:text-right"
                        [class.hidden]="h === 'Rol'"
                        [class.md:table-cell]="h === 'Rol'">{{ h }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (user of users(); track user.id) {
                  <tr (click)="selectedUser.set(selectedUser()?.id === user.id ? null : user)"
                      class="border-t border-border transition-colors cursor-pointer"
                      [class.bg-accent-soft]="selectedUser()?.id === user.id"
                      [class.hover:bg-bg-elevated/60]="selectedUser()?.id !== user.id">
                    <td class="px-5 py-3.5">
                      <div class="flex items-center gap-2.5">
                        @if (user.avatarUrl) {
                          <img [src]="user.avatarUrl" alt=""
                            class="w-8 h-8 rounded-full object-cover shrink-0 border border-border" />
                        } @else {
                          <div class="w-8 h-8 rounded-full bg-bg-elevated border border-border
                                      flex items-center justify-center shrink-0">
                            <ng-icon name="lucideUser" size="14" class="text-text-muted" />
                          </div>
                        }
                        <div>
                          <p class="font-semibold text-text-primary">{{ user.firstName }} {{ user.lastName }}</p>
                          <p class="text-[12px] text-text-muted font-mono mt-0.5">{{ user.email }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-5 py-3.5 hidden md:table-cell text-text-secondary text-[12px]">
                      {{ roleLabel(user.role) }}
                    </td>
                    <td class="px-5 py-3.5">
                      <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap"
                        [style.color]="statusMeta(user.status).color"
                        [style.background]="statusMeta(user.status).bg"
                        [style.border-color]="statusMeta(user.status).border">
                        {{ statusMeta(user.status).label }}
                      </span>
                    </td>
                    <td class="px-5 py-3.5">
                      <div class="flex flex-col items-end gap-0.5">
                        @if (user.status === 'INACTIVE') {
                          <button disabled
                            class="relative inline-flex h-[22px] w-10 shrink-0 rounded-full border-2 border-transparent
                                   opacity-35 cursor-not-allowed"
                            style="background: var(--color-border)">
                            <span class="pointer-events-none inline-block h-[14px] w-[14px] rounded-full
                                         bg-white shadow-sm mt-[1px]" style="transform:translateX(1px)"></span>
                          </button>
                          <span class="text-[10px] font-medium" style="color:var(--color-warning)">Inactivo</span>
                        } @else {
                          <button
                            (click)="toggleUser(user); $event.stopPropagation()"
                            [disabled]="processing() === user.id"
                            class="relative inline-flex h-[22px] w-10 shrink-0 rounded-full border-2 border-transparent
                                   transition-colors duration-200 focus:outline-none disabled:opacity-60"
                            [style.background]="user.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-border)'"
                            [style.box-shadow]="user.status === 'ACTIVE' ? '0 0 10px rgba(0,200,120,0.4)' : 'none'"
                            [attr.title]="user.status === 'ACTIVE' ? 'Suspender usuario' : 'Reactivar usuario'"
                            role="switch" [attr.aria-checked]="user.status === 'ACTIVE'">
                            @if (processing() === user.id) {
                              <span class="absolute inset-0 flex items-center justify-center">
                                <ng-icon name="lucideRefreshCw" size="10" class="neo-spin text-white" />
                              </span>
                            } @else {
                              <span class="pointer-events-none inline-block h-[14px] w-[14px] rounded-full
                                           bg-white shadow-sm transform transition-transform duration-200 mt-[1px]"
                                    [style.transform]="user.status === 'ACTIVE' ? 'translateX(20px)' : 'translateX(1px)'">
                              </span>
                            }
                          </button>
                          <span class="text-[10px] font-medium"
                                [style.color]="user.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-error)'">
                            {{ user.status === 'ACTIVE' ? 'Activo' : 'Suspendido' }}
                          </span>
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
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private router       = inject(Router);
  private fb           = inject(FormBuilder);

  users        = signal<UserResponse[]>([]);
  loading      = signal(true);
  page         = signal(0);
  totalPages   = signal(0);
  activeFilter = signal<UserStatus | undefined>(undefined);
  processing   = signal<string | null>(null);
  selectedUser = signal<UserResponse | null>(null);
  composing    = signal(false);
  composeError = signal<string | null>(null);
  sending      = signal(false);

  composeForm = this.fb.nonNullable.group({
    message: ['', [Validators.required, Validators.minLength(5)]],
  });

  openCompose(): void {
    this.composeError.set(null);
    this.composeForm.reset();
    this.composing.set(true);
  }

  sendMessage(): void {
    const user = this.selectedUser();
    if (!user || this.composeForm.invalid) return;
    this.sending.set(true);
    this.composeError.set(null);
    this.adminService.startConversationWithUser(user.id, this.composeForm.getRawValue().message).subscribe({
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

  readonly filters: { label: string; value: UserStatus | undefined }[] = [
    { label: 'Todos',       value: undefined    },
    { label: 'Activos',     value: 'ACTIVE'     },
    { label: 'Inactivos',   value: 'INACTIVE'   },
    { label: 'Suspendidos', value: 'SUSPENDED'  },
  ];

  statusMeta(s: UserStatus): StatusMeta { return STATUS_MAP[s] ?? STATUS_MAP.ACTIVE; }
  roleLabel(r: string): string { return ROLE_LABEL[r] ?? r; }

  searchQ = '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  onSearch(q: string): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page.set(0);
      this.load();
    }, 300);
  }

  clearSearch(): void {
    this.searchQ = '';
    this.page.set(0);
    this.load();
  }

  ngOnInit(): void { this.load(); }

  setFilter(value: UserStatus | undefined): void {
    this.activeFilter.set(value);
    this.page.set(0);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.adminService.getUsers(this.page(), 20, this.activeFilter(), this.searchQ || undefined).subscribe({
      next: (res) => {
        this.users.set(res.data.content);
        this.totalPages.set(res.data.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleUser(user: UserResponse): void {
    user.status === 'ACTIVE' ? this.suspend(user) : this.reactivate(user);
  }

  suspend(user: UserResponse): void {
    this.processing.set(user.id);
    this.adminService.suspendUser(user.id).subscribe({
      next: (res) => { this.users.update(list => list.map(u => u.id === user.id ? res.data : u)); this.processing.set(null); },
      error: () => this.processing.set(null),
    });
  }

  reactivate(user: UserResponse): void {
    this.processing.set(user.id);
    this.adminService.reactivateUser(user.id).subscribe({
      next: (res) => { this.users.update(list => list.map(u => u.id === user.id ? res.data : u)); this.processing.set(null); },
      error: () => this.processing.set(null),
    });
  }

  prevPage(): void { if (this.page() > 0) { this.page.update(p => p - 1); this.load(); } }
  nextPage(): void { if (this.page() + 1 < this.totalPages()) { this.page.update(p => p + 1); this.load(); } }
}
