import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';
import { AnalyticsService, AdminDashboard } from '../../core/analytics/analytics.service';

interface StatusItem {
  icon: string;
  color: string;
  label: string;
  value: string | number;
  link?: string;
}

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon, CopCurrencyPipe],
  template: `
    <div class="relative">
      <div class="absolute inset-0 pointer-events-none overflow-hidden -z-[1]">
        <div class="neo-grid-bg absolute inset-0 opacity-25"></div>
        <span class="neo-orb red"  style="width:500px;height:500px;top:-15%;right:-8%;opacity:0.12;"></span>
        <span class="neo-orb cyan" style="width:380px;height:380px;bottom:-5%;left:2%;opacity:0.09;animation-delay:2s;"></span>
      </div>

      <div class="relative max-w-[1100px] mx-auto">

        <!-- Header -->
        <div class="neo-reveal mb-5">
          <p class="neo-stat-label">Admin</p>
          <h1 class="font-display text-[32px] font-bold tracking-[-0.02em] mt-1 text-text-primary">
            Analytics global
          </h1>
        </div>

        <!-- IA Banner -->
        <a routerLink="/admin/analytics-ai"
           class="neo-card-premium flex items-center gap-4 p-4 mb-7 hover:border-violet-500/40
                  hover:bg-violet-500/5 transition-all group cursor-pointer">
          <div class="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20
                      flex items-center justify-center shrink-0">
            <ng-icon name="lucideSparkles" size="20" class="text-violet-400" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[14px] font-semibold text-text-primary">Analytics IA</p>
            <p class="text-[12px] text-text-muted mt-0.5">
              Consulta y analiza datos del marketplace con inteligencia artificial
            </p>
          </div>
          <ng-icon name="lucideArrowRight" size="16"
                   class="text-text-muted group-hover:text-violet-400 transition-colors shrink-0" />
        </a>

        <!-- Loading -->
        @if (loading()) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px] mb-6">
            @for (_ of [1,2,3,4]; track $index) {
              <div class="h-[110px] rounded-2xl bg-bg-surface border border-border animate-pulse"></div>
            }
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-[18px]">
            <div class="h-80 rounded-2xl bg-bg-surface border border-border animate-pulse"></div>
            <div class="h-80 rounded-2xl bg-bg-surface border border-border animate-pulse"></div>
          </div>

        <!-- Error -->
        } @else if (error()) {
          <div class="neo-card-premium p-14 flex flex-col items-center gap-4 text-center">
            <div class="w-14 h-14 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center">
              <ng-icon name="lucideTriangleAlert" size="26" class="text-error" />
            </div>
            <div>
              <p class="text-base font-semibold text-text-primary">Error al cargar analíticas</p>
              <p class="text-sm text-text-muted mt-1">Intenta recargar la página.</p>
            </div>
          </div>

        <!-- Data -->
        } @else if (data()) {

          <!-- ── Metric cards ──────────────────────────────────────── -->
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
              <p class="font-display text-[22px] font-bold tracking-[-0.01em] text-text-primary leading-none">
                {{ data()!.ingresosEsteMes | copCurrency }}
              </p>
              <div class="mt-2.5">
                <p class="text-[11px] text-text-muted">
                  Total histórico: {{ data()!.ingresosTotales | copCurrency }}
                </p>
              </div>
            </div>

            <!-- Usuarios totales -->
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
              <p class="font-display text-[30px] font-bold tracking-[-0.01em] text-text-primary">
                {{ data()!.totalUsuarios }}
              </p>
              <div class="flex items-center gap-1.5 mt-2.5">
                <span class="text-xs font-semibold inline-flex items-center gap-0.5" style="color:#00D4FF;">
                  <ng-icon name="lucideTrendingUp" size="12" />
                  +{{ data()!.usuariosNuevosEsteMes }}
                </span>
                <span class="text-[11px] text-text-muted">nuevos este mes</span>
              </div>
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
              <p class="font-display text-[30px] font-bold tracking-[-0.01em] text-text-primary">
                {{ data()!.ordenesEsteMes }}
              </p>
              <div class="mt-2.5">
                <p class="text-[11px] text-text-muted">
                  {{ data()!.ordenesPendientes }} pendientes · {{ data()!.ordenesTotales }} totales
                </p>
              </div>
            </div>

            <!-- Comisiones del mes -->
            <div class="neo-card-premium relative overflow-hidden p-5">
              <div class="absolute -top-5 -right-5 w-[100px] h-[100px] rounded-full pointer-events-none"
                   style="background:radial-gradient(circle,#D4A017,transparent 70%);opacity:.18;filter:blur(28px);"></div>
              <div class="flex items-center justify-between mb-2.5">
                <p class="neo-stat-label">Comisiones del mes</p>
                <div class="w-7 h-7 rounded-lg bg-bg-elevated border border-border flex items-center justify-center"
                     style="color:#D4A017;">
                  <ng-icon name="lucideDollarSign" size="14" />
                </div>
              </div>
              <p class="font-display text-[22px] font-bold tracking-[-0.01em] text-text-primary leading-none">
                {{ data()!.comisionesEsteMes | copCurrency }}
              </p>
              <div class="mt-2.5">
                <p class="text-[11px] text-text-muted">
                  Monto aprobado: {{ data()!.montoAprobadoEsteMes | copCurrency }}
                </p>
              </div>
            </div>
          </div>

          <!-- ── Resumen plataforma ─────────────────────────────────── -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-[14px] mb-5 neo-reveal">
            <div class="neo-card-premium p-4">
              <p class="neo-stat-label mb-1.5">Ingresos totales</p>
              <p class="font-display text-[15px] font-bold text-text-primary leading-snug">
                {{ data()!.ingresosTotales | copCurrency }}
              </p>
            </div>
            <div class="neo-card-premium p-4">
              <p class="neo-stat-label mb-1.5">Órdenes totales</p>
              <p class="font-display text-[22px] font-bold text-text-primary">{{ data()!.ordenesTotales }}</p>
            </div>
            <div class="neo-card-premium p-4">
              <p class="neo-stat-label mb-1.5">Pendientes</p>
              <p class="font-display text-[22px] font-bold" style="color:var(--color-warning);">
                {{ data()!.ordenesPendientes }}
              </p>
            </div>
            <div class="neo-card-premium p-4">
              <p class="neo-stat-label mb-1.5">Vendedores</p>
              <p class="font-display text-[22px] font-bold text-text-primary">{{ data()!.totalVendedores }}</p>
            </div>
            <div class="neo-card-premium p-4">
              <p class="neo-stat-label mb-1.5">En revisión</p>
              <p class="font-display text-[22px] font-bold"
                 [style.color]="data()!.vendedoresPendientesAprobacion > 0 ? 'var(--color-warning)' : 'var(--color-text-primary)'">
                {{ data()!.vendedoresPendientesAprobacion }}
              </p>
            </div>
            <div class="neo-card-premium p-4">
              <p class="neo-stat-label mb-1.5">Catálogo activo</p>
              <p class="font-display text-[22px] font-bold text-text-primary">{{ data()!.totalProductosActivos }}</p>
              @if (data()!.productosPendientesRevision > 0) {
                <p class="text-[10px] font-mono mt-0.5" style="color:var(--color-text-muted);">
                  {{ data()!.productosPendientesRevision }} en borrador
                </p>
              }
            </div>
          </div>

          <!-- ── Lower grid ──────────────────────────────────────────── -->
          <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-[18px]">

            <!-- Top productos -->
            <div class="flex flex-col gap-[18px]">
              @if (data()!.topProductos.length) {
                <div class="neo-card-premium overflow-hidden neo-reveal">
                  <div class="flex items-center justify-between px-5 py-4 border-b border-border">
                    <p class="text-sm font-semibold text-text-primary flex items-center gap-2">
                      <ng-icon name="lucideTrendingUp" size="15" class="text-accent" />
                      Top productos globales
                    </p>
                  </div>
                  <div class="overflow-x-auto">
                    <table class="w-full text-[13px] border-collapse">
                      <thead>
                        <tr class="bg-bg-elevated">
                          @for (h of ['#','Producto','Unidades','Órdenes','Ingresos']; track h) {
                            <th class="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]
                                       text-text-muted font-mono whitespace-nowrap last:text-right">{{ h }}</th>
                          }
                        </tr>
                      </thead>
                      <tbody>
                        @for (p of data()!.topProductos; track p.productId; let i = $index) {
                          <tr class="border-t border-border transition-colors hover:bg-bg-elevated/60">
                            <td class="px-5 py-3 w-8">
                              <span class="w-5 h-5 rounded-full bg-bg-elevated border border-border text-[11px]
                                           font-mono font-bold text-text-muted flex items-center justify-center">
                                {{ i + 1 }}
                              </span>
                            </td>
                            <td class="px-5 py-3 text-text-primary font-medium">{{ p.productName }}</td>
                            <td class="px-5 py-3 text-text-secondary tabular-nums">{{ p.unidadesVendidas }}</td>
                            <td class="px-5 py-3 text-text-secondary tabular-nums">{{ p.ordenes }}</td>
                            <td class="px-5 py-3 font-semibold text-text-primary text-right tabular-nums">
                              {{ p.ingresosTotales | copCurrency }}
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              } @else {
                <div class="neo-card-premium p-10 flex flex-col items-center gap-3 text-center neo-reveal">
                  <ng-icon name="lucidePackage" size="28" class="text-text-muted" />
                  <p class="text-sm text-text-muted">Sin datos de productos vendidos aún</p>
                </div>
              }
            </div>

            <!-- Pagos + estado plataforma -->
            <div class="flex flex-col gap-[18px]">

              <!-- Pagos del mes -->
              <div class="neo-card-premium p-5 neo-reveal">
                <p class="text-sm font-semibold text-text-primary mb-4">Pagos este mes</p>
                <div class="flex flex-col gap-3">
                  <div class="flex items-center justify-between p-3 rounded-[10px] bg-success/8 border border-success/20">
                    <div>
                      <p class="text-[12px] font-semibold text-success">Aprobados</p>
                      <p class="text-[11px] text-text-muted mt-0.5 tabular-nums">
                        {{ data()!.montoAprobadoEsteMes | copCurrency }}
                      </p>
                    </div>
                    <p class="font-display text-[24px] font-bold text-success tabular-nums">
                      {{ data()!.pagosAprobadosEsteMes }}
                    </p>
                  </div>
                  <div class="flex items-center justify-between p-3 rounded-[10px] bg-error/8 border border-error/20">
                    <div>
                      <p class="text-[12px] font-semibold text-error">Rechazados</p>
                      <p class="text-[11px] text-text-muted mt-0.5">este mes</p>
                    </div>
                    <p class="font-display text-[24px] font-bold text-error tabular-nums">
                      {{ data()!.pagosRechazadosEsteMes }}
                    </p>
                  </div>
                  <!-- Tasa de éxito -->
                  @if (paymentTotal() > 0) {
                    <div class="pt-1">
                      <div class="flex items-center justify-between text-[12px] mb-1.5">
                        <span class="text-text-muted">Tasa de aprobación</span>
                        <span class="font-semibold text-success">{{ approvalRate() }}%</span>
                      </div>
                      <div class="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                        <div class="h-full rounded-full bg-success transition-all duration-700"
                             [style.width]="approvalRate() + '%'"></div>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Estado de la plataforma (datos reales) -->
              <div class="neo-card-premium p-5 neo-reveal flex-1">
                <p class="text-sm font-semibold text-text-primary mb-3.5">Estado de la plataforma</p>
                <div class="flex flex-col gap-3">
                  @for (item of statusItems(); track item.label) {
                    <div class="flex items-start gap-2.5">
                      <div class="w-7 h-7 shrink-0 rounded-lg bg-bg-elevated border border-border
                                  flex items-center justify-center"
                           [style.color]="item.color">
                        <ng-icon [name]="item.icon" size="13" />
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center justify-between gap-2">
                          <p class="text-[13px] text-text-primary leading-snug">{{ item.label }}</p>
                          <p class="text-[13px] font-bold tabular-nums shrink-0" [style.color]="item.color">
                            {{ item.value }}
                          </p>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>

            </div>
          </div>
        }

      </div>
    </div>
  `,
})
export class AdminAnalyticsComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  data    = signal<AdminDashboard | null>(null);
  loading = signal(true);
  error   = signal(false);

  paymentTotal  = computed(() => (this.data()?.pagosAprobadosEsteMes ?? 0) + (this.data()?.pagosRechazadosEsteMes ?? 0));
  approvalRate  = computed(() => {
    const total = this.paymentTotal();
    if (total === 0) return 0;
    return Math.round(((this.data()!.pagosAprobadosEsteMes) / total) * 100);
  });

  statusItems = computed((): StatusItem[] => {
    const d = this.data();
    if (!d) return [];
    return [
      {
        icon:  'lucideUsers',
        color: 'var(--color-neon-cyan)',
        label: 'Usuarios registrados',
        value: d.totalUsuarios,
      },
      {
        icon:  'lucideStore',
        color: d.vendedoresPendientesAprobacion > 0 ? 'var(--color-warning)' : 'var(--color-success)',
        label: d.vendedoresPendientesAprobacion > 0
          ? `${d.vendedoresPendientesAprobacion} vendedor(es) en revisión`
          : 'Vendedores sin pendientes',
        value: d.totalVendedores,
      },
      {
        icon:  'lucidePackage',
        color: 'var(--color-success)',
        label: d.productosPendientesRevision > 0
          ? `${d.productosPendientesRevision} producto(s) en borrador`
          : 'Catálogo sin borradores',
        value: d.totalProductosActivos,
      },
      {
        icon:  'lucideClipboardList',
        color: d.ordenesPendientes > 0 ? 'var(--color-warning)' : 'var(--color-success)',
        label: d.ordenesPendientes > 0 ? 'Órdenes pendientes' : 'Sin órdenes pendientes',
        value: d.ordenesPendientes,
      },
    ];
  });

  ngOnInit(): void {
    this.analyticsService.getAdminAnalytics().subscribe({
      next:  res => { this.data.set(res.data); this.loading.set(false); },
      error: ()  => { this.error.set(true); this.loading.set(false); },
    });
  }
}
