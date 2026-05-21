import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CopCurrencyPipe } from '../../pipes/cop-currency.pipe';
import { ProductSummary } from '../../models/catalog.models';

const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzFBMUExQSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNTU1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U2luIGltYWdlbjwvdGV4dD48L3N2Zz4=';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, CopCurrencyPipe],
  template: `
    <a
      [routerLink]="['/product', product.slug]"
      class="group flex flex-col bg-bg-surface border border-border rounded-xl overflow-hidden
             hover:border-accent/50 transition-all duration-200 hover:shadow-[0_0_20px_theme(colors.accent-glow)]"
    >
      <!-- Imagen -->
      <div class="relative aspect-square overflow-hidden bg-bg-elevated">
        <img
          [src]="product.primaryImageUrl ?? placeholder"
          [alt]="product.name"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      <!-- Info -->
      <div class="p-4 flex flex-col gap-1 flex-1">
        <p class="text-xs text-text-muted uppercase tracking-wide truncate">{{ product.brand }}</p>
        <h3 class="text-sm font-medium text-text-primary line-clamp-2 leading-snug">
          {{ product.name }}
        </h3>
        <div class="mt-auto pt-3">
          <p class="text-base font-bold text-text-primary">
            {{ product.finalPrice | copCurrency }}
          </p>
          <p class="text-xs text-text-muted">IVA incluido</p>
        </div>
      </div>
    </a>
  `,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: ProductSummary;
  readonly placeholder = PLACEHOLDER;
}
