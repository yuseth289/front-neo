import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';
import { ProductService } from '../../../core/catalog/product.service';
import { CategoryService } from '../../../core/catalog/category.service';
import { ProductSummary, Category } from '../../../shared/models/catalog.models';
import { PageResponse } from '../../../shared/models/api.models';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NgIcon, ProductCardComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">

      <!-- Encabezado + búsqueda -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-text-primary">
            {{ activeCategoryName() ?? 'Catálogo' }}
          </h1>
          @if (page()) {
            <p class="text-sm text-text-muted mt-0.5">
              {{ page()!.totalElements | number }} productos
            </p>
          }
        </div>

        <!-- Búsqueda -->
        <div class="relative w-full sm:w-72">
          <ng-icon name="lucideSearch" size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="search"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearch($event)"
            placeholder="Buscar productos..."
            class="w-full pl-9 pr-4 py-2 rounded-lg bg-bg-surface border border-border text-text-primary text-sm
                   placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
          />
        </div>
      </div>

      <div class="flex gap-6">

        <!-- ── SIDEBAR ─────────────────────────────────────────────────── -->
        <aside class="hidden md:block w-52 shrink-0">
          <div class="bg-bg-surface border border-border rounded-xl p-4">
            <p class="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Categorías</p>
            <nav class="flex flex-col gap-0.5">
              <a routerLink="/catalog"
                 [class.text-accent]="!activeCategoryId()"
                 [class.text-text-secondary]="activeCategoryId()"
                 class="text-sm px-2 py-1.5 rounded-lg hover:bg-bg-elevated hover:text-text-primary transition-colors">
                Todos los productos
              </a>
              @for (cat of categories(); track cat.id) {
                <a [routerLink]="['/catalog/category', cat.id]"
                   [class.text-accent]="activeCategoryId() === cat.id"
                   [class.text-text-secondary]="activeCategoryId() !== cat.id"
                   class="text-sm px-2 py-1.5 rounded-lg hover:bg-bg-elevated hover:text-text-primary transition-colors">
                  {{ cat.name }}
                </a>
                @for (sub of cat.children; track sub.id) {
                  <a [routerLink]="['/catalog/category', sub.id]"
                     [class.text-accent]="activeCategoryId() === sub.id"
                     [class.text-text-secondary]="activeCategoryId() !== sub.id"
                     class="text-sm px-2 py-1.5 pl-5 rounded-lg hover:bg-bg-elevated hover:text-text-primary transition-colors">
                    {{ sub.name }}
                  </a>
                }
              }
            </nav>
          </div>
        </aside>

        <!-- ── GRID DE PRODUCTOS ───────────────────────────────────────── -->
        <div class="flex-1 min-w-0">

          @if (loading()) {
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              @for (_ of skeletons; track $index) {
                <div class="aspect-square rounded-xl bg-bg-surface border border-border animate-pulse"></div>
              }
            </div>
          } @else if (products().length === 0) {
            <div class="flex flex-col items-center gap-3 py-24 text-text-muted">
              <ng-icon name="lucideSearch" size="40" />
              <p class="font-medium">Sin resultados</p>
              <p class="text-sm">Intenta con otros términos o categorías</p>
            </div>
          } @else {
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              @for (product of products(); track product.id) {
                <app-product-card [product]="product" />
              }
            </div>

            <!-- Paginación -->
            @if (page() && page()!.totalPages > 1) {
              <div class="flex items-center justify-center gap-2 mt-8">
                <button
                  [disabled]="page()!.first"
                  (click)="goToPage(currentPage() - 1)"
                  class="px-3 py-1.5 rounded-lg border border-border text-text-secondary text-sm disabled:opacity-40
                         hover:border-accent/60 hover:text-text-primary transition-colors">
                  Anterior
                </button>
                <span class="text-sm text-text-muted px-2">
                  Página {{ currentPage() + 1 }} de {{ page()!.totalPages }}
                </span>
                <button
                  [disabled]="page()!.last"
                  (click)="goToPage(currentPage() + 1)"
                  class="px-3 py-1.5 rounded-lg border border-border text-text-secondary text-sm disabled:opacity-40
                         hover:border-accent/60 hover:text-text-primary transition-colors">
                  Siguiente
                </button>
              </div>
            }
          }

        </div>
      </div>
    </div>
  `,
})
export class CatalogPageComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  private search$ = new Subject<string>();

  products = signal<ProductSummary[]>([]);
  categories = signal<Category[]>([]);
  page = signal<PageResponse<ProductSummary> | null>(null);
  loading = signal(true);
  currentPage = signal(0);
  activeCategoryId = signal<string | null>(null);
  searchQuery = '';

  readonly skeletons = Array(12);

  activeCategoryName = computed(() => {
    if (!this.activeCategoryId()) return null;
    const id = this.activeCategoryId();
    for (const cat of this.categories()) {
      if (cat.id === id) return cat.name;
      for (const sub of cat.children) {
        if (sub.id === id) return sub.name;
      }
    }
    return null;
  });

  ngOnInit(): void {
    this.categoryService.getTree().subscribe({
      next: (res) => this.categories.set(res.data),
      error: () => {},
    });

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const categoryId = params.get('categoryId');
      this.activeCategoryId.set(categoryId);
      this.currentPage.set(0);
      this.searchQuery = '';
      this.loadProducts();
    });

    this.search$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe((q) => {
      this.currentPage.set(0);
      this.loadProducts(q);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(q: string): void {
    this.search$.next(q.trim());
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadProducts(this.searchQuery.trim());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private loadProducts(q?: string): void {
    this.loading.set(true);
    const page = this.currentPage();
    const categoryId = this.activeCategoryId();

    const request$ = q
      ? this.productService.search(q, { page })
      : categoryId
        ? this.productService.getByCategory(categoryId, { page })
        : this.productService.getCatalog({ page });

    request$.subscribe({
      next: (res) => {
        this.products.set(res.data.content);
        this.page.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
