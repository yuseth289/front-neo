import { Component, OnInit, inject, PLATFORM_ID, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
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
  selectHasSearched,
  selectHasResults,
} from '../../../core/store/search-ai/search-ai.selectors';
import { SearchResultsComponent } from '../search-results/search-results.component';
import { AiTypingIndicatorComponent } from '../../../shared/components/ai-typing-indicator.component';

@Component({
  selector: 'app-smart-search',
  standalone: true,
  imports: [FormsModule, NgIcon, SearchResultsComponent, AiTypingIndicatorComponent],
  template: `
    <div class="flex flex-col bg-bg-base" style="min-height: calc(100vh - 72px)">

      <!-- Ambient orbs in background -->
      <div class="neo-ambient pointer-events-none">
        <span class="neo-orb violet" style="width:500px;height:500px;top:-5%;left:-5%;animation-delay:0s;"></span>
        <span class="neo-orb cyan"   style="width:400px;height:400px;bottom:-10%;right:5%;animation-delay:2s;"></span>
      </div>

      <!-- ── Messages area ──────────────────────────────────────── -->
      <div class="relative flex-1 flex flex-col items-center px-4">

        <!-- EMPTY STATE — centered greeting (Vercel style) -->
        @if (!hasSearched() && !isLoading()) {
          <div class="w-full max-w-2xl flex flex-col items-center justify-center gap-6 text-center py-16">

            <div class="flex flex-col items-center gap-4">
              <div class="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20
                          flex items-center justify-center">
                <ng-icon name="lucideSparkles" size="22" class="text-violet-400" />
              </div>
              <div class="flex flex-col gap-2">
                <h1 class="text-[26px] font-semibold text-text-primary tracking-tight">
                  ¿Qué estás buscando hoy?
                </h1>
                <p class="text-[13px] text-text-muted max-w-sm leading-relaxed">
                  Describe lo que necesitas — presupuesto, juego, uso. La IA encuentra los mejores productos.
                </p>
              </div>
            </div>

            @if (searchError()) {
              <div class="w-full flex items-center gap-2 px-4 py-3 rounded-xl
                          bg-red-500/8 border border-red-500/20 text-red-400 text-[13px]">
                <ng-icon name="lucideCircleAlert" size="14" />{{ searchError() }}
              </div>
            }

            <!-- Suggested queries 2×2 grid -->
            <div class="grid grid-cols-2 gap-2 w-full mt-2">
              <button (click)="runSuggestedQuery('mouse gamer para FPS menos de 150 mil')"
                      class="flex flex-col gap-1.5 p-3.5 rounded-xl border border-border/60 bg-bg-elevated
                             text-left hover:bg-bg-subtle hover:-translate-y-0.5 hover:border-border
                             transition-all duration-200">
                <ng-icon name="lucideMouse" size="15" class="text-violet-400" />
                <p class="text-[12px] font-medium text-text-primary">Mouse FPS</p>
                <p class="text-[10px] text-text-muted leading-relaxed">mouse gamer para FPS menos de 150 mil</p>
              </button>

              <button (click)="runSuggestedQuery('teclado mecánico para oficina silencioso')"
                      class="flex flex-col gap-1.5 p-3.5 rounded-xl border border-border/60 bg-bg-elevated
                             text-left hover:bg-bg-subtle hover:-translate-y-0.5 hover:border-border
                             transition-all duration-200">
                <ng-icon name="lucideKeyboard" size="15" class="text-blue-400" />
                <p class="text-[12px] font-medium text-text-primary">Teclado silencioso</p>
                <p class="text-[10px] text-text-muted leading-relaxed">teclado mecánico para oficina silencioso</p>
              </button>

              <button (click)="runSuggestedQuery('audífonos gaming con micrófono menos de 200 mil')"
                      class="flex flex-col gap-1.5 p-3.5 rounded-xl border border-border/60 bg-bg-elevated
                             text-left hover:bg-bg-subtle hover:-translate-y-0.5 hover:border-border
                             transition-all duration-200">
                <ng-icon name="lucideHeadphones" size="15" class="text-green-400" />
                <p class="text-[12px] font-medium text-text-primary">Audífonos gaming</p>
                <p class="text-[10px] text-text-muted leading-relaxed">audífonos gaming con micrófono menos de 200 mil</p>
              </button>

              <button (click)="runSuggestedQuery('setup gamer completo con 1 millón de pesos')"
                      class="flex flex-col gap-1.5 p-3.5 rounded-xl border border-border/60 bg-bg-elevated
                             text-left hover:bg-bg-subtle hover:-translate-y-0.5 hover:border-border
                             transition-all duration-200">
                <ng-icon name="lucideMonitor" size="15" class="text-yellow-400" />
                <p class="text-[12px] font-medium text-text-primary">Setup completo</p>
                <p class="text-[10px] text-text-muted leading-relaxed">setup gamer completo con 1 millón</p>
              </button>
            </div>
          </div>
        }

        <!-- CHAT FLOW — after search is triggered -->
        @if (hasSearched() || isLoading()) {
          <div class="w-full max-w-2xl flex flex-col gap-6 py-8">

            <!-- User message pill -->
            @if (query.trim()) {
              <div class="flex justify-end">
                <div class="px-4 py-2.5 rounded-2xl rounded-br-sm
                            bg-bg-elevated border border-border/50
                            text-[13px] text-text-primary max-w-[80%]">
                  {{ query }}
                </div>
              </div>
            }

            <!-- Loading -->
            @if (isLoading()) {
              <div class="flex gap-2.5">
                <div class="w-6 h-6 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <ng-icon name="lucideSparkles" size="11" class="text-violet-400" />
                </div>
                <div class="pt-0.5 flex flex-col gap-1">
                  <app-ai-typing-indicator />
                  <p class="text-[11px] text-text-muted animate-pulse">Analizando tu búsqueda…</p>
                </div>
              </div>
            }

            <!-- Clarification question -->
            @if (clarificationNeeded() && clarificationQuestion() && !isLoading()) {
              <div #clarificationRef class="flex gap-2.5">
                <div class="w-6 h-6 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <ng-icon name="lucideSparkles" size="11" class="text-violet-400" />
                </div>
                <div class="flex-1 flex flex-col gap-3 min-w-0">
                  <p class="text-[13px] text-text-primary leading-[1.65]">{{ clarificationQuestion() }}</p>
                  <form (ngSubmit)="onClarify()"
                        class="rounded-2xl border border-border/60 bg-bg-elevated focus-within:border-border transition-colors">
                    <div class="flex items-center gap-1.5 px-3 py-2.5">
                      <input type="text" [(ngModel)]="clarification" name="clarification"
                             placeholder="Escribe tu respuesta…" autofocus
                             class="flex-1 bg-transparent text-[13px] text-text-primary
                                    placeholder:text-text-muted outline-none border-none min-w-0" />
                      <button type="submit" [disabled]="!clarification.trim()"
                              class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                                     bg-text-primary hover:opacity-80 disabled:opacity-20
                                     disabled:cursor-not-allowed transition-all">
                        <ng-icon name="lucideArrowUp" size="14" class="text-bg-base" />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            }

            <!-- Error -->
            @if (searchError() && !isLoading()) {
              <div class="flex gap-2.5">
                <div class="w-6 h-6 rounded-full bg-red-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <ng-icon name="lucideCircleAlert" size="11" class="text-red-400" />
                </div>
                <p class="text-[13px] text-red-400 leading-relaxed">{{ searchError() }}</p>
              </div>
            }

            <!-- Results -->
            @if (hasResults() && !isLoading()) {
              <div class="flex gap-2.5">
                <div class="w-6 h-6 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <ng-icon name="lucideSparkles" size="11" class="text-violet-400" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[13px] text-text-primary leading-relaxed mb-5">
                    Aquí están los mejores resultados para tu búsqueda:
                  </p>
                  <app-search-results />
                </div>
              </div>
            }

          </div>
        }
      </div>

      <!-- ── Bottom input — Vercel PromptInput style ──────────── -->
      <div class="sticky bottom-0 z-10 px-4 py-4 bg-bg-base/90 backdrop-blur-sm border-t border-border/40">
        <div class="max-w-2xl mx-auto">
          <form (ngSubmit)="onSearch()">
            <div class="rounded-2xl border border-border/60 bg-bg-elevated
                        focus-within:border-border transition-colors">
              <div class="flex items-center gap-1.5 px-3 py-2.5">
                <ng-icon name="lucideSparkles" size="14" class="text-violet-400 shrink-0" />
                <input type="text" [(ngModel)]="query" name="query"
                       placeholder="Describe lo que buscas…"
                       [disabled]="isLoading()"
                       class="flex-1 bg-transparent text-[13px] text-text-primary
                              placeholder:text-text-muted outline-none border-none min-w-0
                              disabled:opacity-50" />
                <button type="submit" [disabled]="isLoading() || !query.trim()"
                        class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                               bg-text-primary hover:opacity-80
                               disabled:opacity-20 disabled:cursor-not-allowed transition-all">
                  <ng-icon name="lucideArrowUp" size="14" class="text-bg-base" />
                </button>
              </div>
            </div>
          </form>
          <p class="text-[10px] text-text-muted text-center mt-1.5 opacity-60">Enter para buscar</p>
        </div>
      </div>

    </div>
  `,
})
export class SmartSearchComponent implements OnInit, AfterViewChecked {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('clarificationRef') clarificationRef?: ElementRef<HTMLDivElement>;

  query = '';
  clarification = '';
  private shouldScrollToClarification = false;

  readonly isLoading = toSignal(this.store.select(selectSearchIsLoading), { initialValue: false });
  readonly clarificationNeeded = toSignal(this.store.select(selectClarificationNeeded), { initialValue: false });
  readonly clarificationQuestion = toSignal(this.store.select(selectClarificationQuestion), { initialValue: null });
  readonly searchError = toSignal(this.store.select(selectSearchError), { initialValue: null });
  readonly hasSearched = toSignal(this.store.select(selectHasSearched), { initialValue: false });
  readonly hasResults = toSignal(this.store.select(selectHasResults), { initialValue: false });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const q = this.route.snapshot.queryParamMap.get('q');
    if (q?.trim()) {
      this.query = q.trim();
      this.store.dispatch(SearchAiActions.search({ query: this.query }));
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToClarification && this.clarificationRef) {
      this.clarificationRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.shouldScrollToClarification = false;
    }
  }

  onSearch(): void {
    if (!this.query.trim() || this.isLoading()) return;
    this.router.navigate([], { queryParams: { q: this.query.trim() }, replaceUrl: true });
    this.store.dispatch(SearchAiActions.search({ query: this.query.trim() }));
    this.shouldScrollToClarification = true;
  }

  onClarify(): void {
    if (!this.clarification.trim()) return;
    this.store.dispatch(SearchAiActions.submitClarification({
      query: this.query.trim(),
      clarification: this.clarification.trim(),
    }));
    this.clarification = '';
  }

  runSuggestedQuery(q: string): void {
    this.query = q;
    this.onSearch();
  }
}
