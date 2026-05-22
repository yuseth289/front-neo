import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
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
    <div style="position:relative;padding-top:32px;padding-bottom:64px;">

      <!-- Ambient backdrop -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div class="neo-grid-bg absolute inset-0 opacity-40"></div>
        <span class="neo-orb red"    style="width:500px;height:500px;top:-15%;left:-5%;opacity:0.25;"></span>
        <span class="neo-orb violet" style="width:400px;height:400px;top:30%;right:-5%;opacity:0.20;animation-delay:2s;"></span>
      </div>

      <div class="relative max-w-7xl mx-auto px-6">

        <!-- ── TITLE ROW ──────────────────────────────────────────── -->
        <div class="neo-reveal flex justify-between items-end mb-6 flex-wrap gap-4">
          <div>
            <p class="neo-stat-label">Catálogo</p>
            <h1 class="font-display text-[40px] font-bold tracking-[-0.02em] mt-1">
              {{ activeCategoryName() ?? 'Todos los productos' }}
            </h1>
            <p class="text-[13px] text-text-muted mt-1">
              @if (page()) {
                {{ page()!.totalElements | number:'1.0-0':'es-CO' }} resultado{{ page()!.totalElements === 1 ? '' : 's' }}
              }
              @if (searchQuery) {
                · "{{ searchQuery }}"
              }
            </p>
          </div>

          <!-- Sort + View toggle -->
          <div class="flex items-center gap-2">
            <div class="relative">
              <ng-icon name="lucideArrowUpNarrowWide" size="14"
                       class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <ng-icon name="lucideChevronDown" size="14"
                       class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <select [(ngModel)]="sortValue" (ngModelChange)="onSort($event)"
                      class="h-[38px] pl-9 pr-8 rounded-[10px] bg-bg-elevated border border-border-strong
                             text-[13px] text-text-secondary outline-none cursor-pointer appearance-none
                             focus:border-accent transition-colors">
                <option value="">Más relevantes</option>
                <option value="finalPrice,asc">Precio: menor a mayor</option>
                <option value="finalPrice,desc">Precio: mayor a menor</option>
                <option value="name,asc">Nombre A-Z</option>
              </select>
            </div>

            <div class="flex border border-border rounded-[10px] p-[3px] bg-bg-surface">
              <button (click)="viewMode.set('grid')" aria-label="Vista cuadrícula"
                      class="w-8 h-8 rounded-[7px] flex items-center justify-center transition-colors"
                      [class.bg-bg-elevated]="viewMode() === 'grid'"
                      [class.text-text-primary]="viewMode() === 'grid'"
                      [class.text-text-muted]="viewMode() !== 'grid'">
                <ng-icon name="lucideLayoutGrid" size="14" />
              </button>
              <button (click)="viewMode.set('list')" aria-label="Vista lista"
                      class="w-8 h-8 rounded-[7px] flex items-center justify-center transition-colors"
                      [class.bg-bg-elevated]="viewMode() === 'list'"
                      [class.text-text-primary]="viewMode() === 'list'"
                      [class.text-text-muted]="viewMode() !== 'list'">
                <ng-icon name="lucideList" size="14" />
              </button>
            </div>
          </div>
        </div>

        <!-- ── CHIP RAIL ──────────────────────────────────────────── -->
        <div class="neo-reveal flex flex-wrap gap-2 mb-6">
          <a routerLink="/catalog"
             class="neo-chip" [class.neo-chip-active]="!activeCategoryId()">
            <ng-icon name="lucideSparkles" size="12" /> Todo
          </a>
          @for (cat of categories(); track cat.id) {
            <a [routerLink]="['/catalog/category', cat.id]"
               class="neo-chip" [class.neo-chip-active]="activeCategoryId() === cat.id">
              {{ cat.name }}
            </a>
          }
        </div>

        <div class="flex gap-6">

          <!-- ── FILTERS SIDEBAR ────────────────────────────────────── -->
          <aside class="hidden lg:block w-[240px] shrink-0">
            <div class="neo-card-premium p-[18px] sticky top-[88px]">
              <div class="flex justify-between items-center mb-3">
                <p class="neo-stat-label">Filtros</p>
                <button (click)="clearFilters()"
                        class="text-[12px] text-text-muted hover:text-text-primary transition-colors px-2 py-0.5 rounded">
                  Limpiar
                </button>
              </div>

              <!-- Price range -->
              <div class="mb-5">
                <p class="text-[12px] font-semibold text-text-primary mb-2.5">Precio (COP)</p>
                <div class="flex gap-2">
                  <input [(ngModel)]="priceMin" (ngModelChange)="onPriceFilter()"
                         placeholder="Mín" type="number"
                         class="h-[34px] w-full rounded-lg bg-bg-elevated border border-border text-[13px]
                                text-text-primary px-3 outline-none focus:border-accent transition-colors
                                placeholder:text-text-muted" />
                  <input [(ngModel)]="priceMax" (ngModelChange)="onPriceFilter()"
                         placeholder="Máx" type="number"
                         class="h-[34px] w-full rounded-lg bg-bg-elevated border border-border text-[13px]
                                text-text-primary px-3 outline-none focus:border-accent transition-colors
                                placeholder:text-text-muted" />
                </div>
                <div class="relative h-1 bg-bg-elevated rounded-full mt-3.5">
                  <div class="absolute left-[20%] right-[30%] top-0 bottom-0 bg-accent rounded-full"
                       style="box-shadow: 0 0 12px var(--color-accent-glow)"></div>
                </div>
              </div>

              <!-- Categories -->
              <div>
                <p class="text-[12px] font-semibold text-text-primary mb-2.5">Categoría</p>
                <nav class="flex flex-col gap-0.5">
                  <a routerLink="/catalog"
                     class="text-[13px] px-2 py-1.5 rounded-lg transition-colors border-l-2"
                     [class.border-accent]="!activeCategoryId()"
                     [class.text-accent]="!activeCategoryId()"
                     [class.bg-bg-elevated]="!activeCategoryId()"
                     [class.border-transparent]="!!activeCategoryId()"
                     [class.text-text-secondary]="!!activeCategoryId()">
                    Todos
                  </a>
                  @for (cat of categories(); track cat.id) {
                    <a [routerLink]="['/catalog/category', cat.id]"
                       class="text-[13px] px-2 py-1.5 rounded-lg transition-colors border-l-2"
                       [class.border-accent]="activeCategoryId() === cat.id"
                       [class.text-accent]="activeCategoryId() === cat.id"
                       [class.bg-bg-elevated]="activeCategoryId() === cat.id"
                       [class.border-transparent]="activeCategoryId() !== cat.id"
                       [class.text-text-secondary]="activeCategoryId() !== cat.id">
                      {{ cat.name }}
                    </a>
                    @for (sub of cat.children; track sub.id) {
                      <a [routerLink]="['/catalog/category', sub.id]"
                         class="text-[13px] px-2 py-1.5 pl-5 rounded-lg transition-colors border-l-2"
                         [class.border-accent]="activeCategoryId() === sub.id"
                         [class.text-accent]="activeCategoryId() === sub.id"
                         [class.bg-bg-elevated]="activeCategoryId() === sub.id"
                         [class.border-transparent]="activeCategoryId() !== sub.id"
                         [class.text-text-secondary]="activeCategoryId() !== sub.id">
                        {{ sub.name }}
                      </a>
                    }
                  }
                </nav>
              </div>
            </div>
          </aside>

          <!-- ── PRODUCT GRID ─────────────────────────────────────── -->
          <div class="flex-1 min-w-0">

            @if (loading()) {
              <div [class]="viewMode() === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[18px]'
                : 'flex flex-col gap-4'">
                @for (_ of skeletons; track $index) {
                  <div class="aspect-square neo-skeleton"></div>
                }
              </div>

            } @else if (products().length === 0) {
              <div class="neo-card-premium flex flex-col items-center gap-3 py-20 px-6 text-center">
                <div class="w-16 h-16 rounded-full bg-bg-elevated border border-border
                            flex items-center justify-center text-text-muted">
                  <ng-icon name="lucideClipboardX" size="28" />
                </div>
                <p class="font-medium text-text-primary text-base">Sin resultados</p>
                <p class="text-[13px] text-text-secondary max-w-xs">
                  Prueba con otros términos o quita filtros para ampliar la búsqueda.
                </p>
                <a routerLink="/catalog" (click)="clearFilters()"
                   class="neo-btn-outline !py-2 !px-4 !text-[13px] mt-1">
                  Limpiar todo
                </a>
              </div>

            } @else {
              <div class="neo-stagger"
                   [class]="viewMode() === 'grid'
                     ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[18px]'
                     : 'flex flex-col gap-4'">
                @for (p of products(); track p.id) {
                  <div class="neo-reveal">
                    <app-product-card [product]="p" />
                  </div>
                }
              </div>

              <!-- Pagination -->
              @if (page() && page()!.totalPages > 1) {
                <div class="flex items-center justify-center gap-2 mt-10">
                  <button [disabled]="page()!.first"
                          (click)="goToPage(currentPage() - 1)"
                          class="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border-strong
                                 text-sm text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed
                                 hover:border-accent/60 hover:text-text-primary transition-colors">
                    <ng-icon name="lucideChevronLeft" size="14" /> Anterior
                  </button>
                  <span class="text-sm text-text-muted px-2">
                    {{ currentPage() + 1 }} / {{ page()!.totalPages }}
                  </span>
                  <button [disabled]="page()!.last"
                          (click)="goToPage(currentPage() + 1)"
                          class="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border-strong
                                 text-sm text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed
                                 hover:border-accent/60 hover:text-text-primary transition-colors">
                    Siguiente <ng-icon name="lucideChevronRight" size="14" />
                  </button>
                </div>
              }
            }

          </div>
        </div>
      </div>
    </div>
  `,
})
export class CatalogPageComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();
  private search$ = new Subject<string>();

  products = signal<ProductSummary[]>([]);
  categories = signal<Category[]>([]);
  page = signal<PageResponse<ProductSummary> | null>(null);
  loading = signal(true);
  currentPage = signal(0);
  activeCategoryId = signal<string | null>(null);
  viewMode = signal<'grid' | 'list'>('grid');
  searchQuery = '';
  sortValue = '';
  priceMin = '';
  priceMax = '';

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

    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((qp) => {
      const q = qp.get('q') ?? '';
      if (q !== this.searchQuery) {
        this.searchQuery = q;
        this.currentPage.set(0);
        this.loadProducts(q || undefined);
      }
    });

    this.search$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe((q) => {
      this.currentPage.set(0);
      this.loadProducts(q || undefined);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(q: string): void { this.search$.next(q.trim()); }

  onSort(_: string): void {
    this.currentPage.set(0);
    this.loadProducts(this.searchQuery.trim() || undefined);
  }

  onPriceFilter(): void {
    this.currentPage.set(0);
    this.loadProducts(this.searchQuery.trim() || undefined);
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.sortValue = '';
    this.priceMin = '';
    this.priceMax = '';
    this.currentPage.set(0);
    this.loadProducts();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadProducts(this.searchQuery.trim() || undefined);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private loadProducts(q?: string): void {
    this.loading.set(true);
    const page = this.currentPage();
    const categoryId = this.activeCategoryId();
    const sort = this.sortValue || undefined;

    const request$ = q
      ? this.productService.search(q, { page, sort })
      : categoryId
        ? this.productService.getByCategory(categoryId, { page, sort })
        : this.productService.getCatalog({ page, sort });

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
