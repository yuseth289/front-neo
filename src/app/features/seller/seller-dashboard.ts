import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';
import { SellerService } from '../../core/seller/seller.service';
import { SellerProductService } from '../../core/seller/seller-product.service';
import { SellerOrderService, SellerOrderSummary } from '../../core/seller/seller-order.service';
import { AnalyticsService, SellerDashboard } from '../../core/analytics/analytics.service';
import { SellerResponse } from '../../shared/models/seller.models';

const STATUS_META: Record<string, { icon: string; color: string; label: string }> = {
  PENDING:   { icon: 'lucideShoppingBag', color: 'var(--color-warning)',   label: 'Nueva orden' },
  CONFIRMED: { icon: 'lucideCheck',       color: 'var(--color-success)',   label: 'Orden confirmada' },
  PREPARING: { icon: 'lucidePackage',     color: 'var(--color-neon-cyan)', label: 'En preparación' },
  SHIPPED:   { icon: 'lucideTruck',       color: 'var(--color-accent)',    label: 'Enviada' },
  DELIVERED: { icon: 'lucideCheckCheck',  color: 'var(--color-success)',   label: 'Entregada' },
  CANCELLED: { icon: 'lucideXCircle',     color: 'var(--color-error)',     label: 'Cancelada' },
};

const STATUS_BADGE: Record<string, { color: string; bg: string; border: string; label: string }> = {
  DELIVERED: { color: 'var(--color-success)',   bg: 'rgba(0,200,150,0.12)',  border: 'rgba(0,200,150,0.2)',  label: 'Entregada'   },
  PENDING:   { color: 'var(--color-warning)',   bg: 'rgba(255,140,0,0.12)',  border: 'rgba(255,140,0,0.2)',  label: 'Pendiente'   },
  SHIPPED:   { color: 'var(--color-neon-cyan)', bg: 'rgba(0,212,255,0.12)', border: 'rgba(0,212,255,0.2)',  label: 'Enviada'     },
  CANCELLED: { color: 'var(--color-error)',     bg: 'rgba(255,0,60,0.12)',   border: 'rgba(255,0,60,0.2)',   label: 'Cancelada'   },
  CONFIRMED: { color: 'var(--color-neon-cyan)', bg: 'rgba(0,212,255,0.12)', border: 'rgba(0,212,255,0.2)',  label: 'Confirmada'  },
  PREPARING: { color: 'var(--color-neon-cyan)', bg: 'rgba(0,212,255,0.12)', border: 'rgba(0,212,255,0.2)',  label: 'Preparando'  },
};

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon, CopCurrencyPipe],
  template: `
    <div class="relative">
      <div class="absolute inset-0 pointer-events-none overflow-hidden -z-[1]">
        <div class="neo-grid-bg absolute inset-0 opacity-25"></div>
        <span class="neo-orb red"  style="width:480px;height:480px;top:-15%;right:-8%;opacity:0.12;"></span>
        <span class="neo-orb cyan" style="width:360px;height:360px;bottom:-5%;left:2%;opacity:0.09;animation-delay:2s;"></span>
      </div>

      <div class="relative max-w-[1100px] mx-auto">

        <!-- ── Greeting ──────────────────────────────────────────── -->
        <div class="neo-reveal flex flex-wrap justify-between items-start gap-4 mb-7">
          <div>
            <p class="neo-stat-label">Bienvenido de vuelta</p>
            @if (seller()) {
              <h1 class="font-display text-[32px] font-bold tracking-[-0.02em] mt-1 text-text-primary">
                {{ seller()!.storeName }}
              </h1>
              <div class="flex flex-wrap items-center gap-2.5 mt-2 text-[13px] text-text-secondary">
                @if (seller()!.status === 'ACTIVE') {
                  <span class="inline-flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-success" style="box-shadow:0 0 8px var(--color-success);"></span>
                    Tienda activa
                  </span>
                } @else {
                  <span class="inline-flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-yellow-400"></span>{{ seller()!.status }}
                  </span>
                }
                <span class="text-border-strong">·</span>
                <span>{{ seller()!.city }}, {{ seller()!.department }}</span>
              </div>
            } @else {
              <div class="h-8 w-52 rounded-lg bg-bg-elevated animate-pulse mt-1"></div>
              <div class="h-4 w-40 rounded bg-bg-elevated animate-pulse mt-2"></div>
            }
          </div>
          <div class="flex gap-2 shrink-0">
            <a [routerLink]="['/store', seller()!.storeSlug]" target="_blank"
               class="neo-btn-outline !text-[13px] !py-2 !px-3.5">
              <ng-icon name="lucideExternalLink" size="14" /> Ver tienda
            </a>
            <a routerLink="/seller/products/new" class="neo-btn-primary !text-[13px] !py-2 !px-3.5">
              <ng-icon name="lucidePlus" size="14" /> Nuevo producto
            </a>
          </div>
        </div>

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
            @if (loadingAnalytics()) {
              <div class="h-8 w-32 rounded bg-bg-elevated animate-pulse mb-2.5"></div>
              <div class="h-3 w-20 rounded bg-bg-elevated animate-pulse"></div>
            } @else {
              <p class="font-display text-[28px] font-bold tracking-[-0.01em] text-text-primary leading-none">
                {{ analytics()?.ingresosEsteMes | copCurrency }}
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
                  <span class="text-[11px] text-text-muted">Sin datos anteriores</span>
                }
              </div>
            }
          </div>

          <!-- Mis productos -->
          <div class="neo-card-premium relative overflow-hidden p-5">
            <div class="absolute -top-5 -right-5 w-[100px] h-[100px] rounded-full pointer-events-none"
                 style="background:radial-gradient(circle,#00D4FF,transparent 70%);opacity:.18;filter:blur(28px);"></div>
            <div class="flex items-center justify-between mb-2.5">
              <p class="neo-stat-label">Mis productos</p>
              <div class="w-7 h-7 rounded-lg bg-bg-elevated border border-border flex items-center justify-center"
                   style="color:#00D4FF;">
                <ng-icon name="lucidePackage" size="14" />
              </div>
            </div>
            @if (loadingProducts()) {
              <div class="h-8 w-14 rounded bg-bg-elevated animate-pulse mb-2.5"></div>
              <div class="h-3 w-20 rounded bg-bg-elevated animate-pulse"></div>
            } @else {
              <p class="font-display text-[30px] font-bold tracking-[-0.01em] text-text-primary">{{ totalProducts() }}</p>
              <a routerLink="/seller/products"
                 class="text-[11px] text-text-muted hover:text-accent transition-colors mt-2 inline-flex items-center gap-1">
                Ver inventario <ng-icon name="lucideArrowRight" size="10" />
              </a>
            }
          </div>

          <!-- Órdenes pendientes -->
          <div class="neo-card-premium relative overflow-hidden p-5">
            <div class="absolute -top-5 -right-5 w-[100px] h-[100px] rounded-full pointer-events-none"
                 style="background:radial-gradient(circle,#FF8C00,transparent 70%);opacity:.18;filter:blur(28px);"></div>
            <div class="flex items-center justify-between mb-2.5">
              <p class="neo-stat-label">Órdenes pendientes</p>
              <div class="w-7 h-7 rounded-lg bg-bg-elevated border border-border flex items-center justify-center"
                   style="color:#FF8C00;">
                <ng-icon name="lucideClipboardList" size="14" />
              </div>
            </div>
            @if (loadingAnalytics()) {
              <div class="h-8 w-10 rounded bg-bg-elevated animate-pulse mb-2.5"></div>
              <div class="h-3 w-20 rounded bg-bg-elevated animate-pulse"></div>
            } @else {
              <p class="font-display text-[30px] font-bold tracking-[-0.01em] text-text-primary">
                {{ analytics()?.ordenesPendientes ?? 0 }}
              </p>
              <div class="flex items-center gap-2 mt-2.5">
                <span class="text-[11px] text-text-muted">
                  {{ (analytics()?.ordenesEnPreparacion ?? 0) }} en preparación
                </span>
              </div>
            }
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
            @if (loadingAnalytics()) {
              <div class="h-8 w-14 rounded bg-bg-elevated animate-pulse mb-2.5"></div>
              <div class="h-3 w-20 rounded bg-bg-elevated animate-pulse"></div>
            } @else if (analytics()?.totalResenas) {
              <div class="flex items-baseline gap-1.5">
                <p class="font-display text-[30px] font-bold tracking-[-0.01em]" style="color:#D4A017;">
                  {{ analytics()!.promedioCalificacion | number:'1.1-1' }}
                </p>
                <span class="text-sm text-text-muted">/ 5</span>
              </div>
              <p class="text-[11px] text-text-muted mt-2">
                {{ analytics()!.totalResenas }} reseña{{ analytics()!.totalResenas !== 1 ? 's' : '' }}
              </p>
            } @else {
              <p class="font-display text-[28px] font-bold text-text-muted">—</p>
              <p class="text-[11px] text-text-muted mt-2">Sin reseñas aún</p>
            }
          </div>
        </div>

        <!-- ── Totales históricos ─────────────────────────────────── -->
        @if (!loadingAnalytics() && analytics()) {
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 neo-reveal">
            <div class="rounded-[12px] bg-bg-surface border border-border px-4 py-3 flex flex-col gap-0.5">
              <p class="text-[10px] font-mono uppercase tracking-wider text-text-muted">Ingresos totales</p>
              <p class="text-[15px] font-bold text-text-primary tabular-nums">{{ analytics()!.ingresosTotales | copCurrency }}</p>
            </div>
            <div class="rounded-[12px] bg-bg-surface border border-border px-4 py-3 flex flex-col gap-0.5">
              <p class="text-[10px] font-mono uppercase tracking-wider text-text-muted">Órdenes totales</p>
              <p class="text-[15px] font-bold text-text-primary tabular-nums">{{ analytics()!.ordenesTotales }}</p>
            </div>
            <div class="rounded-[12px] bg-bg-surface border border-border px-4 py-3 flex flex-col gap-0.5">
              <p class="text-[10px] font-mono uppercase tracking-wider text-text-muted">Unidades este mes</p>
              <p class="text-[15px] font-bold text-text-primary tabular-nums">{{ analytics()!.unidadesVendidasEsteMes }}</p>
            </div>
            <div class="rounded-[12px] bg-bg-surface border border-border px-4 py-3 flex flex-col gap-0.5">
              <p class="text-[10px] font-mono uppercase tracking-wider text-text-muted">Enviadas activas</p>
              <p class="text-[15px] font-bold text-text-primary tabular-nums">{{ analytics()!.ordenesEnviadas }}</p>
            </div>
          </div>
        }

        <!-- ── Orders + Activity ─────────────────────────────────── -->
        <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-[18px]">

          <!-- Orders table -->
          <div class="neo-card-premium overflow-hidden neo-reveal">
            <div class="flex items-center justify-between px-5 py-4 border-b border-border">
              <p class="text-sm font-semibold text-text-primary">Últimas órdenes</p>
              <a routerLink="/seller/orders"
                 class="neo-btn-ghost !text-xs !py-1 !px-2.5 inline-flex items-center gap-1">
                Ver todas <ng-icon name="lucideArrowRight" size="12" />
              </a>
            </div>
            @if (loadingOrders()) {
              <div class="p-4 space-y-2">
                @for (_ of [1,2,3,4,5]; track $index) {
                  <div class="h-11 rounded-lg bg-bg-elevated animate-pulse"></div>
                }
              </div>
            } @else if (recentOrders().length === 0) {
              <div class="flex flex-col items-center gap-2 py-12 text-text-muted">
                <ng-icon name="lucideClipboardList" size="32" />
                <p class="text-sm">No tienes órdenes todavía.</p>
              </div>
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full text-[13px] border-collapse">
                  <thead>
                    <tr class="bg-bg-elevated">
                      @for (h of ['Cliente','Fecha','Total','Estado']; track h) {
                        <th class="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]
                                   text-text-muted font-mono whitespace-nowrap last:text-right">{{ h }}</th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (order of recentOrders(); track order.id) {
                      <tr class="border-t border-border transition-colors hover:bg-bg-elevated/60">
                        <td class="px-5 py-3 text-text-primary font-medium whitespace-nowrap">{{ order.buyerName }}</td>
                        <td class="px-5 py-3 text-text-muted whitespace-nowrap text-[12px]">
                          {{ order.createdAt | date:'d MMM yyyy':'':'es' }}
                        </td>
                        <td class="px-5 py-3 font-semibold text-text-primary whitespace-nowrap tabular-nums">
                          {{ order.subtotal | copCurrency }}
                        </td>
                        <td class="px-5 py-3 text-right">
                          <span class="text-[11px] font-semibold px-[10px] py-[3px] rounded-full border whitespace-nowrap"
                            [style.color]="badge(order.status).color"
                            [style.background]="badge(order.status).bg"
                            [style.border-color]="badge(order.status).border">
                            {{ badge(order.status).label }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>

          <!-- Actividad reciente (desde órdenes reales) -->
          <div class="neo-card-premium p-5 neo-reveal">
            <p class="text-sm font-semibold text-text-primary mb-3.5">Actividad reciente</p>
            @if (loadingOrders()) {
              <div class="flex flex-col gap-3">
                @for (_ of [1,2,3,4]; track $index) {
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
              <div class="flex flex-col items-center gap-2 py-8 text-center">
                <ng-icon name="lucideActivity" size="24" class="text-text-muted" />
                <p class="text-[12px] text-text-muted">Sin actividad reciente</p>
              </div>
            } @else {
              <div class="flex flex-col gap-3.5">
                @for (act of activityItems(); track $index) {
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
            }
          </div>

        </div>
      </div>
    </div>
  `,
})
export class SellerDashboardComponent implements OnInit {
  private sellerService   = inject(SellerService);
  private productService  = inject(SellerProductService);
  private orderService    = inject(SellerOrderService);
  private analyticsService = inject(AnalyticsService);

  seller          = signal<SellerResponse | null>(null);
  totalProducts   = signal(0);
  loadingProducts = signal(true);
  recentOrders    = signal<SellerOrderSummary[]>([]);
  loadingOrders   = signal(true);
  analytics       = signal<SellerDashboard | null>(null);
  loadingAnalytics = signal(true);

  revenuePct = computed(() => {
    const d = this.analytics();
    if (!d || d.ingresosMesAnterior === 0) return null;
    return Math.round(((d.ingresosEsteMes - d.ingresosMesAnterior) / d.ingresosMesAnterior) * 100);
  });

  activityItems = computed(() =>
    this.recentOrders().slice(0, 8).map(o => {
      const meta = STATUS_META[o.status] ?? STATUS_META['PENDING'];
      return {
        icon:  meta.icon,
        color: meta.color,
        label: `${meta.label} — ${o.buyerName}`,
        time:  this.timeAgo(o.createdAt),
      };
    })
  );

  badge(s: string) { return STATUS_BADGE[s] ?? STATUS_BADGE['PENDING']; }

  ngOnInit(): void {
    this.sellerService.getMe().subscribe({ next: res => this.seller.set(res.data) });

    this.productService.getMyProducts(0, 1).subscribe({
      next:  res => { this.totalProducts.set(res.data.totalElements); this.loadingProducts.set(false); },
      error: ()  => this.loadingProducts.set(false),
    });

    this.orderService.getMyOrders(0, 8).subscribe({
      next:  res => { this.recentOrders.set(res.data.content); this.loadingOrders.set(false); },
      error: ()  => this.loadingOrders.set(false),
    });

    this.analyticsService.getSellerAnalytics().subscribe({
      next:  res => { this.analytics.set(res.data); this.loadingAnalytics.set(false); },
      error: ()  => this.loadingAnalytics.set(false),
    });
  }

  private timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)   return 'ahora';
    if (mins < 60)  return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs  < 24)  return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7)   return `hace ${days}d`;
    return new Date(dateStr).toLocaleDateString('es', { day: 'numeric', month: 'short' });
  }
}
