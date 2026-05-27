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
    <article class="group flex flex-col rounded-2xl border border-border bg-bg-surface
                    hover:border-violet-500/40 transition-all duration-200 overflow-hidden">
      <!-- Image -->
      <div class="relative aspect-square overflow-hidden bg-bg-elevated">
        <img
          [src]="recommendation.imageUrl ?? placeholder"
          [alt]="recommendation.productName"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <!-- Relevance badge -->
        <div class="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold
                    bg-violet-600/90 text-white backdrop-blur">
          {{ pct }}% match
        </div>
        @if (!recommendation.stockAvailable) {
          <div class="absolute inset-0 bg-bg-base/60 flex items-center justify-center">
            <span class="text-xs font-semibold text-text-secondary border border-border rounded-full px-3 py-1">
              Sin stock
            </span>
          </div>
        }
      </div>

      <!-- Body -->
      <div class="flex flex-col gap-2 p-4 flex-1">
        <h3 class="text-sm font-semibold text-text-primary line-clamp-2 leading-snug">
          {{ recommendation.productName }}
        </h3>

        <!-- Price -->
        @if (recommendation.priceFormatted) {
          <span class="text-base font-bold text-violet-400">{{ recommendation.priceFormatted }}</span>
        }

        <!-- AI explanation -->
        <p class="text-xs text-text-secondary line-clamp-2 leading-relaxed">
          {{ recommendation.explanation }}
        </p>

        <!-- Compatibility note -->
        @if (recommendation.compatibilityNotes) {
          <div class="flex items-start gap-1.5 text-xs text-emerald-400">
            <ng-icon name="lucideCheck" size="12" class="shrink-0 mt-0.5" />
            {{ recommendation.compatibilityNotes }}
          </div>
        }

        <!-- Budget fit -->
        @if (recommendation.priceFit) {
          <div class="flex items-center gap-1 text-xs text-text-tertiary">
            <ng-icon name="lucideDollarSign" size="12" />
            Dentro del presupuesto
          </div>
        }
      </div>

      <!-- CTA -->
      <div class="px-4 pb-4">
        <a [routerLink]="['/product', recommendation.slug ?? recommendation.productId]"
           class="block w-full text-center py-2.5 rounded-lg text-sm font-medium
                  bg-violet-600 hover:bg-violet-500 text-white transition-colors">
          Ver producto
        </a>
      </div>
    </article>
  `,
})
export class AiProductCardComponent {
  @Input({ required: true }) recommendation!: ProductRecommendation;

  readonly placeholder = PLACEHOLDER;

  get pct(): number {
    return Math.round(this.recommendation.relevanceScore * 100);
  }
}
