import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';
import { AnalyticsService, SellerDashboard } from '../../core/analytics/analytics.service';
import { SellerOrderService, SellerOrderSummary } from '../../core/seller/seller-order.service';
import { SellerBiChatComponent } from './analytics/seller-bi-chat.component';

const ACTIVITY_META: Record<string, { icon: string; color: string; label: string }> = {
  PENDING:   { icon: 'lucideShoppingBag', color: 'var(--color-warning)',   label: 'Nueva orden' },
  CONFIRMED: { icon: 'lucideCheck',       color: 'var(--color-success)',   label: 'Orden confirmada' },
  PREPARING: { icon: 'lucidePackage',     color: 'var(--color-neon-cyan)', label: 'En preparación' },
  SHIPPED:   { icon: 'lucideTruck',       color: 'var(--color-accent)',    label: 'Enviada' },
  DELIVERED: { icon: 'lucideCheckCheck',  color: 'var(--color-success)',   label: 'Entregada' },
  CANCELLED: { icon: 'lucideXCircle',     color: 'var(--color-error)',     label: 'Cancelada' },
};

@Component({
  selector: 'app-seller-analytics',
  standalone: true,
  imports: [CommonModule, NgIcon, CopCurrencyPipe, SellerBiChatComponent],
  template: `
    <div class="relative">
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

        <!-- Loading -->
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
              <p class="font-display text-[26px] font-bold tracking-[-0.01em] text-text-primary leading-none">
                {{ data()!.ingresosEsteMes | copCurrency }}
              </p>
              <div class="flex items-center gap-2 mt-2.5">
                @if (revenuePct() !== null) {
                  <span class="text-xs font-semibold inline-flex items-center gap-0.5"
                        [class.text-success]="revenuePct()! >= 0"
                        [class.text-error]="revenuePct()! < 0">
                    <ng-icon [name]="revenuePct()! >= 0 ? 'lucideTrendingUp' : 'lucideTrendingDown'" size="12" />
                    {{ revenuePct()! >= 0 ? '+' : '' }}{{ revenuePct() }}%
                  </span>
                  <span class="text-[11px] text-text-muted">vs mes ant.</span>
                } @else {
                  <span class="text-[11px] text-text-muted">Ant: {{ data()!.ingresosMesAnterior | copCurrency }}</span>
                }
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
              <div class="flex items-center gap-2 mt-2.5">
                @if (ordersPct() !== null) {
                  <span class="text-xs font-semibold inline-flex items-center gap-0.5"
                        [class.text-success]="ordersPct()! >= 0"
                        [class.text-error]="ordersPct()! < 0">
                    <ng-icon [name]="ordersPct()! >= 0 ? 'lucideTrendingUp' : 'lucideTrendingDown'" size="12" />
                    {{ ordersPct()! >= 0 ? '+' : '' }}{{ ordersPct() }}%
                  </span>
                  <span class="text-[11px] text-text-muted">vs mes ant.</span>
                } @else {
                  <span class="text-[11px] text-text-muted">Ant: {{ data()!.ordenesMesAnterior }}</span>
                }
              </div>
            </div>

            <!-- Unidades vendidas -->
            <div class="neo-card-premium relative overflow-hidden p-5">
              <div class="absolute -top-5 -right-5 w-[100px] h-[100px] rounded-full pointer-events-none"
                   style="background:radial-gradient(circle,#FF8C00,transparent 70%);opacity:.18;filter:blur(28px);"></div>
              <div class="flex items-center justify-between mb-2.5">
                <p class="neo-stat-label">Unidades este mes</p>
                <div class="w-7 h-7 rounded-lg bg-bg-elevated border border-border flex items-center justify-center"
                     style="color:#FF8C00;">
                  <ng-icon name="lucidePackage" size="14" />
                </div>
              </div>
              <p class="font-display text-[30px] font-bold tracking-[-0.01em] text-text-primary">
                {{ data()!.unidadesVendidasEsteMes }}
              </p>
              <div class="mt-2.5">
                <span class="text-[11px] text-text-muted">Total histórico: {{ data()!.ordenesTotales }} órdenes</span>
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
              @if (data()!.totalResenas > 0) {
                <div class="flex items-baseline gap-1.5">
                  <p class="font-display text-[30px] font-bold tracking-[-0.01em]" style="color:#D4A017;">
                    {{ data()!.promedioCalificacion | number:'1.1-1' }}
                  </p>
                  <span class="text-sm text-text-muted">/ 5</span>
                </div>
                <div class="flex items-center gap-2 mt-2.5">
                  <!-- Stars visual -->
                  <div class="flex gap-0.5">
                    @for (i of [1,2,3,4,5]; track i) {
                      <ng-icon name="lucideStar" size="11"
                        [class.text-star]="i <= roundedRating()"
                        [class.text-border-strong]="i > roundedRating()" />
                    }
                  </div>
                  <span class="text-[11px] text-text-muted">{{ data()!.totalResenas }} reseñas</span>
                </div>
              } @else {
                <p class="font-display text-[28px] font-bold text-text-muted">—</p>
                <p class="text-[11px] text-text-muted mt-2">Sin reseñas aún</p>
              }
            </div>
          </div>

          <!-- ── Totales históricos ─────────────────────────────────── -->
          <div class="grid grid-cols-2 gap-[18px] mb-5 neo-reveal">
            <div class="neo-card-premium p-5 flex items-center justify-between">
              <div>
                <p class="neo-stat-label mb-1.5">Ingresos totales históricos</p>
                <p class="font-display text-[24px] font-bold tracking-[-0.01em] text-text-primary">
                  {{ data()!.ingresosTotales | copCurrency }}
                </p>
              </div>
              <ng-icon name="lucideBanknote" size="28" class="text-accent opacity-20 shrink-0" />
            </div>
            <div class="neo-card-premium p-5 flex items-center justify-between">
              <div>
                <p class="neo-stat-label mb-1.5">Órdenes totales históricas</p>
                <p class="font-display text-[30px] font-bold tracking-[-0.01em] text-text-primary">
                  {{ data()!.ordenesTotales }}
                </p>
              </div>
              <ng-icon name="lucideClipboardList" size="28" class="text-neon-cyan opacity-20 shrink-0" />
            </div>
          </div>

          <!-- ── Lower grid ──────────────────────────────────────────── -->
          <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-[18px] mb-6">

            <!-- Top productos -->
            @if (data()!.topProductos.length) {
              <div class="neo-card-premium overflow-hidden neo-reveal">
                <div class="flex items-center justify-between px-5 py-4 border-b border-border">
                  <p class="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <ng-icon name="lucideTrendingUp" size="15" class="text-accent" />
                    Productos más vendidos
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
                <p class="text-sm text-text-muted">Sin ventas registradas aún</p>
              </div>
            }

            <!-- Estado de órdenes + actividad real -->
            <div class="flex flex-col gap-[18px]">

              <!-- Estado de órdenes -->
              <div class="neo-card-premium p-5 neo-reveal">
                <p class="text-sm font-semibold text-text-primary mb-4">Estado de órdenes activas</p>
                <div class="flex flex-col gap-3.5">
                  @for (row of orderStatusRows; track row.label) {
                    <div>
                      <div class="flex items-center justify-between text-[13px] mb-1.5">
                        <span [style.color]="row.color" class="font-medium">{{ row.label }}</span>
                        <span class="font-bold text-text-primary tabular-nums">{{ row.value() }}</span>
                      </div>
                      <div class="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-700"
                             [style.background]="row.color"
                             [style.width]="barWidth(row.value()) + '%'"></div>
                      </div>
                    </div>
                  }
                  @if (totalActiveOrders() === 0) {
                    <p class="text-[12px] text-text-muted text-center py-2">Sin órdenes activas</p>
                  }
                </div>
              </div>

              <!-- Actividad reciente (desde órdenes reales) -->
              <div class="neo-card-premium p-5 neo-reveal flex-1">
                <p class="text-sm font-semibold text-text-primary mb-3.5">Actividad reciente</p>
                @if (loadingOrders()) {
                  <div class="flex flex-col gap-3">
                    @for (_ of [1,2,3]; track $index) {
                      <div class="flex gap-2.5 items-center">
                        <div class="w-7 h-7 rounded-lg bg-bg-elevated animate-pulse shrink-0"></div>
                        <div class="flex-1 flex flex-col gap-1">
                          <div class="h-3 rounded bg-bg-elevated animate-pulse w-3/4"></div>
                          <div class="h-2.5 rounded bg-bg-elevated animate-pulse w-1/3"></div>
                        </div>
                      </div>
                    }
                  </div>
                } @else if (activityItems().length === 0) {
                  <div class="flex flex-col items-center gap-2 py-6 text-center">
                    <ng-icon name="lucideActivity" size="22" class="text-text-muted" />
                    <p class="text-[12px] text-text-muted">Sin actividad registrada</p>
                  </div>
                } @else {
                  <div class="flex flex-col gap-3.5 max-h-[260px] overflow-y-auto">
                    @for (act of activityItems(); track $index) {
                      <div class="flex gap-2.5 items-start shrink-0">
                        <div class="w-7 h-7 shrink-0 rounded-lg bg-bg-elevated border border-border
                                    flex items-center justify-center"
                             [style.color]="act.color">
                          <ng-icon [name]="act.icon" size="13" />
                        </div>
                        <div class="min-w-0">
                          <p class="text-[13px] text-text-primary leading-snug truncate">{{ act.label }}</p>
                          <p class="text-[11px] text-text-muted mt-0.5 font-mono">{{ act.time }}</p>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>

            </div>
          </div>

          <!-- ── Asistente BI ──────────────────────────────────────── -->
          <div class="neo-reveal">
            <div class="flex items-center gap-2 mb-4">
              <ng-icon name="lucideSparkles" size="16" class="text-violet-400" />
              <h2 class="text-sm font-semibold text-text-primary">Asistente de inteligencia de negocio</h2>
              <span class="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400
                           border border-violet-500/20 font-medium">IA</span>
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
  private orderService     = inject(SellerOrderService);

  data         = signal<SellerDashboard | null>(null);
  loading      = signal(true);
  error        = signal(false);
  recentOrders = signal<SellerOrderSummary[]>([]);
  loadingOrders = signal(true);

  revenuePct = computed(() => {
    const d = this.data();
    if (!d || d.ingresosMesAnterior === 0) return null;
    return Math.round(((d.ingresosEsteMes - d.ingresosMesAnterior) / d.ingresosMesAnterior) * 100);
  });

  ordersPct = computed(() => {
    const d = this.data();
    if (!d || d.ordenesMesAnterior === 0) return null;
    return Math.round(((d.ordenesEsteMes - d.ordenesMesAnterior) / d.ordenesMesAnterior) * 100);
  });

  roundedRating = computed(() => Math.round(this.data()?.promedioCalificacion ?? 0));

  totalActiveOrders = computed(() => {
    const d = this.data();
    if (!d) return 0;
    return (d.ordenesPendientes ?? 0) + (d.ordenesEnPreparacion ?? 0) + (d.ordenesEnviadas ?? 0);
  });

  activityItems = computed(() =>
    this.recentOrders().slice(0, 10).map(o => {
      const meta = ACTIVITY_META[o.status] ?? ACTIVITY_META['PENDING'];
      return {
        icon:  meta.icon,
        color: meta.color,
        label: `${meta.label} — ${o.buyerName}`,
        time:  this.timeAgo(o.createdAt),
      };
    })
  );

  get orderStatusRows() {
    return [
      { label: 'Pendientes',     color: 'var(--color-warning)',   value: () => this.data()?.ordenesPendientes    ?? 0 },
      { label: 'En preparación', color: 'var(--color-neon-cyan)', value: () => this.data()?.ordenesEnPreparacion ?? 0 },
      { label: 'Enviadas',       color: 'var(--color-accent)',    value: () => this.data()?.ordenesEnviadas      ?? 0 },
    ];
  }

  barWidth(val: number): number {
    const d = this.data();
    if (!d) return 0;
    const max = Math.max(d.ordenesPendientes, d.ordenesEnPreparacion, d.ordenesEnviadas, 1);
    return Math.round((val / max) * 100);
  }

  ngOnInit(): void {
    this.analyticsService.getSellerAnalytics().subscribe({
      next:  res => { this.data.set(res.data); this.loading.set(false); },
      error: ()  => { this.error.set(true); this.loading.set(false); },
    });

    this.orderService.getMyOrders(0, 10).subscribe({
      next:  res => { this.recentOrders.set(res.data.content); this.loadingOrders.set(false); },
      error: ()  => this.loadingOrders.set(false),
    });
  }

  private timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'ahora';
    if (mins < 60) return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7)  return `hace ${days}d`;
    return new Date(dateStr).toLocaleDateString('es', { day: 'numeric', month: 'short' });
  }
}
