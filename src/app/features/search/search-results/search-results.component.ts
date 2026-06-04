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
    <section class="max-w-7xl mx-auto px-6 py-8">

      <!-- ── Resultados ──────────────────────────────── -->
      @if (hasResults() && !isLoading()) {
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold text-text-primary">
            {{ recommendations().length }}
            producto{{ recommendations().length !== 1 ? 's' : '' }} recomendados
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

      <!-- ── Sin resultados (búsqueda completada, no hay productos) ── -->
      @if (searched() && !isLoading() && !hasResults() && !needsClarification()) {
        <div class="flex flex-col items-center justify-center py-20 gap-6 text-center">
          <div class="w-20 h-20 rounded-2xl bg-bg-surface border border-border
                      flex items-center justify-center">
            <ng-icon name="lucidePackageSearch" size="36" class="text-text-tertiary" />
          </div>
          <div class="flex flex-col gap-2">
            <h3 class="text-xl font-semibold text-text-primary">
              No encontramos productos
            </h3>
            <p class="text-text-secondary text-sm max-w-md">
              @if (lastQuery()) {
                No hay productos que coincidan con
                <span class="text-violet-400 font-medium">"{{ lastQuery() }}"</span>
                en el catálogo todavía.
              } @else {
                No hay productos que coincidan con tu búsqueda en el catálogo todavía.
              }
            </p>
          </div>
          <div class="flex flex-col items-center gap-2 px-5 py-4 rounded-xl
                      bg-violet-500/5 border border-violet-500/20 max-w-sm">
            <ng-icon name="lucideLightbulb" size="18" class="text-violet-400" />
            <p class="text-xs text-text-secondary leading-relaxed">
              El catálogo se está llenando con productos gaming. Prueba con otras palabras
              o vuelve pronto.
            </p>
          </div>
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
  readonly searched = toSignal(this.store.select(selectHasSearched), { initialValue: false });
  readonly needsClarification = toSignal(this.store.select(selectClarificationNeeded), { initialValue: false });
  readonly lastQuery = toSignal(this.store.select(selectLastQuery), { initialValue: null });
}
