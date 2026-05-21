import { Component, inject, OnInit, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { SellerService } from '../../../core/seller/seller.service';
import { ProductService } from '../../../core/catalog/product.service';
import { PublicSellerResponse } from '../../../shared/models/seller.models';
import { ProductSummary } from '../../../shared/models/catalog.models';

@Component({
  selector: 'app-store-page',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon],
  template: `
    @if (loadingStore()) {
      <div class="animate-pulse space-y-4">
        <div class="h-32 rounded-2xl bg-bg-surface border border-border"></div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          @for (_ of [1,2,3,4,5,6,7,8]; track $index) {
            <div class="h-56 rounded-xl bg-bg-surface border border-border"></div>
          }
        </div>
      </div>
    } @else if (notFound()) {
      <div class="flex flex-col items-center gap-4 py-24 text-text-muted">
        <ng-icon name="lucideStore" size="48" />
        <p class="text-lg font-medium text-text-secondary">Tienda no encontrada</p>
        <a routerLink="/catalog" class="text-sm text-accent hover:underline">Ver catálogo</a>
      </div>
    } @else if (store()) {
      <!-- Store header -->
      <div class="bg-bg-surface border border-border rounded-2xl p-6 mb-6">
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 rounded-xl bg-bg-elevated border border-border flex items-center justify-center shrink-0">
            <ng-icon name="lucideStore" size="24" class="text-text-muted" />
          </div>
          <div class="min-w-0">
            <h1 class="text-xl font-bold text-text-primary">{{ store()!.storeName }}</h1>
            @if (store()!.storeDescription) {
              <p class="text-sm text-text-secondary mt-1 leading-relaxed">{{ store()!.storeDescription }}</p>
            }
            <div class="flex items-center gap-1.5 mt-2 text-xs text-text-muted">
              <ng-icon name="lucideMapPin" size="12" />
              <span>{{ store()!.city }}, {{ store()!.department }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Products -->
      <h2 class="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
        Productos de la tienda
      </h2>

      @if (loadingProducts()) {
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="h-56 rounded-xl bg-bg-surface border border-border animate-pulse"></div>
          }
        </div>
      } @else if (products().length === 0) {
        <div class="flex flex-col items-center gap-3 py-16 text-text-muted">
          <ng-icon name="lucidePackage" size="40" />
          <p>Esta tienda aún no tiene productos publicados.</p>
        </div>
      } @else {
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          @for (product of products(); track product.id) {
            <a [routerLink]="['/product', product.slug]"
              class="group bg-bg-surface border border-border rounded-xl overflow-hidden hover:border-accent/50 transition-colors">
              <div class="aspect-square bg-bg-elevated overflow-hidden">
                @if (product.primaryImageUrl) {
                  <img [src]="product.primaryImageUrl" [alt]="product.name"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                } @else {
                  <div class="w-full h-full flex items-center justify-center">
                    <ng-icon name="lucideImage" size="32" class="text-text-muted" />
                  </div>
                }
              </div>
              <div class="p-3">
                <p class="text-xs text-text-muted mb-0.5">{{ product.brand }}</p>
                <p class="text-sm font-medium text-text-primary line-clamp-2 leading-snug">{{ product.name }}</p>
                <p class="text-sm font-bold text-accent mt-2">
                  {{ product.finalPrice | currency:'COP':'symbol-narrow':'1.0-0':'es-CO' }}
                </p>
              </div>
            </a>
          }
        </div>

        @if (totalPages() > 1) {
          <div class="flex items-center justify-center gap-3 mt-6">
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
    }
  `,
})
export class StorePageComponent implements OnInit {
  readonly storeSlug = input.required<string>();

  private sellerService = inject(SellerService);
  private productService = inject(ProductService);

  store = signal<PublicSellerResponse | null>(null);
  products = signal<ProductSummary[]>([]);
  loadingStore = signal(true);
  loadingProducts = signal(false);
  notFound = signal(false);
  page = signal(0);
  totalPages = signal(0);

  ngOnInit(): void {
    this.sellerService.getPublicProfile(this.storeSlug()).subscribe({
      next: (res) => {
        this.store.set(res.data);
        this.loadingStore.set(false);
        this.loadProducts(res.data.id);
      },
      error: (err) => {
        this.loadingStore.set(false);
        if (err.status === 404) this.notFound.set(true);
      },
    });
  }

  private loadProducts(sellerId: string): void {
    this.loadingProducts.set(true);
    this.productService.getBySeller(sellerId, this.page(), 16).subscribe({
      next: (res) => {
        this.products.set(res.data.content);
        this.totalPages.set(res.data.totalPages);
        this.loadingProducts.set(false);
      },
      error: () => this.loadingProducts.set(false),
    });
  }

  prevPage(): void {
    if (this.page() > 0) {
      this.page.update(p => p - 1);
      if (this.store()) this.loadProducts(this.store()!.id);
    }
  }

  nextPage(): void {
    if (this.page() + 1 < this.totalPages()) {
      this.page.update(p => p + 1);
      if (this.store()) this.loadProducts(this.store()!.id);
    }
  }
}
