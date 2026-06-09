import { Component, inject, NgZone, OnInit, signal, computed } from '@angular/core';
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

    <!-- ── Modal alerta de inicio de sesión ───────────────────── -->
    @if (loginAlert()) {
      <div class="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
           (click)="loginAlert.set(false)">
        <div class="neo-card-premium p-6 w-full max-w-[360px] text-center" (click)="$event.stopPropagation()">
          <div class="w-12 h-12 rounded-full bg-accent/10 border border-accent/30
                      flex items-center justify-center mx-auto mb-4">
            <ng-icon name="lucideLock" size="20" class="text-accent" />
          </div>
          <p class="text-[15px] font-semibold text-text-primary">Inicia sesión para continuar</p>
          <p class="text-[13px] text-text-muted mt-1.5 mb-5">
            {{ loginAlertMsg() }}
          </p>
          <div class="flex gap-2">
            <a routerLink="/register" (click)="loginAlert.set(false)"
               class="flex-1 py-2.5 rounded-[10px] border border-border text-[13px]
                      text-text-secondary hover:bg-bg-elevated transition-colors text-center">
              Registrarse
            </a>
            <a routerLink="/login" (click)="loginAlert.set(false)"
               class="flex-1 py-2.5 rounded-[10px] bg-accent text-white text-[13px] font-medium
                      hover:bg-accent/90 transition-colors text-center">
              Ingresar
            </a>
          </div>
        </div>
      </div>
    }

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

              <!-- Seller / Store -->
              @if (product()!.storeName) {
                <a [routerLink]="['/store', product()!.storeSlug]"
                   class="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-[10px]
                          border border-border bg-bg-surface hover:border-accent/40 hover:bg-accent/5
                          transition-all duration-200 group/store">
                  <ng-icon name="lucideStore" size="13" class="text-text-muted group-hover/store:text-accent transition-colors" />
                  <span class="text-[12px] font-medium text-text-secondary group-hover/store:text-text-primary transition-colors">
                    {{ product()!.storeName }}
                  </span>
                  <ng-icon name="lucideChevronRight" size="11" class="text-text-muted group-hover/store:text-accent transition-colors" />
                </a>
              }

              <!-- Rating -->
              @if (ratingSummary()) {
                <div class="flex items-center gap-2.5">
                  <span class="inline-flex gap-0.5">
                    @for (i of [1,2,3,4,5]; track i) {
                      <svg viewBox="0 0 24 24" width="15" height="15">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                          [attr.fill]="i <= roundedRating() ? 'var(--color-accent)' : 'none'"
                          [attr.stroke]="i <= roundedRating() ? 'var(--color-accent)' : 'var(--color-text-secondary)'"
                          stroke-width="1.5"/>
                      </svg>
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
              <div class="flex flex-col gap-1">
                @if (product()!.activeDiscountPercent) {
                  <div class="flex items-center gap-2">
                    <span class="text-[13px] font-bold px-2 py-0.5 rounded-md"
                          style="background:rgba(239,68,68,0.12);color:var(--color-error)">
                      -{{ product()!.activeDiscountPercent }}%
                    </span>
                    <span class="text-[15px] text-text-muted line-through font-mono">
                      {{ product()!.finalPrice | copCurrency }}
                    </span>
                  </div>
                  <p class="font-display text-[40px] font-black leading-none tracking-[-0.02em]"
                     style="color:var(--color-error)">
                    {{ discountedPrice() | copCurrency }}
                  </p>
                } @else {
                  <p class="font-display text-[40px] font-black leading-none tracking-[-0.02em] text-text-primary">
                    {{ product()!.finalPrice | copCurrency }}
                  </p>
                }
                <p class="text-[12px] text-text-muted font-mono mt-0.5">
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

                <!-- Stock badge -->
                @if (product()!.availableStock !== null && product()!.availableStock !== undefined) {
                  @if (product()!.availableStock! <= 0) {
                    <div class="flex items-center gap-2 rounded-[10px] bg-error/10 border border-error/30 px-3.5 py-2.5">
                      <ng-icon name="lucidePackageX" size="15" class="text-error" />
                      <span class="text-sm font-semibold text-error">Agotado</span>
                    </div>
                  } @else if (product()!.availableStock! <= 5) {
                    <div class="flex items-center gap-2 rounded-[10px] bg-warning/10 border border-warning/30 px-3.5 py-2.5">
                      <ng-icon name="lucidePackage" size="15" class="text-warning" />
                      <span class="text-sm text-warning">¡Solo quedan <strong>{{ product()!.availableStock }}</strong> unidades!</span>
                    </div>
                  } @else {
                    <div class="flex items-center gap-1.5 text-sm text-success">
                      <ng-icon name="lucideCircleCheck" size="14" />
                      <span>{{ product()!.availableStock }} unidades disponibles</span>
                    </div>
                  }
                }

                <button (click)="addToCart()" [disabled]="isAdding() || product()!.availableStock === 0"
                  class="neo-btn-primary w-full justify-center !py-3.5
                         disabled:opacity-60 disabled:cursor-not-allowed">
                  @if (product()!.availableStock === 0) {
                    <ng-icon name="lucidePackageX" size="18" />
                    Agotado
                  } @else if (isAdding()) {
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
                      @if (isAuthenticated()) {
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
                    {{ descText() }}
                  </p>
                  @if (descNeedsToggle()) {
                    <button (click)="descExpanded.update(v => !v)"
                      class="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent
                             hover:underline transition-colors">
                      @if (descExpanded()) {
                        <ng-icon name="lucideChevronUp" size="12" />Ver menos
                      } @else {
                        <ng-icon name="lucideChevronDown" size="12" />Ver más
                      }
                    </button>
                  }
                </div>
              }

            </div><!-- /info -->
          </div>

          <!-- ── CARACTERÍSTICAS ──────────────────────────────────────── -->
          @if (specEntries().length > 0) {
            <div class="mt-10 pt-8 border-t border-border">
              <h2 class="font-display text-[20px] font-bold text-text-primary mb-5">
                Características del producto
              </h2>
              <div class="neo-card-premium overflow-hidden">
                <table class="w-full text-[13px] border-collapse">
                  <tbody>
                    @for (entry of specEntries(); track entry.key; let odd = $odd) {
                      <tr [class.bg-bg-elevated]="odd">
                        <td class="px-5 py-3 w-[40%] max-w-[200px] font-medium text-text-secondary border-b border-border align-top">
                          {{ entry.key }}
                        </td>
                        <td class="px-5 py-3 text-text-primary border-b border-border align-top">
                          {{ entry.value }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          <!-- ── REVIEWS ───────────────────────────────────────────────── -->
          <div class="mt-14 pt-10 border-t border-border">

            <!-- Reviews header -->
            <div class="flex items-start justify-between gap-6 mb-8 flex-wrap">
              <div>
                <h2 class="font-display text-[22px] font-bold text-text-primary">Reseñas de clientes</h2>
                @if (ratingSummary()) {
                  <p class="text-sm text-text-muted mt-0.5">
                    {{ ratingSummary()!.totalReviews }} reseñas verificadas
                  </p>
                }
              </div>
              @if (ratingSummary()) {
                <div class="flex items-center gap-4 neo-card-premium px-5 py-4 shrink-0">
                  <div class="text-center">
                    <span class="font-display text-[48px] font-black leading-none text-text-primary block">
                      {{ ratingSummary()!.averageRating | number:'1.1-1' }}
                    </span>
                    <p class="text-[11px] text-text-muted font-mono mt-1">de 5 estrellas</p>
                  </div>
                  <div class="flex flex-col gap-1">
                    <span class="inline-flex gap-1">
                      @for (i of [1,2,3,4,5]; track i) {
                        <svg viewBox="0 0 24 24" width="18" height="18">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                            [attr.fill]="i <= roundedRating() ? 'var(--color-accent)' : 'none'"
                            [attr.stroke]="i <= roundedRating() ? 'var(--color-accent)' : 'var(--color-text-secondary)'"
                            stroke-width="1.5"/>
                        </svg>
                      }
                    </span>
                    <p class="text-[11px] text-text-muted font-mono">
                      {{ ratingSummary()!.totalReviews }} valoraciones
                    </p>
                  </div>
                </div>
              }
            </div>

            <!-- Reviews loading -->
            @if (reviewsLoading()) {
              <div class="space-y-4">
                @for (_ of [1,2,3]; track $index) {
                  <div class="rounded-2xl bg-bg-surface border border-border p-5 animate-pulse">
                    <div class="flex gap-4">
                      <div class="w-10 h-10 rounded-full bg-bg-elevated shrink-0"></div>
                      <div class="flex-1 space-y-2.5">
                        <div class="h-3 w-32 rounded bg-bg-elevated"></div>
                        <div class="h-2.5 w-24 rounded bg-bg-elevated"></div>
                        <div class="h-3 w-full rounded bg-bg-elevated mt-3"></div>
                        <div class="h-3 w-3/4 rounded bg-bg-elevated"></div>
                      </div>
                    </div>
                  </div>
                }
              </div>

            <!-- No reviews -->
            } @else if (reviews().length === 0) {
              <div class="neo-card-premium p-12 text-center flex flex-col items-center gap-4">
                <div class="w-16 h-16 rounded-2xl bg-bg-elevated border border-border
                            flex items-center justify-center">
                  <span class="inline-flex gap-0.5">
                    @for (i of [1,2,3]; track i) {
                      <svg viewBox="0 0 24 24" width="14" height="14">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                          fill="none" stroke="var(--color-border-strong)" stroke-width="1.5"/>
                      </svg>
                    }
                  </span>
                </div>
                <div>
                  <p class="text-[15px] font-semibold text-text-primary">Sin reseñas aún</p>
                  <p class="text-[13px] text-text-muted mt-1">Sé el primero en valorar este producto.</p>
                </div>
              </div>

            <!-- Review cards -->
            } @else {
              <div class="flex flex-col gap-4">
                @for (review of reviews(); track review.id) {
                  <div class="neo-card-premium p-5 neo-reveal">
                    <div class="flex gap-4">

                      <!-- Avatar -->
                      <div class="w-10 h-10 rounded-full shrink-0 flex items-center justify-center
                                  text-[14px] font-black text-white font-display select-none"
                           [style.background]="reviewerColor(review.buyerName)">
                        {{ reviewerInitial(review.buyerName) }}
                      </div>

                      <!-- Content -->
                      <div class="flex-1 min-w-0">

                        <!-- Top row: name + date -->
                        <div class="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p class="text-[13px] font-semibold text-text-primary leading-tight">
                              {{ review.buyerName ?? 'Comprador' }}
                            </p>
                            <div class="flex items-center gap-2 mt-1">
                              <!-- Stars con SVG inline relleno -->
                              <span class="inline-flex gap-0.5">
                                @for (i of [1,2,3,4,5]; track i) {
                                  <svg viewBox="0 0 24 24" width="13" height="13">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                                      [attr.fill]="i <= (review.rating ?? 0) ? 'var(--color-accent)' : 'none'"
                                      [attr.stroke]="i <= (review.rating ?? 0) ? 'var(--color-accent)' : 'var(--color-text-secondary)'"
                                      stroke-width="1.5"/>
                                  </svg>
                                }
                              </span>
                              <span class="text-[11px] font-bold tabular-nums"
                                    [style.color]="'var(--color-accent)'">
                                {{ (review.rating ?? 0) }}/5
                              </span>
                            </div>
                          </div>

                          <div class="text-right shrink-0">
                            <p class="text-[11px] text-text-muted font-mono">
                              {{ review.createdAt | date:'d MMM yyyy':'':'es' }}
                            </p>
                            <span class="inline-flex items-center gap-1 mt-1 text-[10px]
                                         text-success font-mono tracking-[0.04em]">
                              <ng-icon name="lucideCircleCheck" size="10" />
                              Compra verificada
                            </span>
                          </div>
                        </div>

                        <!-- Review title -->
                        @if (review.title) {
                          <p class="text-[13px] font-semibold text-text-primary mt-3 leading-snug">
                            {{ review.title }}
                          </p>
                        }

                        <!-- Review body -->
                        @if (review.body) {
                          <p class="text-[13px] text-text-secondary leading-relaxed mt-1.5">
                            {{ review.body }}
                          </p>
                        }

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
  private zone           = inject(NgZone);

  product          = signal<ProductDetail | null>(null);
  ratingSummary    = signal<RatingSummary | null>(null);
  reviews          = signal<Review[]>([]);
  loading          = signal(true);
  reviewsLoading   = signal(true);
  notFound         = signal(false);
  selectedImageIndex = signal(0);
  addedFeedback    = signal(false);
  qty              = signal(1);

  wishlistAdded  = signal(false);
  descExpanded   = signal(false);
  descNeedsToggle = computed(() => (this.product()?.description?.length ?? 0) > 120);
  descText = computed(() => {
    const desc = this.product()?.description ?? '';
    if (!this.descNeedsToggle() || this.descExpanded()) return desc;
    return desc.slice(0, 120) + '…';
  });

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

  loginAlert    = signal(false);
  loginAlertMsg = signal('');

  private requireAuth(msg: string): boolean {
    if (this.isAuthenticated()) return true;
    this.loginAlertMsg.set(msg);
    this.loginAlert.set(true);
    return false;
  }

  activeImage = computed(() => {
    const p = this.product();
    if (!p || p.images.length === 0) return PLACEHOLDER;
    return p.images[this.selectedImageIndex()]?.url ?? PLACEHOLDER;
  });

  roundedRating = computed(() => Math.round(this.ratingSummary()?.averageRating ?? 0));

  specEntries = computed(() => {
    const specs = this.product()?.specifications;
    if (!specs) return [];
    return Object.entries(specs).filter(([, v]) => v?.trim()).map(([key, value]) => ({ key, value }));
  });

  discountedPrice = computed(() => {
    const p = this.product();
    if (!p?.activeDiscountPercent) return p?.finalPrice ?? 0;
    return p.finalPrice * (1 - p.activeDiscountPercent / 100);
  });

  incQty(): void { this.qty.update(q => Math.min(q + 1, 99)); }
  decQty(): void { this.qty.update(q => Math.max(q - 1, 1)); }

  reviewerInitial(name: string | null): string {
    return (name ?? 'C').charAt(0).toUpperCase();
  }

  reviewerColor(name: string | null): string {
    const palette = ['#FF003C', '#7C3AED', '#0EA5E9', '#059669', '#D97706'];
    const code = (name ?? '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return palette[code % palette.length];
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';

    this.productService.getBySlug(slug).subscribe({
      next: (res) => this.zone.run(() => {
        this.product.set(res.data);
        this.loading.set(false);
        const primaryIdx = res.data.images.findIndex((img) => img.primary);
        this.selectedImageIndex.set(primaryIdx >= 0 ? primaryIdx : 0);
        this.loadReviews(res.data.id);
      }),
      error: () => this.zone.run(() => { this.notFound.set(true); this.loading.set(false); }),
    });
  }

  addToCart(): void {
    const p = this.product();
    if (!p) return;
    if (!this.requireAuth('Necesitas una cuenta para agregar productos al carrito.')) return;
    this.store.dispatch(CartActions.addItem({ request: { productId: p.id, quantity: this.qty() } }));
    this.addedFeedback.set(true);
    setTimeout(() => this.addedFeedback.set(false), 2500);
  }

  toggleWishlist(): void {
    const p = this.product();
    if (!p) return;
    if (!this.requireAuth('Inicia sesión para guardar productos en tu lista de deseos.')) return;
    this.wishlistState.toggle(p.id);
    this.wishlistAdded.set(!this.wishlistState.isInWishlist(p.id) ? false : true);
    setTimeout(() => this.wishlistAdded.set(false), 2000);
  }

  toggleChatPanel(): void {
    if (!this.requireAuth('Inicia sesión para poder contactar al vendedor.')) return;
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
      next: (res) => this.zone.run(() => this.ratingSummary.set(res.data)),
      error: () => {},
    });
    this.reviewService.getProductReviews(productId).subscribe({
      next: (res) => this.zone.run(() => {
        this.reviews.set(res.data.content);
        this.reviewsLoading.set(false);
      }),
      error: () => this.zone.run(() => this.reviewsLoading.set(false)),
    });
  }
}
