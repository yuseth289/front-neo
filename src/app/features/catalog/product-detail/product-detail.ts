import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { NgIcon } from '@ng-icons/core';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { ProductService } from '../../../core/catalog/product.service';
import { ReviewService } from '../../../core/catalog/review.service';
import { WishlistService } from '../../../core/account/wishlist.service';
import { ProductDetail, Review, RatingSummary } from '../../../shared/models/catalog.models';
import { Wishlist } from '../../../shared/models/wishlist.models';
import * as CartActions from '../../../core/cart/store/cart.actions';
import { selectAddingProductId, selectCartError } from '../../../core/cart/store/cart.selectors';
import { selectIsAuthenticated } from '../../../core/auth/store/auth.selectors';

const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzFBMUExQSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNTU1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U2luIGltYWdlbjwvdGV4dD48L3N2Zz4=';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon, CopCurrencyPipe],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">

      @if (loading()) {
        <!-- Skeleton -->
        <div class="grid md:grid-cols-2 gap-10 animate-pulse">
          <div class="aspect-square rounded-xl bg-bg-surface border border-border"></div>
          <div class="flex flex-col gap-4 pt-2">
            <div class="h-4 w-24 rounded bg-bg-surface"></div>
            <div class="h-8 w-3/4 rounded bg-bg-surface"></div>
            <div class="h-6 w-1/3 rounded bg-bg-surface"></div>
            <div class="h-12 w-full rounded-lg bg-bg-surface mt-4"></div>
          </div>
        </div>

      } @else if (notFound()) {
        <div class="flex flex-col items-center gap-4 py-24 text-text-muted">
          <ng-icon name="lucideTriangleAlert" size="48" />
          <p class="text-lg font-medium text-text-primary">Producto no encontrado</p>
          <a routerLink="/catalog" class="text-accent hover:text-accent-hover text-sm">
            Volver al catálogo
          </a>
        </div>

      } @else if (product()) {
        <div class="grid md:grid-cols-2 gap-10">

          <!-- ── GALERÍA ──────────────────────────────────────────────── -->
          <div class="flex flex-col gap-3">
            <!-- Imagen principal -->
            <div class="aspect-square rounded-xl overflow-hidden bg-bg-surface border border-border">
              <img
                [src]="activeImage()"
                [alt]="product()!.name"
                class="w-full h-full object-cover"
              />
            </div>
            <!-- Thumbnails -->
            @if (product()!.images.length > 1) {
              <div class="flex gap-2 overflow-x-auto pb-1">
                @for (img of product()!.images; track img.id) {
                  <button
                    (click)="selectedImageIndex.set($index)"
                    class="w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors"
                    [class.border-accent]="selectedImageIndex() === $index"
                    [class.border-border]="selectedImageIndex() !== $index">
                    <img [src]="img.url" [alt]="img.altText ?? product()!.name" class="w-full h-full object-cover" />
                  </button>
                }
              </div>
            }
          </div>

          <!-- ── INFO ────────────────────────────────────────────────── -->
          <div class="flex flex-col gap-4">

            <!-- Breadcrumb + marca -->
            <div class="flex items-center gap-2 text-xs text-text-muted">
              <a routerLink="/catalog" class="hover:text-accent transition-colors">Catálogo</a>
              <ng-icon name="lucideChevronRight" size="12" />
              <span>{{ product()!.brand }}</span>
            </div>

            <h1 class="text-2xl font-bold text-text-primary leading-tight">
              {{ product()!.name }}
            </h1>

            <!-- Rating -->
            @if (ratingSummary()) {
              <div class="flex items-center gap-2">
                <div class="flex gap-0.5">
                  @for (star of stars(); track $index) {
                    <ng-icon name="lucideStar" size="14"
                             [class.text-star]="star === 'full'"
                             [class.text-text-muted]="star === 'empty'" />
                  }
                </div>
                <span class="text-sm text-text-secondary">
                  {{ ratingSummary()!.averageRating | number:'1.1-1' }}
                  ({{ ratingSummary()!.totalReviews }} reseñas)
                </span>
              </div>
            }

            <!-- Precio -->
            <div class="flex flex-col gap-0.5">
              <p class="text-3xl font-black text-text-primary">
                {{ product()!.finalPrice | copCurrency }}
              </p>
              <p class="text-xs text-text-muted">
                Base: {{ product()!.basePrice | copCurrency }} + IVA {{ product()!.ivaPercent }}%
              </p>
            </div>

            <!-- SKU -->
            <p class="text-xs text-text-muted">SKU: {{ product()!.sku }}</p>

            <!-- CTA -->
            <div class="flex flex-col gap-3 mt-2">
              @if (cartError()) {
                <p class="text-xs text-error">{{ cartError() }}</p>
              }
              @if (addedFeedback()) {
                <p class="text-xs text-success flex items-center gap-1">
                  <ng-icon name="lucideCircleCheck" size="14" />
                  ¡Agregado al carrito!
                </p>
              }
              <button
                (click)="addToCart()"
                [disabled]="isAdding()"
                class="w-full py-3 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed
                       font-semibold text-white text-sm transition-colors
                       shadow-[0_0_20px_theme(colors.accent-glow)] flex items-center justify-center gap-2">
                @if (isAdding()) {
                  <ng-icon name="lucideRefreshCw" size="16" class="animate-spin" />
                  Agregando...
                } @else {
                  <ng-icon name="lucideShoppingCart" size="18" />
                  Agregar al carrito
                }
              </button>
              <!-- Wishlist picker -->
              <div class="relative">
                <button (click)="toggleWishlistPanel()"
                  class="w-full py-2.5 rounded-lg border border-border hover:border-accent/50 text-text-secondary
                         hover:text-accent text-sm transition-colors flex items-center justify-center gap-2">
                  <ng-icon name="lucideHeart" size="16" />
                  Guardar en wishlist
                </button>

                @if (wishlistPanelOpen()) {
                  <div class="absolute top-full left-0 right-0 mt-1 z-20 bg-bg-surface border border-border
                              rounded-xl shadow-lg overflow-hidden">
                    @if (!isAuthenticated()) {
                      <div class="px-4 py-3 text-sm text-text-muted text-center">
                        <a routerLink="/login" class="text-accent hover:underline">Inicia sesión</a> para guardar productos
                      </div>
                    } @else if (wishlistsLoading()) {
                      <div class="px-4 py-3 text-sm text-text-muted text-center">Cargando...</div>
                    } @else if (wishlists().length === 0) {
                      <div class="px-4 py-3 text-center">
                        <p class="text-sm text-text-muted mb-2">No tienes wishlists todavía</p>
                        <a routerLink="/wishlists" (click)="wishlistPanelOpen.set(false)"
                          class="text-xs text-accent hover:underline">Crear una wishlist</a>
                      </div>
                    } @else {
                      <ul class="py-1 max-h-48 overflow-y-auto">
                        @for (wl of wishlists(); track wl.id) {
                          <li>
                            <button (click)="addToWishlist(wl.id)"
                              [disabled]="addingToWishlistId() === wl.id"
                              class="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-bg-elevated
                                     transition-colors flex items-center justify-between gap-2 disabled:opacity-50">
                              <span class="truncate">{{ wl.name }}</span>
                              @if (addingToWishlistId() === wl.id) {
                                <ng-icon name="lucideRefreshCw" size="13" class="animate-spin text-text-muted shrink-0" />
                              } @else if (wishlistAddedIds().has(wl.id)) {
                                <ng-icon name="lucideCheck" size="13" class="text-green-400 shrink-0" />
                              }
                            </button>
                          </li>
                        }
                      </ul>
                    }
                  </div>
                }
              </div>
            </div>

            <!-- Descripción -->
            @if (product()!.description) {
              <div class="mt-4 pt-4 border-t border-border">
                <h2 class="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">Descripción</h2>
                <p class="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                  {{ product()!.description }}
                </p>
              </div>
            }

          </div>
        </div>

        <!-- ── RESEÑAS ──────────────────────────────────────────────────── -->
        <div class="mt-12 pt-8 border-t border-border">
          <h2 class="text-xl font-bold text-text-primary mb-6">Reseñas de clientes</h2>

          @if (reviewsLoading()) {
            <div class="space-y-4">
              @for (_ of [1,2,3]; track $index) {
                <div class="rounded-xl bg-bg-surface border border-border p-5 animate-pulse h-24"></div>
              }
            </div>
          } @else if (reviews().length === 0) {
            <p class="text-text-muted text-sm">Este producto aún no tiene reseñas.</p>
          } @else {
            <div class="space-y-4">
              @for (review of reviews(); track review.id) {
                <div class="rounded-xl bg-bg-surface border border-border p-5">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex flex-col gap-1">
                      <div class="flex items-center gap-2">
                        <div class="flex gap-0.5">
                          @for (i of [1,2,3,4,5]; track i) {
                            <ng-icon name="lucideStar" size="12"
                                     [class.text-star]="i <= review.rating"
                                     [class.text-text-muted]="i > review.rating" />
                          }
                        </div>
                        <span class="text-sm font-medium text-text-primary">{{ review.title }}</span>
                      </div>
                      <p class="text-sm text-text-secondary">{{ review.body }}</p>
                    </div>
                    <span class="text-xs text-text-muted shrink-0">{{ review.buyerName }}</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>

      }
    </div>
  `,
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private reviewService = inject(ReviewService);
  private wishlistService = inject(WishlistService);
  private store = inject(Store);

  product = signal<ProductDetail | null>(null);
  ratingSummary = signal<RatingSummary | null>(null);
  reviews = signal<Review[]>([]);
  loading = signal(true);
  reviewsLoading = signal(true);
  notFound = signal(false);
  selectedImageIndex = signal(0);
  addedFeedback = signal(false);

  // Wishlist panel
  wishlistPanelOpen = signal(false);
  wishlists = signal<Wishlist[]>([]);
  wishlistsLoading = signal(false);
  addingToWishlistId = signal<string | null>(null);
  wishlistAddedIds = signal<Set<string>>(new Set());

  isAdding = computed(() => {
    const pid = this.product()?.id;
    return pid ? this.store.selectSignal(selectAddingProductId)() === pid : false;
  });
  cartError = this.store.selectSignal(selectCartError);
  isAuthenticated = this.store.selectSignal(selectIsAuthenticated);

  activeImage = computed(() => {
    const p = this.product();
    if (!p || p.images.length === 0) return PLACEHOLDER;
    return p.images[this.selectedImageIndex()]?.url ?? PLACEHOLDER;
  });

  stars = computed(() => {
    const avg = this.ratingSummary()?.averageRating ?? 0;
    return [1, 2, 3, 4, 5].map((i) => (i <= Math.round(avg) ? 'full' : 'empty'));
  });

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';

    this.productService.getBySlug(slug).subscribe({
      next: (res) => {
        this.product.set(res.data);
        this.loading.set(false);

        const primaryIdx = res.data.images.findIndex((img) => img.primary);
        this.selectedImageIndex.set(primaryIdx >= 0 ? primaryIdx : 0);

        this.loadReviews(res.data.id);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  addToCart(): void {
    const p = this.product();
    if (!p) return;
    this.store.dispatch(CartActions.addItem({ request: { productId: p.id, quantity: 1 } }));
    this.addedFeedback.set(true);
    setTimeout(() => this.addedFeedback.set(false), 2500);
  }

  toggleWishlistPanel(): void {
    const next = !this.wishlistPanelOpen();
    this.wishlistPanelOpen.set(next);
    if (next && this.wishlists().length === 0 && this.isAuthenticated()) {
      this.wishlistsLoading.set(true);
      this.wishlistService.getAll().subscribe({
        next: (res) => { this.wishlists.set(res.data); this.wishlistsLoading.set(false); },
        error: () => this.wishlistsLoading.set(false),
      });
    }
  }

  addToWishlist(wishlistId: string): void {
    const p = this.product();
    if (!p) return;
    this.addingToWishlistId.set(wishlistId);
    this.wishlistService.addItem(wishlistId, p.id).subscribe({
      next: () => {
        this.addingToWishlistId.set(null);
        this.wishlistAddedIds.update(s => new Set([...s, wishlistId]));
        setTimeout(() => this.wishlistPanelOpen.set(false), 800);
      },
      error: () => this.addingToWishlistId.set(null),
    });
  }

  private loadReviews(productId: string): void {
    this.reviewService.getRatingSummary(productId).subscribe({
      next: (res) => this.ratingSummary.set(res.data),
      error: () => {},
    });

    this.reviewService.getProductReviews(productId).subscribe({
      next: (res) => {
        this.reviews.set(res.data.content);
        this.reviewsLoading.set(false);
      },
      error: () => this.reviewsLoading.set(false),
    });
  }
}
