import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';
import { AnalyticsService, AdminDashboard } from '../../core/analytics/analytics.service';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, NgIcon, CopCurrencyPipe],
  template: `
    <div class="relative">
      <!-- Ambient backdrop -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden -z-[1]">
        <div class="neo-grid-bg absolute inset-0 opacity-25"></div>
        <span class="neo-orb red"  style="width:500px;height:500px;top:-15%;right:-8%;opacity:0.12;"></span>
        <span class="neo-orb cyan" style="width:380px;height:380px;bottom:-5%;left:2%;opacity:0.09;animation-delay:2s;"></span>
      </div>

      <div class="relative max-w-[1100px] mx-auto">

        <!-- Header -->
        <div class="neo-reveal mb-7">
          <p class="neo-stat-label">Admin</p>
          <h1 class="font-display text-[32px] font-bold tracking-[-0.02em] mt-1 text-text-primary">
            Analytics global
          </h1>
        </div>

        <!-- ── Loading ────────────────────────────────────────────── -->
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

        <!-- ── Error ──────────────────────────────────────────────── -->
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

        <!-- ── Data ───────────────────────────────────────────────── -->
        } @else if (data()) {

          <!-- ── Metric cards ──────────────────────────────────────── -->
          <div class="neo-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px] mb-6">

            <!-- Ingresos este mes -->
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
              <div class="flex items-center justify-between mt-2.5">
                <span class="text-xs font-semibold text-success inline-flex items-center gap-1">
                  <ng-icon name="lucideTrendingUp" size="12" /> +18%
                </span>
                <svg width="100" height="32" viewBox="0 0 100 32" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="sg-aa-red" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#FF003C" stop-opacity="0.35"/>
                      <stop offset="100%" stop-color="#FF003C" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <path [attr.d]="sparklineArea(revenuePoints, 100, 32)" fill="url(#sg-aa-red)"/>
                  <path [attr.d]="sparklineLine(revenuePoints, 100, 32)"
                        fill="none" stroke="#FF003C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
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
              <div class="flex items-center justify-between mt-2.5">
                <span class="text-xs font-semibold inline-flex items-center gap-1" style="color:#00D4FF;">
                  <ng-icon name="lucideTrendingUp" size="12" /> +{{ data()!.usuariosNuevosEsteMes }} este mes
                </span>
                <svg width="100" height="32" viewBox="0 0 100 32" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="sg-aa-cyan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#00D4FF" stop-opacity="0.35"/>
                      <stop offset="100%" stop-color="#00D4FF" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <path [attr.d]="sparklineArea(usersPoints, 100, 32)" fill="url(#sg-aa-cyan)"/>
                  <path [attr.d]="sparklineLine(usersPoints, 100, 32)"
                        fill="none" stroke="#00D4FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>

            <!-- Órdenes este mes -->
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
              <div class="flex items-center justify-between mt-2.5">
                <span class="text-xs font-semibold text-success inline-flex items-center gap-1">
                  <ng-icon name="lucideTrendingUp" size="12" /> +9%
                </span>
                <svg width="100" height="32" viewBox="0 0 100 32" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="sg-aa-orange" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#FF8C00" stop-opacity="0.35"/>
                      <stop offset="100%" stop-color="#FF8C00" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <path [attr.d]="sparklineArea(ordersPoints, 100, 32)" fill="url(#sg-aa-orange)"/>
                  <path [attr.d]="sparklineLine(ordersPoints, 100, 32)"
                        fill="none" stroke="#FF8C00" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
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
              <div class="flex items-center justify-between mt-2.5">
                <span class="text-xs font-semibold text-success inline-flex items-center gap-1">
                  <ng-icon name="lucideTrendingUp" size="12" /> +6%
                </span>
                <svg width="100" height="32" viewBox="0 0 100 32" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="sg-aa-gold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#D4A017" stop-opacity="0.35"/>
                      <stop offset="100%" stop-color="#D4A017" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <path [attr.d]="sparklineArea(commissionPoints, 100, 32)" fill="url(#sg-aa-gold)"/>
                  <path [attr.d]="sparklineLine(commissionPoints, 100, 32)"
                        fill="none" stroke="#D4A017" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- ── Secondary stats row ───────────────────────────────── -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-[14px] mb-6 neo-reveal">

            <div class="neo-card-premium p-4 col-span-1">
              <p class="neo-stat-label mb-1.5">Ingresos totales</p>
              <p class="font-display text-[16px] font-bold text-text-primary leading-snug">
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
              <p class="font-display text-[22px] font-bold" style="color:var(--color-warning);">
                {{ data()!.vendedoresPendientesAprobacion }}
              </p>
            </div>
            <div class="neo-card-premium p-4">
              <p class="neo-stat-label mb-1.5">Catálogo activo</p>
              <p class="font-display text-[22px] font-bold text-text-primary">
                {{ data()!.totalProductosActivos }}
              </p>
              @if (data()!.productosPendientesRevision > 0) {
                <p class="text-[11px] font-mono mt-0.5" style="color:var(--color-warning);">
                  {{ data()!.productosPendientesRevision }} en revisión
                </p>
              }
            </div>
          </div>

          <!-- ── Lower grid ──────────────────────────────────────── -->
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
                            <td class="px-5 py-3">
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
              }
            </div>

            <!-- Pagos + activity -->
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

                </div>
              </div>

              <!-- Activity feed -->
              <div class="neo-card-premium p-5 neo-reveal flex-1">
                <p class="text-sm font-semibold text-text-primary mb-3.5">Actividad reciente</p>
                <div class="flex flex-col gap-3.5">
                  @for (act of activity; track $index) {
                    <div class="flex gap-2.5 items-start">
                      <div class="w-7 h-7 shrink-0 rounded-lg bg-bg-elevated border border-border
                                  flex items-center justify-center"
                           [style.color]="act.color">
                        <ng-icon [name]="act.icon" size="13" />
                      </div>
                      <div class="min-w-0">
                        <p class="text-[13px] text-text-primary leading-snug">{{ act.label }}</p>
                        <p class="text-[11px] text-text-muted mt-0.5 font-mono">{{ act.time }}</p>
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

  readonly revenuePoints    = [10, 18, 14, 22, 28, 24, 32, 36, 30, 40, 38, 46];
  readonly usersPoints      = [800,820,840,865,880,900,920,915,940,960,975,990];
  readonly ordersPoints     = [22, 28, 24, 32, 38, 35, 42, 46, 40, 50, 48, 55];
  readonly commissionPoints = [6, 10, 8, 12, 15, 13, 17, 19, 16, 21, 20, 24];

  readonly activity = [
    { icon: 'lucideUserCheck',     color: 'var(--color-success)',   label: 'Nuevo vendedor aprobado',              time: 'hace 22 min' },
    { icon: 'lucideShieldCheck',   color: 'var(--color-neon-cyan)', label: 'Producto aprobado en catálogo',        time: 'hace 45 min' },
    { icon: 'lucideTriangleAlert', color: 'var(--color-warning)',   label: '3 vendedores pendientes de revisión',  time: 'hace 2 h'    },
    { icon: 'lucideBanknote',      color: '#D4A017',                label: 'Pago de comisiones procesado',         time: 'hace 4 h'    },
    { icon: 'lucideUsers',         color: 'var(--color-accent)',    label: '+38 nuevos usuarios registrados',      time: 'hace 6 h'    },
  ];

  sparklineLine(points: number[], w = 100, h = 32): string {
    const max = Math.max(...points), min = Math.min(...points);
    const range = max - min || 1;
    const stepX = w / (points.length - 1);
    return points.map((p, i) =>
      `${i === 0 ? 'M' : 'L'}${(i * stepX).toFixed(1)},${(h - ((p - min) / range) * (h - 4) - 2).toFixed(1)}`
    ).join(' ');
  }

  sparklineArea(points: number[], w = 100, h = 32): string {
    return `${this.sparklineLine(points, w, h)} L${w},${h} L0,${h} Z`;
  }

  ngOnInit(): void {
    this.analyticsService.getAdminAnalytics().subscribe({
      next:  (res) => { this.data.set(res.data); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }
}
