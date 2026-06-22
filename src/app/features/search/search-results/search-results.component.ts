import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgIcon } from '@ng-icons/core';
import {
  selectRecommendations,
  selectSearchIsLoading,
  selectHasResults,
  selectSearchProcessingTime,
  selectHasSearched,
  selectClarificationNeeded,
  selectLastQuery,
} from '../../../core/store/search-ai/search-ai.selectors';
import { AiProductCardComponent } from './ai-product-card.component';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [AiProductCardComponent, NgIcon],
  template: `
    @if (hasResults() && !isLoading()) {
      <div class="flex flex-col gap-2">
        <!-- Count + timing row -->
        <div class="flex items-center justify-between mb-1">
          <p class="text-[11px] text-text-muted">
            {{ recommendations().length }} producto{{ recommendations().length !== 1 ? 's' : '' }} recomendados
          </p>
          @if (processingTime()) {
            <span class="text-[9px] text-text-muted font-mono opacity-60">{{ processingTime() }}ms</span>
          }
        </div>

        <!-- Compact card list -->
        @for (rec of recommendations(); track rec.productId) {
          <app-ai-product-card [recommendation]="rec" />
        }
      </div>
    }

    <!-- No results -->
    @if (searched() && !isLoading() && !hasResults() && !needsClarification()) {
      <div class="flex flex-col gap-2.5 p-4 rounded-xl border border-border/50 bg-bg-elevated">
        <div class="flex items-center gap-2">
          <ng-icon name="lucidePackageX" size="14" class="text-text-muted" />
          <p class="text-[13px] text-text-primary">No encontramos productos</p>
        </div>
        @if (lastQuery()) {
          <p class="text-[12px] text-text-muted leading-relaxed break-words">
            Sin coincidencias para
            <span class="text-violet-400 break-all">"{{ lastQuery() }}"</span>.
            Prueba con otras palabras o vuelve pronto.
          </p>
        }
      </div>
    }
  `,
})
export class SearchResultsComponent {
  private readonly store = inject(Store);

  readonly recommendations = toSignal(this.store.select(selectRecommendations), { initialValue: [] });
  readonly isLoading      = toSignal(this.store.select(selectSearchIsLoading),   { initialValue: false });
  readonly hasResults     = toSignal(this.store.select(selectHasResults),         { initialValue: false });
  readonly processingTime = toSignal(this.store.select(selectSearchProcessingTime), { initialValue: null });
  readonly searched       = toSignal(this.store.select(selectHasSearched),        { initialValue: false });
  readonly needsClarification = toSignal(this.store.select(selectClarificationNeeded), { initialValue: false });
  readonly lastQuery      = toSignal(this.store.select(selectLastQuery),          { initialValue: null });
}
