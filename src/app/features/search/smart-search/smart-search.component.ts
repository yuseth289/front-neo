import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgIcon } from '@ng-icons/core';
import * as SearchAiActions from '../../../core/store/search-ai/search-ai.actions';
import {
  selectSearchIsLoading,
  selectClarificationNeeded,
  selectClarificationQuestion,
  selectSearchError,
} from '../../../core/store/search-ai/search-ai.selectors';
import { SearchResultsComponent } from '../search-results/search-results.component';
import { AiTypingIndicatorComponent } from '../../../shared/components/ai-typing-indicator.component';

@Component({
  selector: 'app-smart-search',
  standalone: true,
  imports: [FormsModule, NgIcon, SearchResultsComponent, AiTypingIndicatorComponent],
  template: `
    <div class="min-h-screen bg-bg-base">
      <!-- ── Hero ─────────────────────────────────────────────────── -->
      <section class="relative overflow-hidden border-b border-border py-16 px-6">
        <div class="neo-ambient">
          <span class="neo-orb violet" style="width:420px;height:420px;top:-8%;left:5%;animation-delay:0s;"></span>
          <span class="neo-orb cyan"   style="width:360px;height:360px;bottom:-10%;right:8%;animation-delay:1.8s;"></span>
        </div>

        <div class="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
          <span class="inline-flex items-center gap-2 px-3.5 py-1.5 border border-border-strong rounded-full
                       bg-bg-surface/70 backdrop-blur text-xs text-text-secondary font-mono tracking-widest">
            <ng-icon name="lucideSparkles" size="12" class="text-violet-400" />
            BÚSQUEDA INTELIGENTE CON IA
          </span>

          <h1 class="text-4xl font-bold tracking-tight text-text-primary">
            Encuentra exactamente lo que buscas
          </h1>
          <p class="text-text-secondary text-lg">
            Describe lo que necesitas en lenguaje natural. La IA entiende tu presupuesto, juego y preferencias.
          </p>

          <!-- Search box -->
          <form (ngSubmit)="onSearch()" class="w-full flex gap-2">
            <div class="relative flex-1">
              <ng-icon name="lucideSearch" size="18"
                       class="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
              <input
                type="text"
                [(ngModel)]="query"
                name="query"
                placeholder="ej. mouse gamer para FPS con menos de 150mil, que funcione con fortnite"
                class="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border bg-bg-surface
                       text-text-primary placeholder:text-text-tertiary text-sm
                       focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60"
                [disabled]="isLoading()"
              />
            </div>
            <button type="submit"
                    [disabled]="isLoading() || !query.trim()"
                    class="px-5 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50
                           disabled:cursor-not-allowed text-white text-sm font-medium transition-colors
                           flex items-center gap-2 shrink-0">
              <ng-icon name="lucideSparkles" size="16" />
              Buscar
            </button>
          </form>

          <!-- Loading indicator -->
          @if (isLoading()) {
            <app-ai-typing-indicator />
          }

          <!-- Error -->
          @if (searchError()) {
            <div class="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20
                        text-red-400 text-sm">
              <ng-icon name="lucideCircleAlert" size="16" />
              {{ searchError() }}
            </div>
          }
        </div>
      </section>

      <!-- ── Clarification prompt ──────────────────────────────────── -->
      @if (clarificationNeeded() && clarificationQuestion()) {
        <section class="max-w-3xl mx-auto px-6 py-6">
          <div class="p-5 rounded-xl border border-violet-500/30 bg-violet-500/5">
            <div class="flex items-start gap-3">
              <ng-icon name="lucideSparkles" size="20" class="text-violet-400 shrink-0 mt-0.5" />
              <div class="flex-1 flex flex-col gap-3">
                <p class="text-text-primary text-sm font-medium">{{ clarificationQuestion() }}</p>
                <form (ngSubmit)="onClarify()" class="flex gap-2">
                  <input
                    type="text"
                    [(ngModel)]="clarification"
                    name="clarification"
                    placeholder="Tu respuesta..."
                    class="flex-1 px-3 py-2 rounded-lg border border-border bg-bg-surface
                           text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                  <button type="submit"
                          [disabled]="!clarification.trim()"
                          class="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50
                                 text-white text-sm font-medium transition-colors">
                    Enviar
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      }

      <!-- ── Results ───────────────────────────────────────────────── -->
      <app-search-results />
    </div>
  `,
})
export class SmartSearchComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);

  query = '';
  clarification = '';

  readonly isLoading = toSignal(this.store.select(selectSearchIsLoading), { initialValue: false });
  readonly clarificationNeeded = toSignal(this.store.select(selectClarificationNeeded), { initialValue: false });
  readonly clarificationQuestion = toSignal(this.store.select(selectClarificationQuestion), { initialValue: null });
  readonly searchError = toSignal(this.store.select(selectSearchError), { initialValue: null });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const q = this.route.snapshot.queryParamMap.get('q');
    if (q?.trim()) {
      this.query = q.trim();
      this.store.dispatch(SearchAiActions.search({ query: this.query }));
    }
  }

  onSearch(): void {
    if (!this.query.trim() || this.isLoading()) return;
    this.router.navigate([], { queryParams: { q: this.query.trim() }, replaceUrl: true });
    this.store.dispatch(SearchAiActions.search({ query: this.query.trim() }));
  }

  onClarify(): void {
    if (!this.clarification.trim()) return;
    this.store.dispatch(SearchAiActions.submitClarification({
      query: this.query.trim(),
      clarification: this.clarification.trim(),
    }));
    this.clarification = '';
  }
}
