import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';
import { AdminService } from '../../core/admin/admin.service';
import { AnalyticsService, AdminDashboard } from '../../core/analytics/analytics.service';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon, CopCurrencyPipe],
  template: `
    <div class="relative">
      <div class="absolute inset-0 pointer-events-none overflow-hidden -z-[1]">
        <div class="neo-grid-bg absolute inset-0 opacity-25"></div>
        <span class="neo-orb red"  style="width:440px;height:440px;top:-15%;right:-8%;opacity:0.11;"></span>
        <span class="neo-orb cyan" style="width:340px;height:340px;bottom:-5%;left:2%;opacity:0.08;animation-delay:2s;"></span>
      </div>

      <div class="relative max-w-[1100px] mx-auto">

        <!-- Header -->
        <div class="neo-reveal mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="neo-stat-label">Admin</p>
            <h1 class="font-display text-[32px] font-bold tracking-[-0.02em] mt-1 text-text-primary">
              Panel de administración
            </h1>
          </div>
          <div class="flex gap-2 shrink-0">
            <a routerLink="/admin/analytics"
               class="neo-btn-outline !text-[13px] !py-2 !px-3.5">
              <ng-icon name="lucideTrendingUp" size="14" /> Ver analytics
            </a>
          </div>
        </div>

        <!-- ── KPIs de la plataforma ──────────────────────────────── -->
        <div class="neo-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px] mb-5">

          <!-- Ingresos del mes -->
          <div class="neo-card-premium relative overflow-hidden p-5">
            <div class="absolute -top-5 -right-5 w-[100px] h-[100px] rounded-full pointer-events-none"
                 style="background:radial-gradient(circle,#FF003C,transparent 70%);opacity:.18;filter:blur(28px);"></div>
            <div class="flex items-center justify-between mb-2.5">
              <p class="neo-stat-label">Ingresos del mes</p>
              <div class="w-7 h-7 rounded-lg bg-bg-elevated border border-border flex items-center justify-center text-accent">
                <ng-icon name="lucideBanknote" size="14" />
              </div>
            </div>
            @if (loadingAnalytics()) {
              <div class="h-8 w-28 rounded bg-bg-elevated animate-pulse mb-2"></div>
              <div class="h-3 w-20 rounded bg-bg-elevated animate-pulse"></div>
            } @else {
              <p class="font-display text-[24px] font-bold tracking-[-0.01em] text-text-primary leading-none">
                {{ analytics()?.ingresosEsteMes | copCurrency }}
              </p>
              <p class="text-[11px] text-text-muted mt-2">
                Total: {{ analytics()?.ingresosTotales | copCurrency }}
              </p>
            }
          </div>

          <!-- Usuarios -->
          <div class="neo-card-premium relative overflow-hidden p-5">
            <div class="absolute -top-5 -right-5 w-[100px] h-[100px] rounded-full pointer-events-none"
                 style="background:radial-gradient(circle,#00D4FF,transparent 70%);opacity:.18;filter:blur(28px);"></div>
            <div class="flex items-center justify-between mb-2.5">
              <p class="neo-stat-label">Usuarios totales</p>
              <div class="w-7 h-7 rounded-lg bg-bg-elevated border border-border flex items-center justify-center"
                   style="color:#00D4FF;">
                <ng-icon name="lucideUsers" size="14" />
              </div>
            </div>
            @if (loadingAnalytics()) {
              <div class="h-8 w-16 rounded bg-bg-elevated animate-pulse mb-2"></div>
              <div class="h-3 w-24 rounded bg-bg-elevated animate-pulse"></div>
            } @else {
              <p class="font-display text-[30px] font-bold tracking-[-0.01em] text-text-primary">
                {{ analytics()?.totalUsuarios }}
              </p>
              @if ((analytics()?.usuariosNuevosEsteMes ?? 0) > 0) {
                <p class="text-[11px] mt-2 font-semibold inline-flex items-center gap-1" style="color:#00D4FF;">
                  <ng-icon name="lucideTrendingUp" size="11" />
                  +{{ analytics()?.usuariosNuevosEsteMes }} este mes
                </p>
              }
            }
          </div>

          <!-- Órdenes del mes -->
          <div class="neo-card-premium relative overflow-hidden p-5">
            <div class="absolute -top-5 -right-5 w-[100px] h-[100px] rounded-full pointer-events-none"
                 style="background:radial-gradient(circle,#FF8C00,transparent 70%);opacity:.18;filter:blur(28px);"></div>
            <div class="flex items-center justify-between mb-2.5">
              <p class="neo-stat-label">Órdenes del mes</p>
              <div class="w-7 h-7 rounded-lg bg-bg-elevated border border-border flex items-center justify-center"
                   style="color:#FF8C00;">
                <ng-icon name="lucideClipboardList" size="14" />
              </div>
            </div>
            @if (loadingAnalytics()) {
              <div class="h-8 w-14 rounded bg-bg-elevated animate-pulse mb-2"></div>
              <div class="h-3 w-20 rounded bg-bg-elevated animate-pulse"></div>
            } @else {
              <p class="font-display text-[30px] font-bold tracking-[-0.01em] text-text-primary">
                {{ analytics()?.ordenesEsteMes }}
              </p>
              <p class="text-[11px] text-text-muted mt-2">
                {{ analytics()?.ordenesPendientes }} pendientes · Total: {{ analytics()?.ordenesTotales }}
              </p>
            }
          </div>

          <!-- Vendedores -->
          <div class="neo-card-premium relative overflow-hidden p-5">
            <div class="absolute -top-5 -right-5 w-[100px] h-[100px] rounded-full pointer-events-none"
                 style="background:radial-gradient(circle,#D4A017,transparent 70%);opacity:.18;filter:blur(28px);"></div>
            <div class="flex items-center justify-between mb-2.5">
              <p class="neo-stat-label">Vendedores activos</p>
              <div class="w-7 h-7 rounded-lg bg-bg-elevated border border-border flex items-center justify-center"
                   style="color:#D4A017;">
                <ng-icon name="lucideStore" size="14" />
              </div>
            </div>
            @if (loadingAnalytics()) {
              <div class="h-8 w-14 rounded bg-bg-elevated animate-pulse mb-2"></div>
              <div class="h-3 w-20 rounded bg-bg-elevated animate-pulse"></div>
            } @else {
              <p class="font-display text-[30px] font-bold tracking-[-0.01em] text-text-primary">
                {{ analytics()?.totalVendedores }}
              </p>
              @if ((analytics()?.vendedoresPendientesAprobacion ?? 0) > 0) {
                <p class="text-[11px] mt-2 font-semibold inline-flex items-center gap-1"
                   style="color:var(--color-warning);">
                  <ng-icon name="lucideTriangleAlert" size="11" />
                  {{ analytics()?.vendedoresPendientesAprobacion }} en revisión
                </p>
              } @else {
                <p class="text-[11px] text-text-muted mt-2">Sin pendientes</p>
              }
            }
          </div>
        </div>

        <!-- ── Atención requerida ─────────────────────────────────── -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-[14px] mb-5 neo-reveal">

          <!-- Vendedores pendientes -->
          <div class="rounded-[14px] border p-4 flex items-center justify-between transition-colors hover:bg-bg-elevated/40"
               [style.border-color]="(pendingSellers() > 0) ? 'rgba(245,158,11,0.35)' : 'var(--color-border)'"
               [style.background]="(pendingSellers() > 0) ? 'rgba(245,158,11,0.04)' : ''">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                   [style.background]="(pendingSellers() > 0) ? 'rgba(245,158,11,0.12)' : 'var(--color-bg-elevated)'"
                   [style.color]="(pendingSellers() > 0) ? 'var(--color-warning)' : 'var(--color-text-muted)'">
                <ng-icon name="lucideUsers" size="16" />
              </div>
              <div>
                <p class="text-[13px] font-semibold text-text-primary">Vendedores pendientes</p>
                @if (loadingSellers()) {
                  <div class="h-3 w-12 rounded bg-bg-elevated animate-pulse mt-1"></div>
                } @else {
                  <p class="text-[12px] text-text-muted">{{ pendingSellers() }} esperan aprobación</p>
                }
              </div>
            </div>
            <a routerLink="/admin/sellers" [queryParams]="{status:'PENDING'}"
               class="p-2 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors">
              <ng-icon name="lucideArrowRight" size="15" />
            </a>
          </div>

          <!-- Reseñas por moderar -->
          <div class="rounded-[14px] border p-4 flex items-center justify-between transition-colors hover:bg-bg-elevated/40"
               [style.border-color]="(pendingReviews() > 0) ? 'rgba(239,68,68,0.35)' : 'var(--color-border)'"
               [style.background]="(pendingReviews() > 0) ? 'rgba(239,68,68,0.04)' : ''">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                   [style.background]="(pendingReviews() > 0) ? 'rgba(239,68,68,0.12)' : 'var(--color-bg-elevated)'"
                   [style.color]="(pendingReviews() > 0) ? 'var(--color-error)' : 'var(--color-text-muted)'">
                <ng-icon name="lucideStar" size="16" />
              </div>
              <div>
                <p class="text-[13px] font-semibold text-text-primary">Reseñas por moderar</p>
                @if (loadingReviews()) {
                  <div class="h-3 w-12 rounded bg-bg-elevated animate-pulse mt-1"></div>
                } @else {
                  <p class="text-[12px] text-text-muted">{{ pendingReviews() }} pendientes</p>
                }
              </div>
            </div>
            <a routerLink="/admin/reviews"
               class="p-2 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors">
              <ng-icon name="lucideArrowRight" size="15" />
            </a>
          </div>

          <!-- Pagos estado -->
          <div class="rounded-[14px] border border-border p-4 flex items-center justify-between hover:bg-bg-elevated/40 transition-colors">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-bg-elevated flex items-center justify-center shrink-0 text-text-muted">
                <ng-icon name="lucideBanknote" size="16" />
              </div>
              <div>
                <p class="text-[13px] font-semibold text-text-primary">Pagos este mes</p>
                @if (loadingAnalytics()) {
                  <div class="h-3 w-20 rounded bg-bg-elevated animate-pulse mt-1"></div>
                } @else {
                  <p class="text-[12px] text-text-muted">
                    <span class="text-success font-semibold">{{ analytics()?.pagosAprobadosEsteMes }}</span> aprobados ·
                    <span class="text-error font-semibold">{{ analytics()?.pagosRechazadosEsteMes }}</span> rechazados
                  </p>
                }
              </div>
            </div>
            <a routerLink="/admin/invoices"
               class="p-2 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors">
              <ng-icon name="lucideArrowRight" size="15" />
            </a>
          </div>
        </div>

        <!-- ── Vendedores en revisión ─────────────────────────────── -->
        <div class="neo-card-premium overflow-hidden neo-reveal">
          <div class="flex items-center justify-between px-5 py-4 border-b border-border">
            <p class="text-sm font-semibold text-text-primary">Vendedores en revisión</p>
            <a routerLink="/admin/sellers"
               class="neo-btn-ghost !text-xs !py-1 !px-2.5 inline-flex items-center gap-1">
              Ver todos <ng-icon name="lucideArrowRight" size="12" />
            </a>
          </div>

          @if (loadingSellers()) {
            <div class="p-4 flex flex-col gap-2">
              @for (_ of [1,2,3]; track $index) {
                <div class="h-12 rounded-xl bg-bg-elevated animate-pulse"></div>
              }
            </div>
          } @else if (recentPendingSellers().length === 0) {
            <div class="flex flex-col items-center gap-3 py-12 text-text-muted">
              <ng-icon name="lucideUserCheck" size="28" />
              <p class="text-sm">Sin vendedores pendientes. ¡Todo al día!</p>
            </div>
          } @else {
            <div>
              @for (seller of recentPendingSellers(); track seller.id; let last = $last) {
                <div class="flex items-center justify-between px-5 py-3.5 hover:bg-bg-elevated/50 transition-colors"
                     [class.border-b]="!last" [class.border-border]="!last">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-bg-elevated border border-border flex items-center justify-center shrink-0">
                      <ng-icon name="lucideStore" size="14" class="text-text-muted" />
                    </div>
                    <div>
                      <p class="text-[13px] font-semibold text-text-primary">{{ seller.storeName }}</p>
                      <p class="text-[12px] text-text-muted">{{ seller.city }}, {{ seller.department }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                          style="color:var(--color-warning);background:rgba(245,158,11,0.1);border-color:rgba(245,158,11,0.3);">
                      Pendiente
                    </span>
                    <a routerLink="/admin/sellers"
                       class="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors">
                      <ng-icon name="lucideChevronRight" size="14" />
                    </a>
                  </div>
                </div>
              }
            </div>
          }
        </div>

      </div>
    </div>
  `,
})
export class AdminHomeComponent implements OnInit {
  private adminService     = inject(AdminService);
  private analyticsService = inject(AnalyticsService);

  analytics        = signal<AdminDashboard | null>(null);
  loadingAnalytics = signal(true);

  pendingSellers       = signal(0);
  loadingSellers       = signal(true);
  recentPendingSellers = signal<any[]>([]);
  pendingReviews       = signal(0);
  loadingReviews       = signal(true);
  totalCategories      = signal(0);
  loadingCategories    = signal(true);

  ngOnInit(): void {
    this.analyticsService.getAdminAnalytics().subscribe({
      next:  res => { this.analytics.set(res.data); this.loadingAnalytics.set(false); },
      error: ()  => this.loadingAnalytics.set(false),
    });

    this.adminService.getSellers(0, 5, 'PENDING').subscribe({
      next: res => {
        this.pendingSellers.set(res.data.totalElements);
        this.recentPendingSellers.set(res.data.content);
        this.loadingSellers.set(false);
      },
      error: () => this.loadingSellers.set(false),
    });

    this.adminService.getAdminReviews(0, 1, 'PENDING').subscribe({
      next:  (res: any) => { this.pendingReviews.set(res.data.totalElements); this.loadingReviews.set(false); },
      error: ()         => this.loadingReviews.set(false),
    });

    this.adminService.getCategories().subscribe({
      next:  res => { this.totalCategories.set(res.data.length); this.loadingCategories.set(false); },
      error: ()  => this.loadingCategories.set(false),
    });
  }
}
