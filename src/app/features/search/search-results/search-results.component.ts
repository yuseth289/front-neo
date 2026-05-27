import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  selectRecommendations,
  selectSearchIsLoading,
  selectHasResults,
  selectSearchProcessingTime,
} from '../../../core/store/search-ai/search-ai.selectors';
import { AiProductCardComponent } from './ai-product-card.component';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [AiProductCardComponent],
  template: `
    <section class="max-w-7xl mx-auto px-6 py-8">
      @if (hasResults() && !isLoading()) {
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold text-text-primary">
            {{ recommendations().length }} producto{{ recommendations().length !== 1 ? 's' : '' }} recomendados
          </h2>
          @if (processingTime()) {
            <span class="text-xs text-text-tertiary font-mono">
              Procesado en {{ processingTime() }}ms
            </span>
          }
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          @for (rec of recommendations(); track rec.productId) {
            <app-ai-product-card [recommendation]="rec" />
          }
        </div>
      }
    </section>
  `,
})
export class SearchResultsComponent {
  private readonly store = inject(Store);

  readonly recommendations = toSignal(this.store.select(selectRecommendations), { initialValue: [] });
  readonly isLoading = toSignal(this.store.select(selectSearchIsLoading), { initialValue: false });
  readonly hasResults = toSignal(this.store.select(selectHasResults), { initialValue: false });
  readonly processingTime = toSignal(this.store.select(selectSearchProcessingTime), { initialValue: null });
}
