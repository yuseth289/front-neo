import { ApplicationRef, Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, combineLatest, debounceTime, distinctUntilChanged, skip, takeUntil } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';
import { ProductService } from '../../../core/catalog/product.service';
import { CategoryService } from '../../../core/catalog/category.service';
import { BrandService } from '../../../core/catalog/brand.service';
import { SellerService } from '../../../core/seller/seller.service';
import { ProductSummary, Category, Brand } from '../../../shared/models/catalog.models';
import { PublicSellerResponse } from '../../../shared/models/seller.models';
import { PageResponse } from '../../../shared/models/api.models';
import { Store } from '@ngrx/store';
import * as CartActions from '../../../core/cart/store/cart.actions';
import { selectIsAuthenticated } from '../../../core/auth/store/auth.selectors';
import { WishlistStateService } from '../../../core/account/wishlist-state.service';

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NgIcon, ProductCardComponent],
  styles: [`
    .price-thumb {
      -webkit-appearance: none; appearance: none;
      position: absolute; width: 100%; height: 0;
      background: transparent; pointer-events: none; outline: none;
    }
    .price-thumb::-webkit-slider-thumb {
      -webkit-appearance: none; appearance: none;
      width: 18px; height: 18px; border-radius: 50%; cursor: pointer;
      pointer-events: all; position: relative; z-index: 1;
      background: var(--color-accent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 25%, transparent),
                  0 0 12px var(--color-accent-glow);
      border: 2px solid var(--color-bg-surface);
      transition: box-shadow 0.15s;
    }
    .price-thumb::-moz-range-thumb {
      width: 18px; height: 18px; border-radius: 50%; cursor: pointer;
      pointer-events: all;
      background: var(--color-accent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 25%, transparent);
      border: 2px solid var(--color-bg-surface);
    }
    .price-thumb::-webkit-slider-thumb:hover {
      box-shadow: 0 0 0 5px color-mix(in srgb, var(--color-accent) 20%, transparent),
                  0 0 18px var(--color-accent-glow);
    }
  `],
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

        <!-- ── STORE RESULTS ─────────────────────────────────────────── -->
        @if (searchQuery && (stores().length > 0 || loadingStores())) {
          <div class="neo-reveal mb-6">
            <div class="flex items-center justify-between mb-3">
              <p class="neo-stat-label flex items-center gap-2">
                <ng-icon name="lucideStore" size="14" class="text-accent" />
                Tiendas encontradas
                @if (!loadingStores() && stores().length > 0) {
                  <span class="px-2 py-0.5 rounded-md bg-bg-elevated border border-border
                               text-[11px] font-mono text-text-muted normal-case tracking-normal font-normal">
                    {{ stores().length }}
                  </span>
                }
              </p>
            </div>

            @if (loadingStores()) {
              <div class="flex gap-3 overflow-x-auto pb-1">
                @for (_ of [1,2,3,4]; track $index) {
                  <div class="shrink-0 w-52 h-24 rounded-xl bg-bg-surface border border-border animate-pulse"></div>
                }
              </div>
            } @else {
              <div class="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                @for (seller of stores(); track seller.id) {
                  <a [routerLink]="['/store', seller.storeSlug]"
                     class="group shrink-0 flex items-center gap-3 px-4 py-3 w-64
                            rounded-xl border border-border bg-bg-surface
                            hover:border-accent/50 hover:bg-bg-elevated
                            transition-all duration-200 cursor-pointer">
                    <!-- Logo -->
                    <div class="w-11 h-11 rounded-xl border border-border bg-bg-elevated
                                overflow-hidden shrink-0 flex items-center justify-center">
                      @if (seller.storeLogoUrl) {
                        <img [src]="seller.storeLogoUrl" [alt]="seller.storeName"
                             class="w-full h-full object-cover" />
                      } @else {
                        <ng-icon name="lucideStore" size="18" class="text-text-muted" />
                      }
                    </div>
                    <!-- Info -->
                    <div class="min-w-0 flex-1">
                      <p class="text-[13px] font-semibold text-text-primary truncate
                                group-hover:text-accent transition-colors">
                        {{ seller.storeName }}
                      </p>
                      @if (seller.averageRating) {
                        <div class="flex items-center gap-1 mt-0.5">
                          <span class="inline-flex gap-px">
                            @for (i of [1,2,3,4,5]; track i) {
                              <ng-icon name="lucideStar" size="10"
                                [class.text-star]="i <= seller.averageRating!"
                                [class.text-border-strong]="i > seller.averageRating!" />
                            }
                          </span>
                          <span class="text-[11px] text-text-muted">{{ seller.averageRating | number:'1.1-1' }}</span>
                        </div>
                      }
                      <p class="text-[11px] text-text-muted mt-0.5 truncate">
                        <ng-icon name="lucideMapPin" size="10" class="inline mr-0.5" />
                        {{ seller.city }}
                      </p>
                    </div>
                    <ng-icon name="lucideChevronRight" size="14" class="text-text-muted shrink-0
                              group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                  </a>
                }
              </div>
            }

            <div class="mt-4 border-t border-border"></div>
          </div>
        }

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

              <!-- Price range slider -->
              <div class="mb-5">
                <div class="flex items-center justify-between mb-2">
                  <p class="text-[12px] font-semibold text-text-primary">Precio (COP)</p>
                  @if (sliderMin > PRICE_MIN || sliderMax < PRICE_MAX) {
                    <button (click)="resetPrice()"
                      class="text-[11px] text-accent hover:opacity-70 transition-opacity">
                      Limpiar
                    </button>
                  }
                </div>

                <!-- Valores actuales -->
                <div class="flex items-center justify-between mb-3 font-mono tabular-nums text-[12px] text-text-secondary">
                  <span>{{ fmtPrice(sliderMin) }}</span>
                  <span>{{ fmtPrice(sliderMax) }}</span>
                </div>

                <!-- Dual range slider -->
                <div class="relative h-5 flex items-center">
                  <!-- Track base -->
                  <div class="absolute left-0 right-0 h-1 rounded-full bg-bg-elevated"></div>
                  <!-- Track fill -->
                  <div class="absolute h-1 rounded-full pointer-events-none"
                       [style.left]="leftPct() + '%'"
                       [style.right]="(100 - rightPct()) + '%'"
                       style="background:var(--color-accent);box-shadow:0 0 10px var(--color-accent-glow)"></div>
                  <!-- Min thumb -->
                  <input type="range" class="price-thumb"
                         [min]="PRICE_MIN" [max]="PRICE_MAX" [step]="PRICE_STEP"
                         [value]="sliderMin"
                         (input)="onSliderMin($event)" />
                  <!-- Max thumb -->
                  <input type="range" class="price-thumb"
                         [min]="PRICE_MIN" [max]="PRICE_MAX" [step]="PRICE_STEP"
                         [value]="sliderMax"
                         (input)="onSliderMax($event)" />
                </div>

                <!-- Límites del rango -->
                <div class="flex items-center justify-between mt-2 text-[10px] text-text-muted font-mono">
                  <span>{{ fmtPrice(PRICE_MIN) }}</span>
                  <span>{{ fmtPrice(PRICE_MAX) }}</span>
                </div>
              </div>

              <!-- Marca -->
              <div class="mb-5">
                <p class="text-[12px] font-semibold text-text-primary mb-2.5">Marca</p>
                <div class="flex flex-col gap-1.5">
                  @for (brand of brands(); track brand.id) {
                    <label class="flex items-center gap-2 text-[13px] text-text-secondary cursor-pointer
                                  hover:text-text-primary transition-colors">
                      <input type="checkbox"
                             [checked]="selectedBrands.has(brand.name)"
                             (change)="toggleBrand(brand.name)"
                             class="rounded" style="accent-color: var(--color-accent);" />
                      {{ brand.name }}
                    </label>
                  }
                </div>
              </div>

              <!-- Calificación -->
              <div class="mb-5">
                <p class="text-[12px] font-semibold text-text-primary mb-2.5">Calificación</p>
                <div class="flex flex-col gap-1.5">
                  @for (r of [5,4,3]; track r) {
                    <label class="flex items-center gap-2 text-[13px] text-text-secondary cursor-pointer
                                  hover:text-text-primary transition-colors">
                      <input type="checkbox"
                             [checked]="selectedRatings.has(r)"
                             (change)="toggleRating(r)"
                             style="accent-color: var(--color-accent);" />
                      <span class="inline-flex gap-px">
                        @for (i of [1,2,3,4,5]; track i) {
                          <ng-icon name="lucideStar" size="11"
                            [class.text-star]="i <= r"
                            [class.text-border-strong]="i > r" />
                        }
                      </span>
                      <span class="text-[11px] text-text-muted">y más</span>
                    </label>
                  }
                </div>
              </div>

              <!-- Categorías -->
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
                    <app-product-card [product]="p"
                      [inWishlist]="wishlistState.isInWishlist(p.id)"
                      (addToCart)="onAddToCart($event)"
                      (quickView)="onQuickView($event)"
                      (favorite)="onFavorite($event)" />
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
  private productService  = inject(ProductService);
  private categoryService = inject(CategoryService);
  private brandService    = inject(BrandService);
  private sellerService   = inject(SellerService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private appRef = inject(ApplicationRef);
  private store  = inject(Store);
  readonly isAuthenticated = this.store.selectSignal(selectIsAuthenticated);
  readonly wishlistState   = inject(WishlistStateService);
  private destroy$ = new Subject<void>();
  private search$ = new Subject<string>();

  products      = signal<ProductSummary[]>([]);
  stores        = signal<PublicSellerResponse[]>([]);
  categories    = signal<Category[]>([]);
  brands        = signal<Brand[]>([]);
  page          = signal<PageResponse<ProductSummary> | null>(null);
  loading       = signal(true);
  loadingStores = signal(false);
  currentPage   = signal(0);
  activeCategoryId = signal<string | null>(null);
  viewMode = signal<'grid' | 'list'>('grid');
  searchQuery = '';
  sortValue = '';
  priceMin = '';
  priceMax = '';

  readonly PRICE_MIN  = 0;
  readonly PRICE_MAX  = 5_000_000;
  readonly PRICE_STEP = 50_000;
  sliderMin = 0;
  sliderMax = 5_000_000;

  leftPct():  number { return (this.sliderMin / this.PRICE_MAX) * 100; }
  rightPct(): number { return (this.sliderMax / this.PRICE_MAX) * 100; }

  fmtPrice(v: number): string {
    return '$ ' + v.toLocaleString('es-CO');
  }

  onSliderMin(e: Event): void {
    const val = +(e.target as HTMLInputElement).value;
    this.sliderMin = Math.min(val, this.sliderMax - this.PRICE_STEP);
    this.priceMin  = this.sliderMin > 0 ? String(this.sliderMin) : '';
    this.onPriceFilter();
  }

  onSliderMax(e: Event): void {
    const val = +(e.target as HTMLInputElement).value;
    this.sliderMax = Math.max(val, this.sliderMin + this.PRICE_STEP);
    this.priceMax  = this.sliderMax < this.PRICE_MAX ? String(this.sliderMax) : '';
    this.onPriceFilter();
  }

  resetPrice(): void {
    this.sliderMin = this.PRICE_MIN;
    this.sliderMax = this.PRICE_MAX;
    this.priceMin  = '';
    this.priceMax  = '';
    this.onPriceFilter();
  }

  selectedBrands = new Set<string>();
  selectedRatings = new Set<number>();

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

    this.brandService.getActive().subscribe({
      next: (res) => this.brands.set(res.data),
      error: () => {},
    });

    // Carga inicial usando snapshot (siempre sincrónico, no depende de observables)
    const snap = this.route.snapshot;
    const initCategoryId = snap.paramMap.get('categoryId');
    const initQ = snap.queryParamMap.get('q') ?? '';
    this.activeCategoryId.set(initCategoryId);
    this.searchQuery = initQ;
    this.currentPage.set(0);
    this.loadProducts(initQ || undefined);

    // Reacciona a cambios de ruta posteriores (cuando el mismo componente se reutiliza)
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(skip(1), takeUntil(this.destroy$))
      .subscribe(([params, qp]) => {
        const categoryId = params.get('categoryId');
        const q = qp.get('q') ?? '';
        this.activeCategoryId.set(categoryId);
        this.currentPage.set(0);
        this.searchQuery = q;
        this.loadProducts(q || undefined);
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

  toggleBrand(brand: string): void {
    if (this.selectedBrands.has(brand)) this.selectedBrands.delete(brand);
    else this.selectedBrands.add(brand);
    this.selectedBrands = new Set(this.selectedBrands);
    this.currentPage.set(0);
    this.loadProducts(this.searchQuery.trim() || undefined);
  }

  toggleRating(r: number): void {
    if (this.selectedRatings.has(r)) this.selectedRatings.delete(r);
    else this.selectedRatings.add(r);
    this.selectedRatings = new Set(this.selectedRatings);
    this.currentPage.set(0);
    this.loadProducts(this.searchQuery.trim() || undefined);
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.sortValue = '';
    this.priceMin  = '';
    this.priceMax  = '';
    this.sliderMin = this.PRICE_MIN;
    this.sliderMax = this.PRICE_MAX;
    this.selectedBrands = new Set();
    this.selectedRatings = new Set();
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

    if (q) {
      this.loadingStores.set(true);
      this.sellerService.searchStores(q).subscribe({
        next: (res) => { this.stores.set(res.data.content); this.loadingStores.set(false); },
        error: () => { this.stores.set([]); this.loadingStores.set(false); },
      });
    } else {
      this.stores.set([]);
    }

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
        this.appRef.tick();
      },
      error: () => {
        this.loading.set(false);
        this.appRef.tick();
      },
    });
  }

  onAddToCart(product: ProductSummary): void {
    this.store.dispatch(CartActions.addItem({ request: { productId: product.id, quantity: 1 } }));
  }

  onQuickView(product: ProductSummary): void {
    this.router.navigate(['/product', product.slug]);
  }

  onFavorite(product: ProductSummary): void {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.wishlistState.toggle(product.id);
  }
}
