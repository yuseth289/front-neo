import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { NgIcon } from '@ng-icons/core';
import { CopCurrencyPipe } from '../../../shared/pipes/cop-currency.pipe';
import { ProductService } from '../../../core/catalog/product.service';
import { ReviewService } from '../../../core/catalog/review.service';
import { WishlistStateService } from '../../../core/account/wishlist-state.service';
import { ChatService } from '../../../core/chat/chat.service';
import { ProductDetail, Review, RatingSummary } from '../../../shared/models/catalog.models';
import * as CartActions from '../../../core/cart/store/cart.actions';
import { selectAddingProductId, selectCartError } from '../../../core/cart/store/cart.selectors';
import { selectIsAuthenticated, selectRole } from '../../../core/auth/store/auth.selectors';

const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzFBMUExQSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNTU1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U2luIGltYWdlbjwvdGV4dD48L3N2Zz4=';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NgIcon, CopCurrencyPipe],
  template: `
    <div class="relative">
      <!-- Ambient backdrop -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden -z-[1]">
        <div class="neo-grid-bg absolute inset-0 opacity-20"></div>
        <span class="neo-orb red"  style="width:500px;height:500px;top:-10%;right:-5%;opacity:0.1;"></span>
        <span class="neo-orb cyan" style="width:380px;height:380px;bottom:10%;left:-5%;opacity:0.08;animation-delay:2s;"></span>
      </div>

      <div class="max-w-7xl mx-auto px-4 py-8">

        <!-- ── SKELETON ─────────────────────────────────────────────────── -->
        @if (loading()) {
          <div class="grid md:grid-cols-2 gap-10 animate-pulse">
            <div class="aspect-square rounded-2xl bg-bg-surface border border-border"></div>
            <div class="flex flex-col gap-4 pt-2">
              <div class="h-3 w-24 rounded bg-bg-surface"></div>
              <div class="h-9 w-3/4 rounded-lg bg-bg-surface"></div>
              <div class="h-4 w-32 rounded bg-bg-surface"></div>
              <div class="h-12 w-40 rounded-lg bg-bg-surface mt-2"></div>
              <div class="h-3 w-20 rounded bg-bg-surface"></div>
              <div class="h-14 w-full rounded-xl bg-bg-surface mt-4"></div>
              <div class="h-11 w-full rounded-xl bg-bg-surface"></div>
            </div>
          </div>

        <!-- ── NOT FOUND ─────────────────────────────────────────────────── -->
        } @else if (notFound()) {
          <div class="flex flex-col items-center gap-4 py-24 text-text-muted">
            <ng-icon name="lucideTriangleAlert" size="48" />
            <p class="text-lg font-medium text-text-primary">Producto no encontrado</p>
            <a routerLink="/catalog" class="neo-btn-outline !text-[13px] !py-2 !px-4">
              Volver al catálogo
            </a>
          </div>

        <!-- ── PRODUCT ───────────────────────────────────────────────────── -->
        } @else if (product()) {
          <div class="grid md:grid-cols-2 gap-10 lg:gap-14">

            <!-- ── GALLERY ─────────────────────────────────────────────── -->
            <div class="flex flex-col gap-3 neo-reveal">
              <!-- Main image -->
              <div class="aspect-square rounded-2xl overflow-hidden bg-bg-surface border border-border
                          transition-[border-color] duration-300 hover:border-accent/30">
                <img
                  [src]="activeImage()"
                  [alt]="product()!.name"
                  class="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                />
              </div>

              <!-- Thumbnails -->
              @if (product()!.images.length > 1) {
                <div class="flex gap-2 overflow-x-auto pb-1">
                  @for (img of product()!.images; track img.id) {
                    <button
                      (click)="selectedImageIndex.set($index)"
                      class="w-16 h-16 shrink-0 rounded-[10px] overflow-hidden border-2 transition-all duration-200"
                      [style.border-color]="selectedImageIndex() === $index
                        ? 'var(--color-accent)'
                        : 'var(--color-border)'"
                      [style.box-shadow]="selectedImageIndex() === $index
                        ? '0 0 12px var(--color-accent-glow)'
                        : 'none'">
                      <img [src]="img.url" [alt]="img.altText ?? product()!.name"
                           class="w-full h-full object-cover" />
                    </button>
                  }
                </div>
              }
            </div>

            <!-- ── INFO ────────────────────────────────────────────────── -->
            <div class="flex flex-col gap-5 neo-reveal" style="position:sticky;top:92px;align-self:start;">

              <!-- Breadcrumb -->
              <div class="flex items-center gap-1.5 text-xs text-text-muted">
                <a routerLink="/catalog"
                   class="hover:text-text-primary transition-colors">Catálogo</a>
                <ng-icon name="lucideChevronRight" size="12" />
                <span class="text-text-secondary">{{ product()!.brand }}</span>
              </div>

              <!-- Name -->
              <h1 class="font-display text-[28px] font-bold leading-[1.2] tracking-[-0.01em] text-text-primary">
                {{ product()!.name }}
              </h1>

              <!-- Rating -->
              @if (ratingSummary()) {
                <div class="flex items-center gap-2.5">
                  <span class="inline-flex gap-0.5">
                    @for (i of [1,2,3,4,5]; track i) {
                      <ng-icon name="lucideStar" size="15"
                        [class.text-star]="i <= roundedRating()"
                        [class.text-border-strong]="i > roundedRating()" />
                    }
                  </span>
                  <span class="text-sm font-semibold text-text-primary">
                    {{ ratingSummary()!.averageRating | number:'1.1-1' }}
                  </span>
                  <span class="text-sm text-text-muted">
                    ({{ ratingSummary()!.totalReviews }} reseñas)
                  </span>
                </div>
              }

              <!-- Price -->
              <div>
                <p class="font-display text-[40px] font-black leading-none tracking-[-0.02em] text-text-primary">
                  {{ product()!.finalPrice | copCurrency }}
                </p>
                <p class="text-[12px] text-text-muted font-mono mt-1.5">
                  Base: {{ product()!.basePrice | copCurrency }} + IVA {{ product()!.ivaPercent }}% · IVA incluido
                </p>
              </div>

              <!-- SKU -->
              <p class="text-[11px] text-text-muted font-mono tracking-[0.06em] uppercase">
                SKU: {{ product()!.sku }}
              </p>

              <!-- Quantity selector -->
              <div class="flex items-center gap-3">
                <p class="text-xs font-medium text-text-secondary uppercase tracking-wide">Cantidad</p>
                <div class="flex items-center gap-0 rounded-[10px] border border-border overflow-hidden">
                  <button (click)="decQty()"
                    class="w-9 h-9 flex items-center justify-center text-text-secondary
                           hover:bg-bg-elevated hover:text-text-primary transition-colors">
                    <ng-icon name="lucideMinus" size="14" />
                  </button>
                  <span class="w-10 text-center text-sm font-semibold text-text-primary tabular-nums">
                    {{ qty() }}
                  </span>
                  <button (click)="incQty()"
                    class="w-9 h-9 flex items-center justify-center text-text-secondary
                           hover:bg-bg-elevated hover:text-text-primary transition-colors">
                    <ng-icon name="lucidePlus" size="14" />
                  </button>
                </div>
              </div>

              <!-- CTA -->
              <div class="flex flex-col gap-2.5">
                @if (cartError()) {
                  <p class="text-xs text-error flex items-center gap-1">
                    <ng-icon name="lucideCircleAlert" size="13" />{{ cartError() }}
                  </p>
                }
                @if (addedFeedback()) {
                  <p class="text-[13px] text-success flex items-center gap-1.5 neo-reveal">
                    <ng-icon name="lucideCircleCheck" size="15" />¡Agregado al carrito!
                  </p>
                }

                <button (click)="addToCart()" [disabled]="isAdding()"
                  class="neo-btn-primary w-full justify-center !py-3.5
                         disabled:opacity-60 disabled:cursor-not-allowed">
                  @if (isAdding()) {
                    <ng-icon name="lucideRefreshCw" size="16" class="neo-spin" />
                    Agregando…
                  } @else {
                    <ng-icon name="lucideShoppingCart" size="18" />
                    Agregar al carrito
                  }
                </button>

                <!-- Wishlist -->
                <button (click)="toggleWishlist()"
                  [ngClass]="wishlistState.isInWishlist(product()!.id)
                    ? 'neo-btn-accent'
                    : 'neo-btn-outline'"
                  class="w-full justify-center !py-3">
                  <ng-icon [name]="wishlistState.isInWishlist(product()!.id) ? 'lucideHeartOff' : 'lucideHeart'" size="16" />
                  {{ wishlistState.isInWishlist(product()!.id) ? 'En lista de deseos' : 'Guardar en lista de deseos' }}
                </button>
              </div>

              <!-- Chat with seller -->
              @if (isBuyer()) {
                <div class="relative">
                  <button (click)="toggleChatPanel()"
                    class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px]
                           text-[13px] font-medium border border-border text-text-secondary
                           hover:border-neon-cyan/50 hover:text-neon-cyan hover:bg-neon-cyan/5
                           transition-all duration-200">
                    <ng-icon name="lucideMessageCircle" size="15" />
                    Chatear con el vendedor
                  </button>

                  @if (chatOpen()) {
                    <div class="absolute top-full left-0 right-0 mt-1.5 z-20 neo-card-premium
                                p-3 shadow-[var(--shadow-card-lift)]">
                      @if (!isAuthenticated()) {
                        <p class="text-[13px] text-text-muted text-center py-2">
                          <a routerLink="/login" class="text-accent hover:underline">Inicia sesión</a>
                          para contactar al vendedor
                        </p>
                      } @else {
                        <p class="text-[12px] text-text-muted mb-2">¿En qué puedes ayudarte?</p>
                        <textarea
                          [(ngModel)]="chatMessage"
                          placeholder="Escribe tu consulta sobre este producto…"
                          rows="3"
                          class="w-full bg-bg-elevated border border-border rounded-[10px] px-3 py-2
                                 text-[13px] text-text-primary placeholder:text-text-muted outline-none resize-none
                                 focus:border-neon-cyan/60 focus:ring-[3px] focus:ring-neon-cyan/8 transition-all"></textarea>
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
                                   disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5">
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

              <!-- Description -->
              @if (product()!.description) {
                <div class="pt-5 border-t border-border">
                  <p class="neo-stat-label mb-2.5">Descripción</p>
                  <p class="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                    {{ product()!.description }}
                  </p>
                </div>
              }

            </div><!-- /info -->
          </div>

          <!-- ── REVIEWS ───────────────────────────────────────────────── -->
          <div class="mt-14 pt-10 border-t border-border">

            <!-- Reviews header -->
            <div class="flex items-center justify-between gap-4 mb-8">
              <div>
                <h2 class="font-display text-[22px] font-bold text-text-primary">Reseñas de clientes</h2>
                @if (ratingSummary()) {
                  <p class="text-sm text-text-muted mt-0.5">
                    {{ ratingSummary()!.totalReviews }} reseñas verificadas
                  </p>
                }
              </div>
              @if (ratingSummary()) {
                <div class="hidden sm:flex items-center gap-3 neo-card-premium px-5 py-3.5 shrink-0">
                  <span class="font-display text-[40px] font-black leading-none text-text-primary">
                    {{ ratingSummary()!.averageRating | number:'1.1-1' }}
                  </span>
                  <div class="flex flex-col gap-0.5">
                    <span class="inline-flex gap-0.5">
                      @for (i of [1,2,3,4,5]; track i) {
                        <ng-icon name="lucideStar" size="14"
                          [class.text-star]="i <= roundedRating()"
                          [class.text-border-strong]="i > roundedRating()" />
                      }
                    </span>
                    <p class="text-[11px] text-text-muted font-mono">de 5 estrellas</p>
                  </div>
                </div>
              }
            </div>

            <!-- Reviews loading -->
            @if (reviewsLoading()) {
              <div class="space-y-3">
                @for (_ of [1,2,3]; track $index) {
                  <div class="rounded-2xl bg-bg-surface border border-border p-5 animate-pulse h-24"></div>
                }
              </div>

            <!-- No reviews -->
            } @else if (reviews().length === 0) {
              <div class="neo-card-premium p-10 text-center text-text-muted flex flex-col items-center gap-3">
                <ng-icon name="lucideStar" size="32" />
                <p class="text-sm">Este producto aún no tiene reseñas.</p>
              </div>

            <!-- Review cards -->
            } @else {
              <div class="flex flex-col gap-3">
                @for (review of reviews(); track review.id) {
                  <div class="neo-card-premium p-5 neo-reveal">
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex flex-col gap-1.5 flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="inline-flex gap-0.5">
                            @for (i of [1,2,3,4,5]; track i) {
                              <ng-icon name="lucideStar" size="12"
                                [class.text-star]="i <= (review.rating ?? 0)"
                                [class.text-border-strong]="i > (review.rating ?? 0)" />
                            }
                          </span>
                          <span class="text-sm font-semibold text-text-primary">{{ review.title }}</span>
                        </div>
                        <p class="text-sm text-text-secondary leading-relaxed">{{ review.body }}</p>
                      </div>
                      <div class="text-right shrink-0">
                        <p class="text-xs font-medium text-text-secondary">{{ review.buyerName }}</p>
                        <p class="text-[11px] text-text-muted font-mono mt-0.5">
                          {{ review.createdAt | date:'d MMM yyyy':'':'es' }}
                        </p>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

        }
      </div>
    </div>
  `,
})
export class ProductDetailComponent implements OnInit {
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private productService = inject(ProductService);
  private reviewService  = inject(ReviewService);
  readonly wishlistState  = inject(WishlistStateService);
  private chatService    = inject(ChatService);
  private store          = inject(Store);

  product          = signal<ProductDetail | null>(null);
  ratingSummary    = signal<RatingSummary | null>(null);
  reviews          = signal<Review[]>([]);
  loading          = signal(true);
  reviewsLoading   = signal(true);
  notFound         = signal(false);
  selectedImageIndex = signal(0);
  addedFeedback    = signal(false);
  qty              = signal(1);

  wishlistAdded = signal(false);

  chatOpen    = signal(false);
  chatMessage = '';
  chatSending = signal(false);

  isAdding = computed(() => {
    const pid = this.product()?.id;
    return pid ? this.store.selectSignal(selectAddingProductId)() === pid : false;
  });
  cartError        = this.store.selectSignal(selectCartError);
  isAuthenticated  = this.store.selectSignal(selectIsAuthenticated);
  isBuyer          = computed(() => this.store.selectSignal(selectRole)() !== 'SELLER');

  activeImage = computed(() => {
    const p = this.product();
    if (!p || p.images.length === 0) return PLACEHOLDER;
    return p.images[this.selectedImageIndex()]?.url ?? PLACEHOLDER;
  });

  roundedRating = computed(() => Math.round(this.ratingSummary()?.averageRating ?? 0));

  incQty(): void { this.qty.update(q => Math.min(q + 1, 99)); }
  decQty(): void { this.qty.update(q => Math.max(q - 1, 1)); }

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
      error: () => { this.notFound.set(true); this.loading.set(false); },
    });
  }

  addToCart(): void {
    const p = this.product();
    if (!p) return;
    this.store.dispatch(CartActions.addItem({ request: { productId: p.id, quantity: this.qty() } }));
    this.addedFeedback.set(true);
    setTimeout(() => this.addedFeedback.set(false), 2500);
  }

  toggleWishlist(): void {
    const p = this.product();
    if (!p) return;
    if (!this.isAuthenticated()) { this.router.navigate(['/login']); return; }
    this.wishlistState.toggle(p.id);
    this.wishlistAdded.set(!this.wishlistState.isInWishlist(p.id) ? false : true);
    setTimeout(() => this.wishlistAdded.set(false), 2000);
  }

  toggleChatPanel(): void {
    this.chatOpen.update(v => !v);
  }

  sendChatMessage(): void {
    const content = this.chatMessage.trim();
    const p = this.product();
    if (!content || !p || this.chatSending()) return;
    this.chatSending.set(true);
    this.chatService.startConversation({ sellerId: p.sellerId, productId: p.id, firstMessage: content }).subscribe({
      next: (res) => {
        this.chatSending.set(false);
        this.chatOpen.set(false);
        this.chatMessage = '';
        this.router.navigate(['/messages', res.data.id]);
      },
      error: () => this.chatSending.set(false),
    });
  }

  private loadReviews(productId: string): void {
    this.reviewService.getRatingSummary(productId).subscribe({
      next: (res) => this.ratingSummary.set(res.data),
      error: () => {},
    });
    this.reviewService.getProductReviews(productId).subscribe({
      next: (res) => { this.reviews.set(res.data.content); this.reviewsLoading.set(false); },
      error: () => this.reviewsLoading.set(false),
    });
  }
}
