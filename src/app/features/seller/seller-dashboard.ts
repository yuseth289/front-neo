import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { SellerService } from '../../core/seller/seller.service';
import { SellerProductService } from '../../core/seller/seller-product.service';
import { SellerOrderService } from '../../core/seller/seller-order.service';
import { SellerResponse } from '../../shared/models/seller.models';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon],
  template: `
    <div>
      <h1 class="text-xl font-bold text-text-primary mb-6">Dashboard</h1>

      @if (seller()) {
        <div class="mb-6 p-4 rounded-xl bg-bg-surface border border-border flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
            <ng-icon name="lucideStore" size="18" class="text-accent" />
          </div>
          <div>
            <p class="text-sm font-semibold text-text-primary">{{ seller()!.storeName }}</p>
            <p class="text-xs text-text-muted">{{ seller()!.city }}, {{ seller()!.department }}</p>
          </div>
          <span class="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full"
            [ngClass]="seller()!.status === 'ACTIVE' ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'">
            {{ seller()!.status === 'ACTIVE' ? 'Activo' : seller()!.status }}
          </span>
        </div>
      }

      <!-- Stats cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="bg-bg-surface border border-border rounded-xl p-5">
          <div class="flex items-center justify-between mb-3">
            <p class="text-xs text-text-muted uppercase tracking-wide">Productos</p>
            <ng-icon name="lucidePackage" size="16" class="text-accent" />
          </div>
          @if (loadingProducts()) {
            <div class="h-7 w-12 rounded bg-bg-elevated animate-pulse"></div>
          } @else {
            <p class="text-2xl font-bold text-text-primary">{{ totalProducts() }}</p>
          }
          <a routerLink="/seller/products" class="text-xs text-accent hover:underline mt-1 block">Ver todos →</a>
        </div>

        <div class="bg-bg-surface border border-border rounded-xl p-5">
          <div class="flex items-center justify-between mb-3">
            <p class="text-xs text-text-muted uppercase tracking-wide">Órdenes pendientes</p>
            <ng-icon name="lucideClipboardList" size="16" class="text-neon-cyan" />
          </div>
          @if (loadingOrders()) {
            <div class="h-7 w-12 rounded bg-bg-elevated animate-pulse"></div>
          } @else {
            <p class="text-2xl font-bold text-text-primary">{{ pendingOrders() }}</p>
          }
          <a routerLink="/seller/orders" class="text-xs text-accent hover:underline mt-1 block">Ver órdenes →</a>
        </div>

        <div class="bg-bg-surface border border-border rounded-xl p-5">
          <div class="flex items-center justify-between mb-3">
            <p class="text-xs text-text-muted uppercase tracking-wide">Acciones rápidas</p>
            <ng-icon name="lucideZap" size="16" class="text-yellow-400" />
          </div>
          <div class="flex flex-col gap-1.5">
            <a routerLink="/seller/products/new"
              class="text-xs text-accent hover:underline flex items-center gap-1">
              <ng-icon name="lucidePlus" size="11" />
              Crear producto
            </a>
            <a routerLink="/seller/profile"
              class="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1">
              <ng-icon name="lucideSettings" size="11" />
              Editar tienda
            </a>
          </div>
        </div>
      </div>

      <!-- Últimas órdenes -->
      <div class="bg-bg-surface border border-border rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-text-secondary uppercase tracking-wide">Últimas órdenes</h2>
          <a routerLink="/seller/orders" class="text-xs text-accent hover:underline">Ver todas</a>
        </div>

        @if (loadingOrders()) {
          <div class="space-y-2">
            @for (_ of [1,2,3]; track $index) {
              <div class="h-10 rounded-lg bg-bg-elevated animate-pulse"></div>
            }
          </div>
        } @else if (recentOrders().length === 0) {
          <p class="text-sm text-text-muted py-4 text-center">No tienes órdenes todavía.</p>
        } @else {
          <div class="divide-y divide-border">
            @for (order of recentOrders(); track order.id) {
              <div class="flex items-center justify-between py-2.5">
                <div>
                  <p class="text-sm text-text-secondary">{{ order.buyerName }}</p>
                  <p class="text-xs text-text-muted">{{ order.createdAt | date:'d MMM yyyy':'':'es' }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-medium text-text-primary">
                    {{ order.subtotal | currency:'COP':'symbol-narrow':'1.0-0':'es' }}
                  </p>
                  <span class="text-[10px] font-semibold"
                    [class]="order.status === 'DELIVERED' ? 'text-green-400' :
                             order.status === 'CANCELLED' ? 'text-error' : 'text-blue-400'">
                    {{ order.status }}
                  </span>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class SellerDashboardComponent implements OnInit {
  private sellerService = inject(SellerService);
  private productService = inject(SellerProductService);
  private orderService = inject(SellerOrderService);

  seller = signal<SellerResponse | null>(null);
  totalProducts = signal(0);
  loadingProducts = signal(true);
  pendingOrders = signal(0);
  recentOrders = signal<any[]>([]);
  loadingOrders = signal(true);

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
          res.data.content.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED').length
        );
        this.loadingOrders.set(false);
      },
      error: () => this.loadingOrders.set(false),
    });
  }
}
