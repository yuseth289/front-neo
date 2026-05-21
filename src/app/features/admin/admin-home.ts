import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { AdminService } from '../../core/admin/admin.service';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon],
  template: `
    <div>
      <h1 class="text-xl font-bold text-text-primary mb-6">Panel de administración</h1>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

        <div class="bg-bg-surface border border-border rounded-xl p-5">
          <div class="flex items-center justify-between mb-3">
            <p class="text-xs text-text-muted uppercase tracking-wide">Vendedores pendientes</p>
            <ng-icon name="lucideUsers" size="16" class="text-yellow-400" />
          </div>
          @if (loadingSellers()) {
            <div class="h-7 w-10 rounded bg-bg-elevated animate-pulse"></div>
          } @else {
            <p class="text-2xl font-bold text-text-primary">{{ pendingSellers() }}</p>
          }
          <a routerLink="/admin/sellers" class="text-xs text-accent hover:underline mt-1 block">Revisar →</a>
        </div>

        <div class="bg-bg-surface border border-border rounded-xl p-5">
          <div class="flex items-center justify-between mb-3">
            <p class="text-xs text-text-muted uppercase tracking-wide">Reseñas por moderar</p>
            <ng-icon name="lucideStar" size="16" class="text-accent" />
          </div>
          @if (loadingReviews()) {
            <div class="h-7 w-10 rounded bg-bg-elevated animate-pulse"></div>
          } @else {
            <p class="text-2xl font-bold text-text-primary">{{ pendingReviews() }}</p>
          }
          <a routerLink="/admin/reviews" class="text-xs text-accent hover:underline mt-1 block">Moderar →</a>
        </div>

        <div class="bg-bg-surface border border-border rounded-xl p-5 flex flex-col justify-between">
          <div class="flex items-center justify-between mb-3">
            <p class="text-xs text-text-muted uppercase tracking-wide">Categorías</p>
            <ng-icon name="lucideTag" size="16" class="text-neon-cyan" />
          </div>
          <p class="text-sm text-text-secondary mt-2">Gestionar árbol de categorías</p>
          <a routerLink="/admin/categories" class="text-xs text-accent hover:underline mt-2 block">Gestionar →</a>
        </div>

        <div class="bg-bg-surface border border-border rounded-xl p-5 flex flex-col justify-between">
          <div class="flex items-center justify-between mb-3">
            <p class="text-xs text-text-muted uppercase tracking-wide">Acciones rápidas</p>
            <ng-icon name="lucideZap" size="16" class="text-yellow-400" />
          </div>
          <div class="flex flex-col gap-1.5 mt-2">
            <a routerLink="/admin/sellers" class="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1.5">
              <ng-icon name="lucideUserCheck" size="11" />Aprobar vendedores
            </a>
            <a routerLink="/admin/reviews" class="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1.5">
              <ng-icon name="lucideShieldCheck" size="11" />Moderar reseñas
            </a>
          </div>
        </div>

      </div>

      <!-- Vendedores pendientes recientes -->
      <div class="bg-bg-surface border border-border rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-text-secondary uppercase tracking-wide">Vendedores en revisión</h2>
          <a routerLink="/admin/sellers" class="text-xs text-accent hover:underline">Ver todos</a>
        </div>

        @if (loadingSellers()) {
          <div class="space-y-2">
            @for (_ of [1,2]; track $index) {
              <div class="h-10 rounded-lg bg-bg-elevated animate-pulse"></div>
            }
          </div>
        } @else if (recentPendingSellers().length === 0) {
          <p class="text-sm text-text-muted py-4 text-center">No hay vendedores pendientes de aprobación.</p>
        } @else {
          <div class="divide-y divide-border">
            @for (seller of recentPendingSellers(); track seller.id) {
              <div class="flex items-center justify-between py-2.5">
                <div>
                  <p class="text-sm font-medium text-text-primary">{{ seller.storeName }}</p>
                  <p class="text-xs text-text-muted">{{ seller.city }}, {{ seller.department }}</p>
                </div>
                <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400">
                  Pendiente
                </span>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class AdminHomeComponent implements OnInit {
  private adminService = inject(AdminService);

  pendingSellers = signal(0);
  loadingSellers = signal(true);
  recentPendingSellers = signal<any[]>([]);
  pendingReviews = signal(0);
  loadingReviews = signal(true);

  ngOnInit(): void {
    this.adminService.getSellers(0, 5, 'PENDING').subscribe({
      next: (res) => {
        this.pendingSellers.set(res.data.totalElements);
        this.recentPendingSellers.set(res.data.content);
        this.loadingSellers.set(false);
      },
      error: () => this.loadingSellers.set(false),
    });

    this.adminService.getPendingReviews(0, 1).subscribe({
      next: (res) => { this.pendingReviews.set(res.data.totalElements); this.loadingReviews.set(false); },
      error: () => this.loadingReviews.set(false),
    });
  }
}
