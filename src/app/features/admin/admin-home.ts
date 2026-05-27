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
    <div class="relative">
      <!-- Ambient backdrop -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden -z-[1]">
        <div class="neo-grid-bg absolute inset-0 opacity-25"></div>
        <span class="neo-orb red"  style="width:440px;height:440px;top:-15%;right:-8%;opacity:0.11;"></span>
        <span class="neo-orb cyan" style="width:340px;height:340px;bottom:-5%;left:2%;opacity:0.08;animation-delay:2s;"></span>
      </div>

      <div class="relative max-w-[1100px] mx-auto">

        <!-- Header -->
        <div class="neo-reveal mb-7">
          <p class="neo-stat-label">Admin</p>
          <h1 class="font-display text-[32px] font-bold tracking-[-0.02em] mt-1 text-text-primary">
            Panel de administración
          </h1>
        </div>

        <!-- Metric cards -->
        <div class="neo-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px] mb-6">

          <!-- Vendedores pendientes -->
          <div class="neo-card-premium relative overflow-hidden p-5">
            <div class="absolute -top-5 -right-5 w-[100px] h-[100px] rounded-full pointer-events-none"
                 style="background:radial-gradient(circle,#FF8C00,transparent 70%);opacity:.18;filter:blur(28px);"></div>
            <div class="flex items-center justify-between mb-3">
              <p class="neo-stat-label">Vendedores pendientes</p>
              <div class="w-7 h-7 rounded-lg bg-bg-elevated border border-border flex items-center justify-center"
                   style="color:#FF8C00;">
                <ng-icon name="lucideUsers" size="14" />
              </div>
            </div>
            @if (loadingSellers()) {
              <div class="h-8 w-14 rounded-lg bg-bg-elevated animate-pulse"></div>
            } @else {
              <p class="font-display text-[30px] font-bold tracking-[-0.01em]"
                 [style.color]="pendingSellers() > 0 ? '#FF8C00' : 'var(--color-text-primary)'">
                {{ pendingSellers() }}
              </p>
            }
            <a routerLink="/admin/sellers"
               class="text-[12px] font-medium mt-2 inline-flex items-center gap-1 transition-colors"
               style="color:var(--color-accent);">
              Revisar <ng-icon name="lucideArrowRight" size="11" />
            </a>
          </div>

          <!-- Reseñas por moderar -->
          <div class="neo-card-premium relative overflow-hidden p-5">
            <div class="absolute -top-5 -right-5 w-[100px] h-[100px] rounded-full pointer-events-none"
                 style="background:radial-gradient(circle,#FF003C,transparent 70%);opacity:.15;filter:blur(28px);"></div>
            <div class="flex items-center justify-between mb-3">
              <p class="neo-stat-label">Reseñas por moderar</p>
              <div class="w-7 h-7 rounded-lg bg-bg-elevated border border-border flex items-center justify-center text-accent">
                <ng-icon name="lucideStar" size="14" />
              </div>
            </div>
            @if (loadingReviews()) {
              <div class="h-8 w-14 rounded-lg bg-bg-elevated animate-pulse"></div>
            } @else {
              <p class="font-display text-[30px] font-bold tracking-[-0.01em]"
                 [style.color]="pendingReviews() > 0 ? 'var(--color-accent)' : 'var(--color-text-primary)'">
                {{ pendingReviews() }}
              </p>
            }
            <a routerLink="/admin/reviews"
               class="text-[12px] font-medium mt-2 inline-flex items-center gap-1 transition-colors"
               style="color:var(--color-accent);">
              Moderar <ng-icon name="lucideArrowRight" size="11" />
            </a>
          </div>

          <!-- Categorías -->
          <div class="neo-card-premium relative overflow-hidden p-5">
            <div class="absolute -top-5 -right-5 w-[100px] h-[100px] rounded-full pointer-events-none"
                 style="background:radial-gradient(circle,#00D4FF,transparent 70%);opacity:.15;filter:blur(28px);"></div>
            <div class="flex items-center justify-between mb-3">
              <p class="neo-stat-label">Categorías</p>
              <div class="w-7 h-7 rounded-lg bg-bg-elevated border border-border flex items-center justify-center"
                   style="color:#00D4FF;">
                <ng-icon name="lucideTag" size="14" />
              </div>
            </div>
            @if (loadingCategories()) {
              <div class="h-8 w-14 rounded-lg bg-bg-elevated animate-pulse"></div>
            } @else {
              <p class="font-display text-[30px] font-bold tracking-[-0.01em] text-text-primary">
                {{ totalCategories() }}
              </p>
            }
            <a routerLink="/admin/categories"
               class="text-[12px] font-medium mt-2 inline-flex items-center gap-1 transition-colors"
               style="color:var(--color-accent);">
              Gestionar <ng-icon name="lucideArrowRight" size="11" />
            </a>
          </div>

          <!-- Acciones rápidas -->
          <div class="neo-card-premium relative overflow-hidden p-5">
            <div class="absolute -top-5 -right-5 w-[100px] h-[100px] rounded-full pointer-events-none"
                 style="background:radial-gradient(circle,#D4A017,transparent 70%);opacity:.15;filter:blur(28px);"></div>
            <div class="flex items-center justify-between mb-3">
              <p class="neo-stat-label">Acciones rápidas</p>
              <div class="w-7 h-7 rounded-lg bg-bg-elevated border border-border flex items-center justify-center"
                   style="color:#D4A017;">
                <ng-icon name="lucideZap" size="14" />
              </div>
            </div>
            <div class="flex flex-col gap-2 mt-1">
              <a routerLink="/admin/sellers"
                 class="flex items-center gap-2 text-[13px] text-text-secondary hover:text-text-primary
                        px-2.5 py-1.5 rounded-[8px] hover:bg-bg-elevated transition-colors">
                <ng-icon name="lucideUserCheck" size="12" class="text-success shrink-0" />
                Aprobar vendedores
              </a>
              <a routerLink="/admin/reviews"
                 class="flex items-center gap-2 text-[13px] text-text-secondary hover:text-text-primary
                        px-2.5 py-1.5 rounded-[8px] hover:bg-bg-elevated transition-colors">
                <ng-icon name="lucideShieldCheck" size="12" class="text-accent shrink-0" />
                Moderar reseñas
              </a>
              <a routerLink="/admin/invoices"
                 class="flex items-center gap-2 text-[13px] text-text-secondary hover:text-text-primary
                        px-2.5 py-1.5 rounded-[8px] hover:bg-bg-elevated transition-colors">
                <ng-icon name="lucideReceipt" size="12" class="text-neon-cyan shrink-0" />
                Ver facturas
              </a>
            </div>
          </div>
        </div>

        <!-- Vendedores en revisión -->
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
  private adminService = inject(AdminService);

  pendingSellers       = signal(0);
  loadingSellers       = signal(true);
  recentPendingSellers = signal<any[]>([]);
  pendingReviews       = signal(0);
  loadingReviews       = signal(true);
  totalCategories      = signal(0);
  loadingCategories    = signal(true);

  ngOnInit(): void {
    this.adminService.getSellers(0, 5, 'PENDING').subscribe({
      next: (res) => {
        this.pendingSellers.set(res.data.totalElements);
        this.recentPendingSellers.set(res.data.content);
        this.loadingSellers.set(false);
      },
      error: () => this.loadingSellers.set(false),
    });

    this.adminService.getAdminReviews(0, 1, 'PENDING').subscribe({
      next:  (res: any) => { this.pendingReviews.set(res.data.totalElements); this.loadingReviews.set(false); },
      error: () => this.loadingReviews.set(false),
    });

    this.adminService.getCategories().subscribe({
      next:  (res) => { this.totalCategories.set(res.data.length); this.loadingCategories.set(false); },
      error: () => this.loadingCategories.set(false),
    });
  }
}
