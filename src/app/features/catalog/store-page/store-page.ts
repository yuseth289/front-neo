import {
  Component, inject, OnInit, signal, input, computed, HostListener, NgZone,
} from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { Store } from '@ngrx/store';
import { SellerService } from '../../../core/seller/seller.service';
import { ProductService } from '../../../core/catalog/product.service';
import { ChatService } from '../../../core/chat/chat.service';
import { CartService } from '../../../core/cart/cart.service';
import { WishlistStateService } from '../../../core/account/wishlist-state.service';
import { PublicSellerResponse } from '../../../shared/models/seller.models';
import { ProductSummary } from '../../../shared/models/catalog.models';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';
import { selectIsAuthenticated, selectRole } from '../../../core/auth/store/auth.selectors';
import * as CartActions from '../../../core/cart/store/cart.actions';

@Component({
  selector: 'app-store-page',
  standalone: true,
  imports: [CommonModule, NgClass, RouterLink, FormsModule, NgIcon, ProductCardComponent],
  template: `
    <!-- ── LOADING ───────────────────────────────────────────────────── -->
    @if (loadingStore()) {
      <div class="animate-pulse">
        <div class="w-full h-56 bg-bg-surface"></div>
        <div class="max-w-7xl mx-auto px-6 -mt-12">
          <div class="flex items-end gap-4 mb-6">
            <div class="w-20 h-20 rounded-2xl bg-bg-elevated border border-border shrink-0"></div>
            <div class="flex-1 space-y-2 pb-1">
              <div class="h-5 w-48 rounded bg-bg-elevated"></div>
              <div class="h-3 w-32 rounded bg-bg-elevated"></div>
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-10">
            @for (_ of [1,2,3,4,5,6,7,8,9,10]; track $index) {
              <div class="h-64 rounded-xl bg-bg-surface border border-border"></div>
            }
          </div>
        </div>
      </div>
    }

    <!-- ── NOT FOUND ─────────────────────────────────────────────────── -->
    @else if (notFound()) {
      <div class="flex flex-col items-center gap-4 py-32 text-text-muted">
        <ng-icon name="lucideStore" size="56" class="opacity-30" />
        <p class="text-lg font-medium text-text-secondary">Tienda no encontrada</p>
        <p class="text-sm">El enlace puede estar desactualizado o la tienda dejó de estar activa.</p>
        <a routerLink="/catalog"
           class="mt-2 px-4 py-2 rounded-[10px] bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors">
          Ver catálogo
        </a>
      </div>
    }

    <!-- ── STORE PAGE ─────────────────────────────────────────────────── -->
    @else if (store()) {

      <!-- HERO BANNER -->
      <div class="relative w-full h-56 overflow-hidden select-none">
        @if (store()!.storeBannerUrl) {
          <img [src]="store()!.storeBannerUrl" alt="" class="w-full h-full object-cover" />
        } @else {
          <!-- Gradient fallback con ruido decorativo -->
          <div class="absolute inset-0 bg-gradient-to-br from-[#120508] via-[#1c0a10] to-[#0d0d13]"></div>
          <div class="absolute inset-0 opacity-[0.03]"
               style="background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC42NSIgbnVtT2N0YXZlcz0iMyIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWx0ZXI9InVybCgjbikiIG9wYWNpdHk9IjEiLz48L3N2Zz4=')"></div>
          <!-- Grid decoration -->
          <svg class="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" stroke-width="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          <!-- Glow orb -->
          <div class="absolute -top-20 left-1/3 w-96 h-96 rounded-full opacity-20"
               style="background: radial-gradient(circle, var(--color-accent) 0%, transparent 70%)"></div>
        }
        <!-- Bottom fade -->
        <div class="absolute inset-x-0 bottom-0 h-32"
             style="background: linear-gradient(to bottom, transparent, var(--color-bg-base))"></div>
        <!-- Top gradient for readability -->
        <div class="absolute inset-x-0 top-0 h-20"
             style="background: linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)"></div>
        <!-- Location pill on banner -->
        @if (store()!.city) {
          <div class="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full
                      bg-black/40 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium">
            <ng-icon name="lucideMapPin" size="11" />
            {{ store()!.city }}, {{ store()!.department }}
          </div>
        }
      </div>

      <!-- STORE IDENTITY -->
      <div class="max-w-7xl mx-auto px-6">
        <div class="-mt-12 relative z-10">

          <!-- Logo + name + actions row -->
          <div class="flex items-end gap-5 flex-wrap">

            <!-- Logo -->
            <div class="w-20 h-20 rounded-2xl border-2 border-border bg-bg-elevated
                        overflow-hidden shrink-0 shadow-[var(--shadow-card-lift)]">
              @if (store()!.storeLogoUrl) {
                <img [src]="store()!.storeLogoUrl" [alt]="store()!.storeName"
                     class="w-full h-full object-cover" />
              } @else {
                <div class="w-full h-full flex items-center justify-center bg-bg-elevated">
                  <ng-icon name="lucideStore" size="28" class="text-text-muted" />
                </div>
              }
            </div>

            <!-- Name + meta -->
            <div class="flex-1 min-w-0 pb-0.5">
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="text-2xl font-bold text-text-primary tracking-tight">
                  {{ store()!.storeName }}
                </h1>
                <!-- Verified badge -->
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                             bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-[11px] font-semibold">
                  <ng-icon name="lucideShieldCheck" size="11" />
                  Verificada
                </span>
              </div>

              <!-- Rating + reviews + sales -->
              <div class="flex items-center gap-3 mt-1.5 flex-wrap">
                @if (store()!.averageRating) {
                  <div class="flex items-center gap-1.5">
                    <span class="inline-flex gap-px">
                      @for (i of [1,2,3,4,5]; track i) {
                        <ng-icon name="lucideStar" size="13"
                          [class.text-star]="i <= (store()!.averageRating ?? 0)"
                          [class.text-border-strong]="i > (store()!.averageRating ?? 0)" />
                      }
                    </span>
                    <span class="text-sm font-semibold text-text-primary">
                      {{ store()!.averageRating | number:'1.1-1' }}
                    </span>
                    <span class="text-xs text-text-muted">
                      ({{ store()!.totalReviews | number }} reseñas)
                    </span>
                  </div>
                } @else {
                  <span class="text-xs text-text-muted italic">Sin reseñas aún</span>
                }

                @if (store()!.totalSales > 0) {
                  <span class="text-text-dim text-xs">·</span>
                  <span class="text-xs text-text-muted">
                    <span class="font-semibold text-text-secondary">{{ formatSales(store()!.totalSales) }}</span>
                    ventas
                  </span>
                }

                <span class="text-text-dim text-xs">·</span>
                <span class="text-xs text-text-muted">
                  <span class="font-semibold text-text-secondary">{{ totalProducts() }}</span>
                  productos
                </span>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center gap-2 pb-0.5 shrink-0">

              <!-- Follow button -->
              <button (click)="toggleFollow()" [disabled]="followLoading()"
                [ngClass]="following()
                  ? 'bg-accent/10 border-accent/40 text-accent'
                  : 'bg-bg-elevated border-border text-text-secondary hover:border-accent/40 hover:text-accent hover:bg-accent/5'"
                class="flex items-center gap-1.5 px-4 py-2 rounded-[10px] border
                       text-[13px] font-medium transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed">
                @if (followLoading()) {
                  <ng-icon name="lucideRefreshCw" size="14" class="neo-spin" />
                } @else {
                  <ng-icon [name]="following() ? 'lucideHeartOff' : 'lucideHeart'" size="14" />
                }
                {{ following() ? 'Siguiendo' : 'Seguir' }}
              </button>

              <!-- Contact button -->
              @if (isBuyer()) {
                <div class="relative" data-chat>
                  <button (click)="chatOpen.set(!chatOpen())"
                    class="flex items-center gap-1.5 px-4 py-2 rounded-[10px] border border-neon-cyan/40
                           bg-neon-cyan/8 text-neon-cyan text-[13px] font-medium
                           hover:bg-neon-cyan/15 hover:border-neon-cyan/60 transition-all duration-200">
                    <ng-icon name="lucideMessageCircle" size="14" />
                    Contactar
                  </button>

                  <!-- Chat dropdown -->
                  @if (chatOpen()) {
                    <div class="absolute top-full right-0 mt-2 z-30 neo-card-premium p-4 w-76
                                shadow-[var(--shadow-card-lift)] border border-border">
                      @if (!isAuthenticated()) {
                        <p class="text-[13px] text-text-muted text-center py-2">
                          <a routerLink="/login" class="text-accent hover:underline">Inicia sesión</a>
                          para contactar esta tienda
                        </p>
                      } @else {
                        <p class="text-[12px] font-medium text-text-secondary mb-2">
                          Mensaje a {{ store()!.storeName }}
                        </p>
                        <textarea
                          [(ngModel)]="chatMessage"
                          placeholder="Hola, me gustaría saber más sobre…"
                          rows="3"
                          class="w-full bg-bg-elevated border border-border rounded-[10px] px-3 py-2
                                 text-[13px] text-text-primary placeholder:text-text-muted outline-none resize-none
                                 focus:border-neon-cyan/60 focus:ring-[3px] focus:ring-neon-cyan/8 transition-all">
                        </textarea>
                        <div class="flex gap-2 mt-2">
                          <button (click)="chatOpen.set(false)"
                            class="flex-1 py-2 rounded-[10px] border border-border text-[12px]
                                   text-text-muted hover:text-text-secondary transition-colors">
                            Cancelar
                          </button>
                          <button (click)="sendChatMessage()"
                            [disabled]="!chatMessage.trim() || chatSending()"
                            class="flex-1 py-2 rounded-[10px] bg-neon-cyan/10 border border-neon-cyan/30
                                   text-[12px] font-medium text-neon-cyan hover:bg-neon-cyan/20
                                   disabled:opacity-40 disabled:cursor-not-allowed transition-all
                                   flex items-center justify-center gap-1.5">
                            @if (chatSending()) {
                              <ng-icon name="lucideRefreshCw" size="12" class="neo-spin" />
                            } @else {
                              <ng-icon name="lucideSend" size="12" />
                            }
                            Enviar
                          </button>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Description -->
          @if (store()!.storeDescription) {
            <p class="mt-4 text-sm text-text-secondary leading-relaxed max-w-2xl">
              {{ store()!.storeDescription }}
            </p>
          }

          <!-- Stats strip -->
          <div class="flex items-center gap-0 mt-5 mb-1 border border-border rounded-xl overflow-hidden
                      bg-bg-surface divide-x divide-border">
            <div class="flex-1 flex flex-col items-center py-3.5 px-4 gap-0.5">
              <span class="text-lg font-bold text-text-primary font-display">
                {{ totalProducts() || '—' }}
              </span>
              <span class="text-[11px] text-text-muted uppercase tracking-wider font-mono">Productos</span>
            </div>
            <div class="flex-1 flex flex-col items-center py-3.5 px-4 gap-0.5">
              <span class="text-lg font-bold text-text-primary font-display">
                {{ store()!.averageRating ? (store()!.averageRating | number:'1.1-1') : '—' }}
              </span>
              <span class="text-[11px] text-text-muted uppercase tracking-wider font-mono">Rating</span>
            </div>
            <div class="flex-1 flex flex-col items-center py-3.5 px-4 gap-0.5">
              <span class="text-lg font-bold text-text-primary font-display">
                {{ formatSales(store()!.totalSales) || '—' }}
              </span>
              <span class="text-[11px] text-text-muted uppercase tracking-wider font-mono">Ventas</span>
            </div>
            <div class="flex-1 flex flex-col items-center py-3.5 px-4 gap-0.5">
              <span class="text-lg font-bold text-text-primary font-display">
                {{ store()!.totalReviews > 0 ? (store()!.totalReviews | number) : '—' }}
              </span>
              <span class="text-[11px] text-text-muted uppercase tracking-wider font-mono">Reseñas</span>
            </div>
          </div>
        </div>

        <!-- ── PRODUCTS SECTION ──────────────────────────────────────── -->
        <div class="mt-8">

          <!-- Section header -->
          <div class="flex items-center justify-between mb-5">
            <div class="flex items-center gap-3">
              <h2 class="neo-stat-label text-text-primary">Productos de la tienda</h2>
              @if (!loadingProducts() && products().length > 0) {
                <span class="px-2 py-0.5 rounded-md bg-bg-elevated border border-border
                             text-[11px] font-mono text-text-muted">
                  {{ totalElements() | number }}
                </span>
              }
            </div>

            <!-- Sort -->
            <select [(ngModel)]="sortBy" (ngModelChange)="onSortChange()"
              class="h-8 pl-3 pr-8 rounded-[10px] bg-bg-elevated border border-border
                     text-[12px] text-text-secondary outline-none cursor-pointer
                     hover:border-border-strong focus:border-accent/50 transition-colors
                     appearance-none bg-no-repeat"
              style="background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMiIgaGVpZ2h0PSI4IiB2aWV3Qm94PSIwIDAgMTIgOCI+PHBhdGggZD0iTTEgMWw1IDUgNS01IiBzdHJva2U9IiM2NjYiIHN0cm9rZS13aWR0aD0iMS41IiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4='); background-position: right 10px center; background-size: 10px;">
              <option value="createdAt,desc">Más recientes</option>
              <option value="finalPrice,asc">Menor precio</option>
              <option value="finalPrice,desc">Mayor precio</option>
              <option value="averageRating,desc">Mejor valorados</option>
              <option value="totalReviews,desc">Más reseñados</option>
            </select>
          </div>

          <!-- Products loading skeleton -->
          @if (loadingProducts()) {
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              @for (_ of [1,2,3,4,5]; track $index) {
                <div class="h-72 rounded-xl bg-bg-surface border border-border animate-pulse"></div>
              }
            </div>
          }

          <!-- Empty state -->
          @else if (products().length === 0) {
            <div class="flex flex-col items-center gap-4 py-20 text-text-muted border border-dashed border-border rounded-2xl">
              <ng-icon name="lucidePackage" size="48" class="opacity-30" />
              <div class="text-center">
                <p class="text-base font-medium text-text-secondary">Sin productos por ahora</p>
                <p class="text-sm mt-1">Esta tienda aún no tiene productos publicados.</p>
              </div>
            </div>
          }

          <!-- Product grid -->
          @else {
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              @for (product of products(); track product.id) {
                <app-product-card
                  [product]="product"
                  [badge]="getProductBadge(product)"
                  [inWishlist]="wishlistState.isInWishlist(product.id)"
                  (favorite)="toggleWishlist($event)"
                  (addToCart)="addProductToCart($event)"
                  (quickView)="goToProduct($event)" />
              }
            </div>

            <!-- Pagination -->
            @if (totalPages() > 1) {
              <div class="flex items-center justify-center gap-3 mt-10 pb-6">
                <button (click)="prevPage()" [disabled]="page() === 0"
                  class="flex items-center gap-1.5 px-4 py-2 rounded-[10px] border border-border
                         text-sm text-text-secondary hover:bg-bg-subtle
                         disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ng-icon name="lucideChevronLeft" size="14" />
                  Anterior
                </button>
                <div class="flex items-center gap-1">
                  @for (p of pageRange(); track p) {
                    <button (click)="goToPage(p)"
                      [ngClass]="p === page()
                        ? 'bg-accent text-white border-accent'
                        : 'bg-bg-elevated border-border text-text-secondary hover:border-border-strong'"
                      class="w-8 h-8 rounded-lg border text-[12px] font-medium transition-all duration-150">
                      {{ p + 1 }}
                    </button>
                  }
                </div>
                <button (click)="nextPage()" [disabled]="page() + 1 >= totalPages()"
                  class="flex items-center gap-1.5 px-4 py-2 rounded-[10px] border border-border
                         text-sm text-text-secondary hover:bg-bg-subtle
                         disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Siguiente
                  <ng-icon name="lucideChevronRight" size="14" />
                </button>
              </div>
            }
          }
        </div>

        <div class="h-16"></div>
      </div>

      <!-- Cart error toast -->
      @if (addToCartError()) {
        <div class="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5
                    px-4 py-3 rounded-[12px] shadow-2xl border border-error/30 animate-fade-in
                    text-[13px] text-error"
             style="background:var(--color-bg-surface)">
          <ng-icon name="lucideCircleAlert" size="14" class="shrink-0" />
          {{ addToCartError() }}
        </div>
      }
    }
  `,
})
export class StorePageComponent implements OnInit {
  readonly storeSlug = input.required<string>();

  private sellerService  = inject(SellerService);
  private productService = inject(ProductService);
  private chatService    = inject(ChatService);
  private cartService    = inject(CartService);
  readonly wishlistState = inject(WishlistStateService);
  private ngrxStore      = inject(Store);
  private router         = inject(Router);
  private zone           = inject(NgZone);

  store          = signal<PublicSellerResponse | null>(null);
  products       = signal<ProductSummary[]>([]);
  loadingStore   = signal(true);
  loadingProducts = signal(false);
  notFound       = signal(false);
  page           = signal(0);
  totalPages     = signal(0);
  totalElements  = signal(0);
  totalProducts  = signal(0);

  chatOpen       = signal(false);
  chatMessage    = '';
  chatSending    = signal(false);
  following      = signal(false);
  followLoading  = signal(false);
  addToCartError = signal<string | null>(null);
  sortBy         = 'createdAt,desc';

  isAuthenticated = this.ngrxStore.selectSignal(selectIsAuthenticated);
  isBuyer = computed(() => this.ngrxStore.selectSignal(selectRole)() !== 'SELLER');

  pageRange = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    const maxVisible = 5;
    let start = Math.max(0, current - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible);
    if (end - start < maxVisible) start = Math.max(0, end - maxVisible);
    return Array.from({ length: end - start }, (_, i) => start + i);
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!(e.target as HTMLElement).closest('[data-chat]')) {
      this.chatOpen.set(false);
    }
  }

  ngOnInit(): void {
    this.sellerService.getPublicProfile(this.storeSlug()).subscribe({
      next: (res) => {
        this.store.set(res.data);
        this.loadingStore.set(false);
        this.loadProducts(res.data.id);
        if (this.isAuthenticated()) {
          this.sellerService.isFollowing(res.data.id).subscribe({
            next: (r) => this.following.set(r.data),
            error: () => {},
          });
        }
      },
      error: (err) => {
        this.loadingStore.set(false);
        if (err.status === 404) this.notFound.set(true);
      },
    });
  }

  private loadProducts(sellerId: string): void {
    this.loadingProducts.set(true);
    const [sortField, sortDir] = this.sortBy.split(',');
    this.productService.getBySeller(sellerId, this.page(), 20, sortField, sortDir).subscribe({
      next: (res) => {
        this.products.set(res.data.content);
        this.totalPages.set(res.data.totalPages);
        this.totalElements.set(res.data.totalElements ?? res.data.content.length);
        if (this.page() === 0) this.totalProducts.set(res.data.totalElements ?? res.data.content.length);
        this.loadingProducts.set(false);
      },
      error: () => this.loadingProducts.set(false),
    });
  }

  onSortChange(): void {
    this.page.set(0);
    if (this.store()) this.loadProducts(this.store()!.id);
  }

  sendChatMessage(): void {
    const content = this.chatMessage.trim();
    const s = this.store();
    if (!content || !s || this.chatSending()) return;
    this.chatSending.set(true);
    this.chatService.startConversation({ sellerId: s.id, firstMessage: content }).subscribe({
      next: (res) => {
        this.chatSending.set(false);
        this.chatOpen.set(false);
        this.chatMessage = '';
        this.router.navigate(['/messages', res.data.id]);
      },
      error: () => this.chatSending.set(false),
    });
  }

  toggleFollow(): void {
    const s = this.store();
    if (!s) return;
    if (!this.isAuthenticated()) { this.router.navigate(['/login']); return; }
    this.followLoading.set(true);
    const call$ = this.following()
      ? this.sellerService.unfollow(s.id)
      : this.sellerService.follow(s.id);
    call$.subscribe({
      next: () => { this.following.update(v => !v); this.followLoading.set(false); },
      error: () => this.followLoading.set(false),
    });
  }

  toggleWishlist(product: ProductSummary): void {
    if (!this.isAuthenticated()) { this.router.navigate(['/login']); return; }
    this.wishlistState.toggle(product.id);
  }

  addProductToCart(product: ProductSummary): void {
    if (!this.isAuthenticated()) { this.router.navigate(['/login']); return; }
    this.addToCartError.set(null);
    this.cartService.addItem({ productId: product.id, quantity: 1 }).subscribe({
      next: (res) => this.zone.run(() => {
        this.ngrxStore.dispatch(CartActions.addItemSuccess({ cart: res.data }));
      }),
      error: (err) => this.zone.run(() => {
        const msg = err.error?.message ?? 'Error al agregar al carrito';
        this.addToCartError.set(msg);
        setTimeout(() => this.addToCartError.set(null), 4000);
      }),
    });
  }

  goToProduct(product: ProductSummary): void {
    this.router.navigate(['/product', product.slug]);
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

  goToPage(p: number): void {
    this.page.set(p);
    if (this.store()) this.loadProducts(this.store()!.id);
  }

  formatSales(n: number): string {
    if (!n || n === 0) return '';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
    return n.toString();
  }

  getProductBadge(product: ProductSummary): 'OFERTA' | 'NUEVO' | null {
    if (product.finalPrice < product.basePrice) return 'OFERTA';
    return null;
  }
}
