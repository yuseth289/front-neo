import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { CopCurrencyPipe } from '../../pipes/cop-currency.pipe';
import { ProductSummary } from '../../models/catalog.models';

const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzFBMUExQSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNTU1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U2luIGltYWdlbjwvdGV4dD48L3N2Zz4=';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon, CopCurrencyPipe],
  template: `
    <a
      [routerLink]="['/product', product.slug]"
      class="group relative flex flex-col bg-bg-surface border rounded-xl overflow-hidden
             transition-[transform,border-color,box-shadow] duration-[280ms]
             [transition-timing-function:var(--ease-out-snappy)] [will-change:transform]"
      [style.transform]="cardTransform()"
      [style.box-shadow]="hover() ? 'var(--shadow-card-lift)' : 'var(--shadow-card-rest)'"
      [style.border-color]="hover() ? 'rgba(255,0,60,0.5)' : 'var(--color-border)'"
      (mouseenter)="hover.set(true)"
      (mouseleave)="onLeave()"
      (mousemove)="onMove($event)"
    >
      <!-- Image -->
      <div class="relative aspect-square overflow-hidden bg-bg-elevated">
        <img
          [src]="product.primaryImageUrl ?? placeholder"
          [alt]="product.name"
          class="w-full h-full object-cover transition-transform duration-[600ms]
                 [transition-timing-function:var(--ease-out-soft)] group-hover:scale-[1.08]"
          loading="lazy"
        />

        <!-- Badge -->
        @if (product.availableStock === 0) {
          <span class="absolute top-3 left-3 px-2 py-1 rounded text-[10px] font-semibold tracking-[0.08em] font-mono
                       bg-bg-elevated/90 text-text-muted border border-border-strong backdrop-blur-sm">
            Agotado
          </span>
        } @else if (badge) {
          <span class="absolute top-3 left-3 px-2 py-1 rounded text-[10px] font-semibold tracking-[0.08em] font-mono"
                [class]="badge === 'OFERTA'
                  ? 'bg-accent text-white shadow-[var(--shadow-glow-accent-sm)]'
                  : 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30'">
            {{ badge }}
          </span>
        }

        <!-- Quick actions -->
        <div class="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 -translate-y-2
                    transition-[opacity,transform] duration-200 group-hover:opacity-100 group-hover:translate-y-0">
          <button (click)="$event.stopPropagation(); $event.preventDefault(); favorite.emit(product)"
                  [attr.aria-label]="inWishlist ? 'Quitar de wishlist' : 'Guardar en wishlist'"
                  [ngClass]="inWishlist
                    ? 'bg-accent border-accent text-white'
                    : 'bg-bg-surface/85 border-border-strong text-text-primary hover:bg-accent hover:border-accent hover:text-white'"
                  class="w-8 h-8 rounded-full backdrop-blur border
                         flex items-center justify-center transition-all duration-200">
            <ng-icon name="lucideHeart" size="14" />
          </button>
          <button (click)="$event.stopPropagation(); $event.preventDefault(); quickView.emit(product)"
                  aria-label="Vista rápida"
                  class="w-8 h-8 rounded-full bg-bg-surface/85 backdrop-blur border border-border-strong
                         text-text-primary flex items-center justify-center transition-colors
                         hover:bg-accent hover:border-accent">
            <ng-icon name="lucideEye" size="14" />
          </button>
        </div>

        <!-- Slide-up CTA -->
        @if (product.availableStock !== 0) {
          <div class="absolute left-3 right-3 bottom-3 opacity-0 translate-y-3
                      transition-[opacity,transform] duration-200 group-hover:opacity-100 group-hover:translate-y-0">
            <button (click)="$event.stopPropagation(); $event.preventDefault(); addToCart.emit(product)"
                    class="neo-btn-primary w-full justify-center !py-2.5 !text-[13px] !rounded-[10px]">
              <ng-icon name="lucideShoppingCart" size="14" />
              Agregar al carrito
            </button>
          </div>
        }
      </div>

      <!-- Info -->
      <div class="p-4 flex flex-col flex-1">
        <div class="flex items-center justify-between gap-1 shrink-0">
          <p class="font-mono text-[10px] uppercase tracking-[0.08em] text-text-muted truncate">
            {{ product.brand }}
          </p>
          @if (product.storeName) {
            <a [routerLink]="['/store', product.storeSlug]"
               (click)="$event.stopPropagation()"
               class="inline-flex items-center gap-1 shrink-0 text-[10px] text-text-muted
                      hover:text-accent transition-colors font-mono truncate max-w-[50%]">
              <ng-icon name="lucideStore" size="10" />
              <span class="truncate">{{ product.storeName }}</span>
            </a>
          }
        </div>
        <h3 class="text-[13px] font-medium text-text-primary line-clamp-2 leading-snug h-[34px] overflow-hidden mt-0.5 shrink-0">
          {{ product.name }}
        </h3>
        <div class="flex items-center gap-1.5 mt-1 shrink-0">
          <span class="inline-flex gap-0.5">
            @for (i of [1,2,3,4,5]; track i) {
              <svg viewBox="0 0 24 24" width="14" height="14">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                  [attr.fill]="product.averageRating != null && i <= product.averageRating! ? 'var(--color-accent)' : 'none'"
                  [attr.stroke]="product.averageRating != null && i <= product.averageRating! ? 'var(--color-accent)' : 'var(--color-border-strong)'"
                  stroke-width="1.5"/>
              </svg>
            }
          </span>
          @if (product.averageRating != null) {
            <span class="text-[11px] text-text-muted">({{ product.totalReviews ?? 0 }})</span>
          }
        </div>
        <div class="mt-auto pt-2">
          <!-- Fila de descuento: siempre ocupa h-[24px] para igualar altura con/sin oferta -->
          <div class="h-[24px] flex items-center gap-1.5 overflow-hidden mb-1">
            @if (product.activeDiscountPercent) {
              <span class="shrink-0 text-[11px] font-bold px-1.5 py-0.5 rounded-md"
                    style="background:rgba(239,68,68,0.12);color:var(--color-error)">
                -{{ product.activeDiscountPercent }}%
              </span>
              <span class="text-[11px] text-text-muted line-through font-mono truncate min-w-0">
                {{ product.finalPrice | copCurrency }}
              </span>
            }
          </div>
          @if (product.activeDiscountPercent) {
            <p class="font-display text-[17px] font-bold tracking-[-0.01em] leading-tight" style="color:var(--color-error)">
              {{ discountedPrice(product) | copCurrency }}
            </p>
          } @else {
            <p class="font-display text-[17px] font-bold text-text-primary tracking-[-0.01em] leading-tight">
              {{ product.finalPrice | copCurrency }}
            </p>
          }
          <p class="text-[10px] text-text-muted font-mono mt-0.5">IVA incluido</p>
        </div>
      </div>
    </a>
  `,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: ProductSummary;
  @Input() badge?: 'OFERTA' | 'NUEVO' | null = null;
  @Input() inWishlist = false;

  discountedPrice(p: ProductSummary): number {
    if (!p.activeDiscountPercent) return p.finalPrice;
    return p.finalPrice * (1 - p.activeDiscountPercent / 100);
  }

  readonly placeholder = PLACEHOLDER;
  readonly hover = signal(false);
  readonly tilt  = signal({ rx: 0, ry: 0 });

  @Output() addToCart = new EventEmitter<ProductSummary>();
  @Output() quickView = new EventEmitter<ProductSummary>();
  @Output() favorite  = new EventEmitter<ProductSummary>();

  cardTransform(): string {
    const t = this.tilt();
    const lift = this.hover() ? -6 : 0;
    return `perspective(900px) rotateX(${t.rx}deg) rotateY(${t.ry}deg) translateY(${lift}px)`;
  }

  onMove(e: MouseEvent) {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    this.tilt.set({ ry: (px - 0.5) * 6, rx: -(py - 0.5) * 6 });
  }

  onLeave() {
    this.hover.set(false);
    this.tilt.set({ rx: 0, ry: 0 });
  }
}
