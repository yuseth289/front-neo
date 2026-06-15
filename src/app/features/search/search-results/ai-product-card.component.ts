import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { ProductRecommendation } from '../../../shared/models/search.models';

const PLACEHOLDER = 'https://placehold.co/400x400/1a1a2e/e2e8f0?text=Neo';

@Component({
  selector: 'app-ai-product-card',
  standalone: true,
  imports: [RouterLink, NgIcon],
  template: `
    <a [routerLink]="['/product', recommendation.slug ?? recommendation.productId]"
       class="group flex gap-3 p-3 rounded-xl border border-border/50 bg-bg-elevated
              hover:border-violet-500/40 hover:bg-bg-subtle transition-all duration-200 no-underline">

      <!-- Thumbnail -->
      <div class="relative shrink-0 w-[72px] h-[72px] rounded-lg overflow-hidden bg-bg-base border border-border/40">
        <img [src]="recommendation.imageUrl ?? placeholder"
             [alt]="recommendation.productName"
             class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        @if (!recommendation.stockAvailable) {
          <div class="absolute inset-0 bg-bg-base/70 flex items-center justify-center">
            <span class="text-[9px] font-semibold text-text-muted">Sin stock</span>
          </div>
        }
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0 flex flex-col justify-between gap-1">
        <div class="flex items-start justify-between gap-2">
          <h3 class="text-[12px] font-semibold text-text-primary line-clamp-2 leading-snug flex-1 min-w-0">
            {{ recommendation.productName }}
          </h3>
          <span class="shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-violet-600/20 text-violet-300"
                title="Nivel de coincidencia con tu búsqueda">
            {{ pct }}% coincidencia
          </span>
        </div>

        <div class="flex items-center justify-between gap-2">
          <div class="flex flex-col gap-0.5">
            @if (recommendation.priceFormatted) {
              <span class="text-[13px] font-bold text-violet-400">{{ recommendation.priceFormatted }}</span>
            }
            @if (recommendation.priceFit) {
              <span class="text-[9px] text-text-muted flex items-center gap-1">
                <ng-icon name="lucideCheck" size="9" class="text-green-400" />Dentro del presupuesto
              </span>
            }
          </div>
          <span class="shrink-0 text-[10px] font-medium px-2.5 py-1 rounded-lg
                       bg-bg-base border border-border/50 text-text-secondary
                       group-hover:border-violet-500/40 group-hover:text-violet-300 transition-colors">
            Ver →
          </span>
        </div>

        @if (recommendation.explanation) {
          <p class="text-[10px] text-text-muted line-clamp-1 leading-relaxed">
            {{ recommendation.explanation }}
          </p>
        }
      </div>
    </a>
  `,
})
export class AiProductCardComponent {
  @Input({ required: true }) recommendation!: ProductRecommendation;

  readonly placeholder = PLACEHOLDER;

  get pct(): number {
    return Math.round(this.recommendation.relevanceScore * 100);
  }
}
