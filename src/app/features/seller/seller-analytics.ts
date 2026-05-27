import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';
import { AnalyticsService, SellerDashboard } from '../../core/analytics/analytics.service';
import { SellerBiChatComponent } from './analytics/seller-bi-chat.component';

@Component({
  selector: 'app-seller-analytics',
  standalone: true,
  imports: [CommonModule, NgIcon, CopCurrencyPipe, SellerBiChatComponent],
  template: `
    <div class="relative">
      <!-- Ambient backdrop -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden -z-[1]">
        <div class="neo-grid-bg absolute inset-0 opacity-25"></div>
        <span class="neo-orb red"  style="width:480px;height:480px;top:-15%;right:-8%;opacity:0.12;"></span>
        <span class="neo-orb cyan" style="width:360px;height:360px;bottom:-5%;left:2%;opacity:0.09;animation-delay:2s;"></span>
      </div>

      <div class="relative max-w-[1100px] mx-auto">

        <!-- Header -->
        <div class="neo-reveal mb-7">
          <p class="neo-stat-label">Seller</p>
          <h1 class="font-display text-[32px] font-bold tracking-[-0.02em] mt-1 text-text-primary">
            Analíticas de tu tienda
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
            <div class="h-72 rounded-2xl bg-bg-surface border border-border animate-pulse"></div>
            <div class="h-72 rounded-2xl bg-bg-surface border border-border animate-pulse"></div>
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

          <!-- Metric cards -->
          <div class="neo-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px] mb-6">

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
              <p class="font-display text-[26px] font-bold tracking-[-0.01em] text-text-primary leading-none">
                {{ data()!.ingresosEsteMes | copCurrency }}
              </p>
              <div class="flex items-center justify-between mt-2.5">
                <span class="text-xs text-text-muted">
                  Ant: {{ data()!.ingresosMesAnterior | copCurrency }}
                </span>
                <svg width="100" height="32" viewBox="0 0 100 32" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="sg-sa-red" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#FF003C" stop-opacity="0.35"/>
                      <stop offset="100%" stop-color="#FF003C" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <path [attr.d]="sparklineArea(revenuePoints, 100, 32)" fill="url(#sg-sa-red)"/>
                  <path [attr.d]="sparklineLine(revenuePoints, 100, 32)"
                        fill="none" stroke="#FF003C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>

            <!-- Órdenes del mes -->
            <div class="neo-card-premium relative overflow-hidden p-5">
              <div class="absolute -top-5 -right-5 w-[100px] h-[100px] rounded-full pointer-events-none"
                   style="background:radial-gradient(circle,#00D4FF,transparent 70%);opacity:.18;filter:blur(28px);"></div>
              <div class="flex items-center justify-between mb-2.5">
                <p class="neo-stat-label">Órdenes del mes</p>
                <div class="w-7 h-7 rounded-lg bg-bg-elevated border border-border flex items-center justify-center"
                     style="color:#00D4FF;">
                  <ng-icon name="lucideClipboardList" size="14" />
                </div>
              </div>
              <p class="font-display text-[30px] font-bold tracking-[-0.01em] text-text-primary">
                {{ data()!.ordenesEsteMes }}
              </p>
              <div class="flex items-center justify-between mt-2.5">
                <span class="text-xs text-text-muted">
                  Ant: {{ data()!.ordenesMesAnterior }}
                </span>
                <svg width="100" height="32" viewBox="0 0 100 32" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="sg-sa-cyan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#00D4FF" stop-opacity="0.35"/>
                      <stop offset="100%" stop-color="#00D4FF" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <path [attr.d]="sparklineArea(ordersPoints, 100, 32)" fill="url(#sg-sa-cyan)"/>
                  <path [attr.d]="sparklineLine(ordersPoints, 100, 32)"
                        fill="none" stroke="#00D4FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>

            <!-- Unidades vendidas -->
            <div class="neo-card-premium relative overflow-hidden p-5">
              <div class="absolute -top-5 -right-5 w-[100px] h-[100px] rounded-full pointer-events-none"
                   style="background:radial-gradient(circle,#FF8C00,transparent 70%);opacity:.18;filter:blur(28px);"></div>
              <div class="flex items-center justify-between mb-2.5">
                <p class="neo-stat-label">Unidades vendidas</p>
                <div class="w-7 h-7 rounded-lg bg-bg-elevated border border-border flex items-center justify-center"
                     style="color:#FF8C00;">
                  <ng-icon name="lucidePackage" size="14" />
                </div>
              </div>
              <p class="font-display text-[30px] font-bold tracking-[-0.01em] text-text-primary">
                {{ data()!.unidadesVendidasEsteMes }}
              </p>
              <div class="flex items-center justify-between mt-2.5">
                <span class="text-xs text-text-muted font-semibold"
                      style="color:#FF8C00;">este mes</span>
                <svg width="100" height="32" viewBox="0 0 100 32" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="sg-sa-orange" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#FF8C00" stop-opacity="0.35"/>
                      <stop offset="100%" stop-color="#FF8C00" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <path [attr.d]="sparklineArea(unitsPoints, 100, 32)" fill="url(#sg-sa-orange)"/>
                  <path [attr.d]="sparklineLine(unitsPoints, 100, 32)"
                        fill="none" stroke="#FF8C00" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>

            <!-- Calificación -->
            <div class="neo-card-premium relative overflow-hidden p-5">
              <div class="absolute -top-5 -right-5 w-[100px] h-[100px] rounded-full pointer-events-none"
                   style="background:radial-gradient(circle,#D4A017,transparent 70%);opacity:.18;filter:blur(28px);"></div>
              <div class="flex items-center justify-between mb-2.5">
                <p class="neo-stat-label">Calificación</p>
                <div class="w-7 h-7 rounded-lg bg-bg-elevated border border-border flex items-center justify-center"
                     style="color:#D4A017;">
                  <ng-icon name="lucideStar" size="14" />
                </div>
              </div>
              <div class="flex items-baseline gap-1.5">
                <p class="font-display text-[30px] font-bold tracking-[-0.01em]" style="color:#D4A017;">
                  {{ data()!.promedioCalificacion | number:'1.1-1' }}
                </p>
                <span class="text-sm text-text-muted">/ 5</span>
              </div>
              <div class="flex items-center justify-between mt-2.5">
                <span class="text-xs text-text-muted">{{ data()!.totalResenas }} reseñas</span>
                <svg width="100" height="32" viewBox="0 0 100 32" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="sg-sa-gold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#D4A017" stop-opacity="0.35"/>
                      <stop offset="100%" stop-color="#D4A017" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <path [attr.d]="sparklineArea(ratingPoints, 100, 32)" fill="url(#sg-sa-gold)"/>
                  <path [attr.d]="sparklineLine(ratingPoints, 100, 32)"
                        fill="none" stroke="#D4A017" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- ── Lower grid ──────────────────────────────────────── -->
          <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-[18px] mb-6">

            <!-- Acumulados + Top productos -->
            <div class="flex flex-col gap-[18px]">

              <!-- Totales acumulados -->
              <div class="grid grid-cols-2 gap-[18px]">
                <div class="neo-card-premium p-5 neo-reveal">
                  <p class="neo-stat-label mb-2">Ingresos totales</p>
                  <p class="font-display text-[24px] font-bold tracking-[-0.01em] text-text-primary">
                    {{ data()!.ingresosTotales | copCurrency }}
                  </p>
                  <span class="text-xs font-semibold text-success inline-flex items-center gap-1 mt-1.5">
                    <ng-icon name="lucideTrendingUp" size="12" /> Acumulado
                  </span>
                </div>
                <div class="neo-card-premium p-5 neo-reveal">
                  <p class="neo-stat-label mb-2">Órdenes totales</p>
                  <p class="font-display text-[30px] font-bold tracking-[-0.01em] text-text-primary">
                    {{ data()!.ordenesTotales }}
                  </p>
                  <span class="text-xs font-semibold text-success inline-flex items-center gap-1 mt-1.5">
                    <ng-icon name="lucideTrendingUp" size="12" /> Todas las épocas
                  </span>
                </div>
              </div>

              <!-- Top productos -->
              @if (data()!.topProductos.length) {
                <div class="neo-card-premium overflow-hidden neo-reveal">
                  <div class="flex items-center justify-between px-5 py-4 border-b border-border">
                    <p class="text-sm font-semibold text-text-primary flex items-center gap-2">
                      <ng-icon name="lucideTrendingUp" size="15" class="text-accent" />
                      Top productos
                    </p>
                  </div>
                  <div class="overflow-x-auto">
                    <table class="w-full text-[13px] border-collapse">
                      <thead>
                        <tr class="bg-bg-elevated">
                          @for (h of ['Producto','Unidades','Órdenes','Ingresos']; track h) {
                            <th class="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]
                                       text-text-muted font-mono whitespace-nowrap last:text-right">{{ h }}</th>
                          }
                        </tr>
                      </thead>
                      <tbody>
                        @for (p of data()!.topProductos; track p.productId; let i = $index) {
                          <tr class="border-t border-border transition-colors hover:bg-bg-elevated/60">
                            <td class="px-5 py-3 text-text-primary flex items-center gap-2">
                              <span class="w-5 h-5 rounded-full bg-bg-elevated border border-border text-[11px]
                                           font-mono font-bold text-text-muted flex items-center justify-center shrink-0">
                                {{ i + 1 }}
                              </span>
                              {{ p.productName }}
                            </td>
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

            <!-- Estado de órdenes + actividad -->
            <div class="flex flex-col gap-[18px]">

              <!-- Estado de órdenes -->
              <div class="neo-card-premium p-5 neo-reveal">
                <p class="text-sm font-semibold text-text-primary mb-4">Estado de órdenes</p>
                <div class="flex flex-col gap-3">
                  @for (row of orderStatusRows; track row.label) {
                    <div class="flex items-center gap-3">
                      <div class="flex-1 flex items-center justify-between text-[13px]">
                        <span [style.color]="row.color" class="font-medium">{{ row.label }}</span>
                        <span class="font-bold text-text-primary tabular-nums">{{ row.value() }}</span>
                      </div>
                    </div>
                    <!-- Mini bar -->
                    <div class="h-1 rounded-full bg-bg-elevated overflow-hidden -mt-1.5">
                      <div class="h-full rounded-full transition-all duration-700"
                           [style.background]="row.color"
                           [style.width]="barWidth(row.value()) + '%'"></div>
                    </div>
                  }
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

          <!-- ── Asistente BI ──────────────────────────────────── -->
          <div class="mt-2 neo-reveal">
            <div class="flex items-center gap-2 mb-4">
              <ng-icon name="lucideSparkles" size="16" class="text-violet-400" />
              <h2 class="text-sm font-semibold text-text-primary">Asistente de inteligencia de negocio</h2>
              <span class="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-medium">IA</span>
            </div>
            <app-seller-bi-chat />
          </div>
        }

      </div>
    </div>
  `,
})
export class SellerAnalyticsComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  data    = signal<SellerDashboard | null>(null);
  loading = signal(true);
  error   = signal(false);

  readonly revenuePoints = [8, 14, 11, 16, 22, 19, 24, 28, 26, 32, 30, 38];
  readonly ordersPoints  = [18, 22, 20, 24, 28, 26, 30, 29, 32, 34, 33, 36];
  readonly unitsPoints   = [30, 28, 35, 32, 38, 40, 37, 42, 44, 41, 46, 48];
  readonly ratingPoints  = [45, 46, 46, 47, 47, 47, 48, 48, 47, 48, 48, 48];

  get orderStatusRows() {
    return [
      { label: 'Pendientes',      color: 'var(--color-warning)',   value: () => this.data()?.ordenesPendientes ?? 0     },
      { label: 'En preparación',  color: 'var(--color-neon-cyan)', value: () => this.data()?.ordenesEnPreparacion ?? 0  },
      { label: 'Enviadas',        color: 'var(--color-accent)',    value: () => this.data()?.ordenesEnviadas ?? 0       },
    ];
  }

  barWidth(val: number): number {
    const d = this.data();
    if (!d) return 0;
    const max = Math.max(d.ordenesPendientes, d.ordenesEnPreparacion, d.ordenesEnviadas, 1);
    return Math.round((val / max) * 100);
  }

  readonly activity = [
    { icon: 'lucideCheck',         color: 'var(--color-success)',   label: 'Orden marcada como entregada',         time: 'hace 14 min' },
    { icon: 'lucidePackage',       color: 'var(--color-neon-cyan)', label: 'Inventario actualizado en tu tienda',  time: 'hace 1 h'    },
    { icon: 'lucideStar',          color: '#D4A017',                label: 'Nueva reseña 5★ en tu tienda',         time: 'hace 3 h'    },
    { icon: 'lucideTriangleAlert', color: 'var(--color-warning)',   label: 'Stock bajo: revisar inventario',       time: 'hace 5 h'    },
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
    this.analyticsService.getSellerAnalytics().subscribe({
      next:  (res) => { this.data.set(res.data); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }
}
