import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { SellerService } from '../../core/seller/seller.service';
import { SellerProductService } from '../../core/seller/seller-product.service';
import { SellerOrderService } from '../../core/seller/seller-order.service';
import { SellerResponse } from '../../shared/models/seller.models';

const STATUS_MAP: Record<string, { color: string; bg: string; border: string; label: string }> = {
  DELIVERED: { color: 'var(--color-success)',    bg: 'rgba(0,200,150,0.12)', border: 'rgba(0,200,150,0.2)',  label: 'Entregada' },
  PENDING:   { color: 'var(--color-warning)',    bg: 'rgba(255,140,0,0.12)', border: 'rgba(255,140,0,0.2)',  label: 'Pendiente' },
  SHIPPED:   { color: 'var(--color-neon-cyan)',  bg: 'rgba(0,212,255,0.12)', border: 'rgba(0,212,255,0.2)',  label: 'Enviada'   },
  CANCELLED: { color: 'var(--color-error)',      bg: 'rgba(255,0,60,0.12)',  border: 'rgba(255,0,60,0.2)',   label: 'Cancelada' },
  CONFIRMED: { color: 'var(--color-neon-cyan)',  bg: 'rgba(0,212,255,0.12)', border: 'rgba(0,212,255,0.2)',  label: 'Confirmada'},
};

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon],
  template: `
    <div class="relative">
      <!-- Ambient backdrop -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden -z-[1]">
        <div class="neo-grid-bg absolute inset-0 opacity-25"></div>
        <span class="neo-orb red"  style="width:480px;height:480px;top:-15%;right:-8%;opacity:0.12;"></span>
        <span class="neo-orb cyan" style="width:360px;height:360px;bottom:-5%;left:2%;opacity:0.09;animation-delay:2s;"></span>
      </div>

      <div class="relative max-w-[1100px] mx-auto">

        <!-- Greeting row -->
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
                    <span class="w-2 h-2 rounded-full bg-success"
                          style="box-shadow: 0 0 8px var(--color-success);"></span>
                    Tienda activa
                  </span>
                } @else {
                  <span class="inline-flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-yellow-400"></span>
                    {{ seller()!.status }}
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
            <a routerLink="/seller/profile"
               class="neo-btn-outline !text-[13px] !py-2 !px-3.5">
              <ng-icon name="lucideExternalLink" size="14" />
              Ver tienda
            </a>
            <a routerLink="/seller/products/new"
               class="neo-btn-primary !text-[13px] !py-2 !px-3.5">
              <ng-icon name="lucidePlus" size="14" />
              Crear producto
            </a>
          </div>
        </div>

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
            <p class="font-display text-[30px] font-bold tracking-[-0.01em] text-text-primary">$ —</p>
            <div class="flex items-center justify-between mt-2.5">
              <span class="text-xs font-semibold text-success inline-flex items-center gap-1">
                <ng-icon name="lucideTrendingUp" size="12" /> +12%
              </span>
              <svg width="120" height="36" viewBox="0 0 120 36" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sg-red" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#FF003C" stop-opacity="0.35"/>
                    <stop offset="100%" stop-color="#FF003C" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <path [attr.d]="sparklineArea([8,14,11,16,22,19,24,28,26,32,30,38])" fill="url(#sg-red)"/>
                <path [attr.d]="sparklineLine([8,14,11,16,22,19,24,28,26,32,30,38])"
                      fill="none" stroke="#FF003C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>

          <!-- Productos activos -->
          <div class="neo-card-premium relative overflow-hidden p-5">
            <div class="absolute -top-5 -right-5 w-[100px] h-[100px] rounded-full pointer-events-none"
                 style="background:radial-gradient(circle,#00D4FF,transparent 70%);opacity:.18;filter:blur(28px);"></div>
            <div class="flex items-center justify-between mb-2.5">
              <p class="neo-stat-label">Productos activos</p>
              <div class="w-7 h-7 rounded-lg bg-bg-elevated border border-border flex items-center justify-center"
                   style="color:#00D4FF;">
                <ng-icon name="lucidePackage" size="14" />
              </div>
            </div>
            @if (loadingProducts()) {
              <div class="h-8 w-14 rounded bg-bg-elevated animate-pulse"></div>
            } @else {
              <p class="font-display text-[30px] font-bold tracking-[-0.01em] text-text-primary">{{ totalProducts() }}</p>
            }
            <div class="flex items-center justify-between mt-2.5">
              <span class="text-xs font-semibold text-success inline-flex items-center gap-1">
                <ng-icon name="lucideTrendingUp" size="12" /> +4%
              </span>
              <svg width="120" height="36" viewBox="0 0 120 36" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sg-cyan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#00D4FF" stop-opacity="0.35"/>
                    <stop offset="100%" stop-color="#00D4FF" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <path [attr.d]="sparklineArea([110,112,115,116,118,120,122,121,124,125,126,128])" fill="url(#sg-cyan)"/>
                <path [attr.d]="sparklineLine([110,112,115,116,118,120,122,121,124,125,126,128])"
                      fill="none" stroke="#00D4FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
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
            @if (loadingOrders()) {
              <div class="h-8 w-10 rounded bg-bg-elevated animate-pulse"></div>
            } @else {
              <p class="font-display text-[30px] font-bold tracking-[-0.01em] text-text-primary">{{ pendingOrders() }}</p>
            }
            <div class="flex items-center justify-between mt-2.5">
              <span class="text-xs font-semibold text-error inline-flex items-center gap-1">
                <ng-icon name="lucideTrendingDown" size="12" /> -3%
              </span>
              <svg width="120" height="36" viewBox="0 0 120 36" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sg-orange" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#FF8C00" stop-opacity="0.35"/>
                    <stop offset="100%" stop-color="#FF8C00" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <path [attr.d]="sparklineArea([12,10,11,9,8,10,9,8,7,8,7,7])" fill="url(#sg-orange)"/>
                <path [attr.d]="sparklineLine([12,10,11,9,8,10,9,8,7,8,7,7])"
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
            <p class="font-display text-[30px] font-bold tracking-[-0.01em] text-text-primary">—</p>
            <div class="flex items-center justify-between mt-2.5">
              <span class="text-xs font-semibold text-success inline-flex items-center gap-1">
                <ng-icon name="lucideTrendingUp" size="12" /> +1%
              </span>
              <svg width="120" height="36" viewBox="0 0 120 36" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sg-gold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#D4A017" stop-opacity="0.35"/>
                    <stop offset="100%" stop-color="#D4A017" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <path [attr.d]="sparklineArea([45,46,46,47,47,47,48,48,47,48,48,48])" fill="url(#sg-gold)"/>
                <path [attr.d]="sparklineLine([45,46,46,47,47,47,48,48,47,48,48,48])"
                      fill="none" stroke="#D4A017" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Orders + Activity grid -->
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
                      @for (h of ['Orden','Cliente','Fecha','Total','Estado']; track h) {
                        <th class="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em]
                                   text-text-muted font-mono whitespace-nowrap">{{ h }}</th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (order of recentOrders(); track order.id) {
                      <tr class="border-t border-border transition-colors hover:bg-bg-elevated/60">
                        <td class="px-5 py-3 font-mono text-xs text-text-primary whitespace-nowrap">{{ order.id }}</td>
                        <td class="px-5 py-3 text-text-secondary whitespace-nowrap">{{ order.buyerName }}</td>
                        <td class="px-5 py-3 text-text-muted whitespace-nowrap">
                          {{ order.createdAt | date:'d MMM yyyy':'':'es' }}
                        </td>
                        <td class="px-5 py-3 font-semibold text-text-primary whitespace-nowrap">
                          {{ order.subtotal | currency:'COP':'symbol-narrow':'1.0-0':'es' }}
                        </td>
                        <td class="px-5 py-3">
                          <span class="text-[11px] font-semibold px-[10px] py-[3px] rounded-full border whitespace-nowrap"
                            [style.color]="orderStatusColor(order.status)"
                            [style.background]="orderStatusBg(order.status)"
                            [style.border-color]="orderStatusBorder(order.status)">
                            {{ orderStatusLabel(order.status) }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>

          <!-- Activity feed -->
          <div class="neo-card-premium p-5 neo-reveal">
            <p class="text-sm font-semibold text-text-primary mb-3.5">Actividad</p>
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
    </div>
  `,
})
export class SellerDashboardComponent implements OnInit {
  private sellerService  = inject(SellerService);
  private productService = inject(SellerProductService);
  private orderService   = inject(SellerOrderService);

  seller         = signal<SellerResponse | null>(null);
  totalProducts  = signal(0);
  loadingProducts = signal(true);
  pendingOrders  = signal(0);
  recentOrders   = signal<any[]>([]);
  loadingOrders  = signal(true);

  readonly activity = [
    { icon: 'lucideCheck',         color: 'var(--color-success)',   label: 'ORD marcada como entregada',          time: 'hace 14 min' },
    { icon: 'lucidePackage',       color: 'var(--color-neon-cyan)', label: 'Inventario actualizado en tu tienda', time: 'hace 1 h'    },
    { icon: 'lucideStar',          color: '#D4A017',                label: 'Nueva reseña 5★ en tu tienda',        time: 'hace 3 h'    },
    { icon: 'lucideTriangleAlert', color: 'var(--color-warning)',   label: 'Stock bajo: revisar inventario',      time: 'hace 5 h'    },
    { icon: 'lucideUserPlus',      color: 'var(--color-accent)',    label: 'Nuevos seguidores en tu tienda',      time: 'hace 8 h'    },
  ];

  orderStatusColor(s: string):  string { return (STATUS_MAP[s] ?? STATUS_MAP['PENDING']).color;  }
  orderStatusBg(s: string):     string { return (STATUS_MAP[s] ?? STATUS_MAP['PENDING']).bg;     }
  orderStatusBorder(s: string): string { return (STATUS_MAP[s] ?? STATUS_MAP['PENDING']).border; }
  orderStatusLabel(s: string):  string { return (STATUS_MAP[s] ?? STATUS_MAP['PENDING']).label;  }

  sparklineLine(points: number[], w = 120, h = 36): string {
    const max = Math.max(...points), min = Math.min(...points);
    const range = max - min || 1;
    const stepX = w / (points.length - 1);
    return points.map((p, i) =>
      `${i === 0 ? 'M' : 'L'}${(i * stepX).toFixed(1)},${(h - ((p - min) / range) * (h - 4) - 2).toFixed(1)}`
    ).join(' ');
  }

  sparklineArea(points: number[], w = 120, h = 36): string {
    const line = this.sparklineLine(points, w, h);
    return `${line} L${w},${h} L0,${h} Z`;
  }

  ngOnInit(): void {
    this.sellerService.getMe().subscribe({
      next: (res) => this.seller.set(res.data),
    });

    this.productService.getMyProducts(0, 1).subscribe({
      next: (res) => { this.totalProducts.set(res.data.totalElements); this.loadingProducts.set(false); },
      error: () => this.loadingProducts.set(false),
    });

    this.orderService.getMyOrders(0, 5).subscribe({
      next: (res) => {
        this.recentOrders.set(res.data.content);
        this.pendingOrders.set(
          res.data.content.filter((o: any) => o.status === 'PENDING' || o.status === 'CONFIRMED').length
        );
        this.loadingOrders.set(false);
      },
      error: () => this.loadingOrders.set(false),
    });
  }
}
