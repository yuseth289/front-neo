import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card';
import { ProductService } from '../../../core/catalog/product.service';
import { CategoryService } from '../../../core/catalog/category.service';
import { ProductSummary, Category } from '../../../shared/models/catalog.models';
import { Store } from '@ngrx/store';
import * as CartActions from '../../../core/cart/store/cart.actions';
import { selectIsAuthenticated } from '../../../core/auth/store/auth.selectors';
import { WishlistStateService } from '../../../core/account/wishlist-state.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NgIcon, ProductCardComponent],
  template: `
    <div>

      <!-- ───── HERO ───────────────────────────────────────────── -->
      <section class="relative overflow-hidden border-b border-border isolate"
               style="padding-top: 80px; padding-bottom: 96px;">

        <!-- Ambient orbs + grid + conic glow -->
        <div class="neo-ambient">
          <div class="neo-grid-bg absolute inset-0"></div>
          <span class="neo-orb red"    style="width:520px;height:520px;top:-10%;left:8%;"></span>
          <span class="neo-orb violet" style="width:460px;height:460px;top:10%;right:5%;animation-delay:1.4s;"></span>
          <span class="neo-orb cyan"   style="width:380px;height:380px;bottom:-12%;left:30%;animation-delay:2.8s;"></span>
          <span class="neo-glow-orbit" style="top:50%;left:50%;transform:translate(-50%,-50%);"></span>
        </div>

        <!-- Hero carousel marquee -->
        <div aria-hidden="true"
             class="absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-55">
          <div class="neo-marquee">
            @for (p of carouselProducts(); track p.id; let i = $index) {
              <div class="shrink-0 w-[280px] h-[280px] rounded-3xl overflow-hidden border border-white/[0.06]
                          shadow-[0_0_40px_rgba(255,0,60,0.08)]"
                   [style.transform]="i % 2 === 0 ? 'translateY(-12px)' : 'translateY(12px)'">
                <img [src]="p.primaryImageUrl ?? placeholder" [alt]="" class="w-full h-full object-cover" />
              </div>
            }
          </div>
        </div>

        <div class="relative z-[2] max-w-7xl mx-auto px-6">
          <div class="max-w-[880px] mx-auto text-center flex flex-col items-center gap-6">

            <!-- AI badge -->
            <span class="neo-reveal inline-flex items-center gap-2 px-3.5 py-1.5
                         border border-border-strong rounded-full bg-bg-surface/70 backdrop-blur
                         text-xs text-text-secondary font-mono tracking-[0.04em]">
              <span class="w-2 h-2 rounded-full bg-accent shadow-[0_0_12px_var(--color-accent)]"></span>
              BÚSQUEDA IMPULSADA POR IA · NUEVO
            </span>

            <!-- Animated H1 -->
            <h1 class="font-display font-bold leading-[0.92] tracking-[-0.025em] text-text-primary"
                style="font-size: clamp(48px, 7.2vw, 104px);">
              <span class="block overflow-hidden">
                @for (ch of split('El marketplace'); track $index) {
                  <span class="neo-letter" [style.--d]="(120 + $index * 22) + 'ms'">{{ ch }}</span>
                }
              </span>
              <span class="block overflow-hidden whitespace-nowrap pb-2">
                @for (ch of split('gamer'); track $index) {
                  <span class="neo-letter text-accent" [style.--d]="(430 + $index * 22) + 'ms'">{{ ch }}</span>
                }
                <span class="neo-letter" [style.--d]="'560ms'">&nbsp;</span>
                @for (ch of split('de Colombia'); track $index) {
                  <span class="neo-letter" [style.--d]="(600 + $index * 22) + 'ms'">{{ ch }}</span>
                }
              </span>
            </h1>

            <p class="neo-reveal text-text-secondary max-w-[580px] leading-relaxed text-lg" style="--i: 12;">
              Equipos, periféricos y videojuegos de los mejores vendedores del país.
              Pregúntale a la IA qué necesitas — ella ya conoce tu setup.
            </p>

            <!-- AI search bar -->
            <form (submit)="search(); $event.preventDefault()"
                  class="neo-reveal relative w-full max-w-[560px]" style="--i: 14;">
              <ng-icon name="lucideSparkles" size="16"
                       class="absolute left-4 top-1/2 -translate-y-1/2 text-accent" />
              <input
                [(ngModel)]="searchQuery" name="aiSearch"
                placeholder="Necesito un mouse liviano para FPS, máx $500.000…"
                aria-label="Búsqueda con IA"
                class="w-full h-14 pl-12 pr-[140px] rounded-[14px]
                       bg-bg-surface/70 backdrop-blur border border-border-strong text-[15px]
                       text-text-primary placeholder:text-text-muted outline-none
                       focus:border-accent focus:ring-[3px] focus:ring-accent/8
                       transition-all duration-200" />
              <button type="submit" class="neo-btn-primary absolute right-1.5 top-1.5 !h-11 !px-5 !text-[13px]">
                Buscar <ng-icon name="lucideArrowRight" size="14" />
              </button>
            </form>

            <div class="neo-reveal flex flex-wrap gap-3 justify-center" style="--i: 15;">
              <a routerLink="/catalog" class="neo-btn-primary !py-3.5 !px-6">
                Ver catálogo completo
                <ng-icon name="lucideArrowRight" size="14" />
              </a>
              @if (!isAuthenticated()) {
                <a routerLink="/register" class="neo-btn-outline !py-3.5 !px-6">
                  <ng-icon name="lucideUserPlus" size="16" />
                  Crear cuenta gratis
                </a>
              }
            </div>

            <div class="neo-reveal flex flex-wrap gap-8 mt-4 text-text-muted text-xs font-mono uppercase tracking-[0.05em]"
                 style="--i: 18;">
              <span class="inline-flex items-center gap-1.5"><ng-icon name="lucideTruck" size="14" /> Envío nacional</span>
              <span class="inline-flex items-center gap-1.5"><ng-icon name="lucideShieldCheck" size="14" /> Vendedores verificados</span>
              <span class="inline-flex items-center gap-1.5"><ng-icon name="lucideZap" size="14" /> Despacho 24h</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ───── BRAND STRIP ────────────────────────────────────── -->
      <section class="border-b border-border bg-bg-base py-8 px-6">
        <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-6
                    text-text-muted font-display font-semibold text-lg tracking-[0.05em]">
          <span class="neo-stat-label">Marcas oficiales</span>
          @for (b of brands; track b; let i = $index) {
            <span class="opacity-75 hover:opacity-100 transition-opacity neo-reveal" [style.--i]="i + 1">{{ b }}</span>
          }
        </div>
      </section>

      <!-- ───── CATEGORIES ─────────────────────────────────────── -->
      @if (categories().length > 0) {
        <section class="max-w-7xl mx-auto px-6 pt-16 pb-6 neo-reveal">
          <div class="flex justify-between items-end mb-7">
            <div>
              <p class="neo-stat-label">Explorar</p>
              <h2 class="font-display text-4xl font-bold tracking-[-0.01em] mt-1.5">Categorías</h2>
            </div>
          </div>
          <div class="neo-stagger grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
            @for (cat of categories(); track cat.id) {
              <a [routerLink]="['/catalog/category', cat.id]"
                 class="neo-reveal neo-card-premium relative overflow-hidden cursor-pointer aspect-square
                        p-4 flex flex-col items-center justify-center gap-2.5 text-center">
                <span aria-hidden class="absolute -top-10 left-1/2 -translate-x-1/2 w-[120px] h-[120px] rounded-full
                            bg-[radial-gradient(circle,rgba(255,0,60,0.30),transparent_70%)] blur-2xl opacity-60"></span>
                @if (cat.imageUrl) {
                  <img [src]="cat.imageUrl" [alt]="" class="w-10 h-10 object-contain relative" />
                } @else {
                  <div class="w-11 h-11 rounded-xl bg-bg-elevated border border-border
                              flex items-center justify-center text-text-primary relative">
                    <ng-icon name="lucideTag" size="22" />
                  </div>
                }
                <span class="text-xs font-medium text-text-secondary leading-tight relative">{{ cat.name }}</span>
              </a>
            }
          </div>
        </section>
      }

      <!-- ───── FEATURED ───────────────────────────────────────── -->
      <section class="max-w-7xl mx-auto px-6 pt-8 pb-16 neo-reveal">
        <div class="flex justify-between items-end mb-7">
          <div>
            <p class="neo-stat-label">Top semanal</p>
            <h2 class="font-display text-4xl font-bold tracking-[-0.01em] mt-1.5">Productos destacados</h2>
          </div>
          <a routerLink="/catalog"
             class="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors">
            Ver todos <ng-icon name="lucideArrowRight" size="14" />
          </a>
        </div>

        @if (loading()) {
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            @for (_ of skeletons; track $index) {
              <div class="aspect-square neo-skeleton"></div>
            }
          </div>
        } @else {
          <div class="neo-stagger grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
        }
      </section>
    </div>
  `,
})
export class HomeComponent implements OnInit {
  private productService  = inject(ProductService);
  private categoryService = inject(CategoryService);
  private router          = inject(Router);
  private store           = inject(Store);
  readonly isAuthenticated = this.store.selectSignal(selectIsAuthenticated);
  readonly wishlistState   = inject(WishlistStateService);

  products         = signal<ProductSummary[]>([]);
  carouselProducts = signal<ProductSummary[]>([]);
  categories       = signal<Category[]>([]);
  loading          = signal(true);
  searchQuery      = '';

  readonly skeletons = Array(10);
  readonly placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzFBMUExQSIvPjwvc3ZnPg==';
  readonly brands = ['RAZER', 'LOGITECH G', 'ASUS ROG', 'SECRETLAB', 'SAMSUNG', 'SONY', 'LG'];

  split(s: string): string[] {
    return s.split('').map(ch => ch === ' ' ? ' ' : ch);
  }

  ngOnInit(): void {
    this.categoryService.getTree().subscribe({
      next: (res) => this.categories.set(res.data.slice(0, 8)),
      error: () => {},
    });

    this.productService.getCatalog({ size: 10 }).subscribe({
      next: (res) => {
        this.products.set(res.data.content);
        const list = [...res.data.content, ...res.data.content];
        this.carouselProducts.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  search() {
    const q = (this.searchQuery ?? '').trim();
    this.router.navigate(['/catalog'], { queryParams: q ? { q } : {} });
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
