import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { SellerProductService } from '../../core/seller/seller-product.service';
import { ProductSummaryResponse } from '../../shared/models/product.models';
import { ProductStatus } from '../../shared/models/enums';

const STATUS_LABEL: Record<ProductStatus, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activo',
  PAUSED: 'Pausado',
  DELETED: 'Eliminado',
};

const STATUS_CLASS: Record<ProductStatus, string> = {
  DRAFT: 'bg-bg-elevated text-text-muted',
  ACTIVE: 'bg-green-500/15 text-green-400',
  PAUSED: 'bg-yellow-500/15 text-yellow-400',
  DELETED: 'bg-red-500/15 text-red-400',
};

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon],
  template: `
    <div>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-xl font-bold text-text-primary">Mis productos</h1>
        <a routerLink="/seller/products/new"
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors">
          <ng-icon name="lucidePlus" size="14" />
          Nuevo producto
        </a>
      </div>

      @if (loading()) {
        <div class="space-y-3">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="h-16 rounded-xl bg-bg-surface border border-border animate-pulse"></div>
          }
        </div>
      } @else if (products().length === 0) {
        <div class="flex flex-col items-center gap-3 py-16 text-text-muted">
          <ng-icon name="lucidePackage" size="40" />
          <p>No tienes productos todavía.</p>
          <a routerLink="/seller/products/new" class="text-sm text-accent hover:underline">Crear el primero →</a>
        </div>
      } @else {
        <div class="bg-bg-surface border border-border rounded-xl overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border text-left">
                <th class="px-4 py-3 text-xs text-text-muted font-medium">Producto</th>
                <th class="px-4 py-3 text-xs text-text-muted font-medium hidden sm:table-cell">Precio</th>
                <th class="px-4 py-3 text-xs text-text-muted font-medium">Estado</th>
                <th class="px-4 py-3 text-xs text-text-muted font-medium w-10"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @for (p of products(); track p.id) {
                <tr class="hover:bg-bg-elevated transition-colors">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      @if (p.primaryImageUrl) {
                        <img [src]="p.primaryImageUrl" [alt]="p.name"
                          class="w-9 h-9 rounded-lg object-cover bg-bg-elevated shrink-0" loading="lazy" />
                      } @else {
                        <div class="w-9 h-9 rounded-lg bg-bg-elevated flex items-center justify-center shrink-0">
                          <ng-icon name="lucideImage" size="14" class="text-text-muted" />
                        </div>
                      }
                      <div>
                        <p class="font-medium text-text-primary">{{ p.name }}</p>
                        <p class="text-xs text-text-muted">{{ p.brand }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 hidden sm:table-cell text-text-secondary">
                    {{ p.finalPrice | currency:'COP':'symbol-narrow':'1.0-0':'es' }}
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      [ngClass]="statusClass(p.status)">
                      {{ statusLabel(p.status) }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <a [routerLink]="['/seller/products', p.id]"
                      class="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors inline-flex">
                      <ng-icon name="lucideSettings" size="15" />
                    </a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (totalPages() > 1) {
          <div class="flex items-center justify-center gap-3 mt-5">
            <button (click)="prevPage()" [disabled]="page() === 0"
              class="px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary
                     hover:bg-bg-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Anterior
            </button>
            <span class="text-sm text-text-muted">{{ page() + 1 }} / {{ totalPages() }}</span>
            <button (click)="nextPage()" [disabled]="page() + 1 >= totalPages()"
              class="px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary
                     hover:bg-bg-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Siguiente
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class SellerProductsComponent implements OnInit {
  private productService = inject(SellerProductService);

  products = signal<ProductSummaryResponse[]>([]);
  loading = signal(true);
  page = signal(0);
  totalPages = signal(0);

  statusLabel(s: ProductStatus): string { return STATUS_LABEL[s] ?? s; }
  statusClass(s: ProductStatus): string { return STATUS_CLASS[s] ?? ''; }

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.productService.getMyProducts(this.page(), 20).subscribe({
      next: (res) => {
        this.products.set(res.data.content);
        this.totalPages.set(res.data.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  prevPage(): void { if (this.page() > 0) { this.page.update(p => p - 1); this.load(); } }
  nextPage(): void { if (this.page() + 1 < this.totalPages()) { this.page.update(p => p + 1); this.load(); } }
}
