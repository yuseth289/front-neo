import {
  Component, OnInit, inject, PLATFORM_ID, ElementRef, ViewChild,
  AfterViewChecked, signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgIcon } from '@ng-icons/core';
import * as SearchAiActions from '../../../core/store/search-ai/search-ai.actions';
import {
  selectGreeting,
  selectClosingMessage,
  selectSearchIsLoading,
  selectClarificationNeeded,
  selectClarificationQuestion,
  selectSearchError,
  selectHasSearched,
  selectHasResults,
} from '../../../core/store/search-ai/search-ai.selectors';
import { SearchResultsComponent } from '../search-results/search-results.component';
import { AiTypingIndicatorComponent } from '../../../shared/components/ai-typing-indicator.component';

interface HistoryItem {
  id: string;
  query: string;
  ts: number;
}

const HISTORY_KEY = 'neo_search_history';
const MAX_HISTORY = 20;

@Component({
  selector: 'app-smart-search',
  standalone: true,
  imports: [FormsModule, NgIcon, SearchResultsComponent, AiTypingIndicatorComponent],
  template: `
    <div class="flex bg-bg-base" style="height: calc(100vh - 72px)">

      <!-- Ambient orbs -->
      <div class="neo-ambient pointer-events-none">
        <span class="neo-orb violet" style="width:500px;height:500px;top:-5%;left:-5%;animation-delay:0s;"></span>
        <span class="neo-orb cyan"   style="width:400px;height:400px;bottom:-10%;right:5%;animation-delay:2s;"></span>
      </div>

      <!-- ── LEFT SIDEBAR: History ──────────────────────────────── -->
      <div class="hidden md:flex shrink-0 w-[220px] flex-col border-r border-border/40 bg-bg-surface z-10">

        <!-- New conversation button -->
        <div class="px-3 py-3 border-b border-border/40 shrink-0">
          <button (click)="newConversation()"
                  class="w-full flex items-center gap-2 px-3 py-2 rounded-xl
                         border border-border/60 bg-bg-elevated
                         text-[12px] text-text-secondary hover:text-text-primary hover:border-border
                         transition-colors">
            <ng-icon name="lucidePlus" size="13" />
            Nueva búsqueda
          </button>
        </div>

        <!-- History list -->
        <div class="flex-1 overflow-y-auto px-2 py-2">
          @if (history().length === 0) {
            <p class="text-[11px] text-text-muted text-center py-6 leading-relaxed px-2">
              Las búsquedas aparecerán aquí
            </p>
          } @else {
            <p class="text-[9px] text-text-muted uppercase tracking-widest px-2 mb-1.5">Recientes</p>
            @for (item of history(); track item.id) {
              <div class="group flex items-center gap-1.5 px-2 py-2 rounded-lg cursor-pointer
                          hover:bg-bg-elevated transition-colors"
                   [class.bg-bg-elevated]="item.query === activeQuery"
                   (click)="loadConversation(item.query)">
                <ng-icon name="lucideSearch" size="11" class="text-text-muted shrink-0" />
                <span class="flex-1 text-[11px] text-text-secondary truncate leading-snug">
                  {{ item.query }}
                </span>
                <button (click)="$event.stopPropagation(); deleteHistory(item.id)"
                        class="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center
                               text-text-muted hover:text-red-400 transition-all shrink-0">
                  <ng-icon name="lucideX" size="10" />
                </button>
              </div>
            }

            <!-- Clear all -->
            <div class="px-2 pt-3 pb-1 border-t border-border/30 mt-2">
              <button (click)="clearAllHistory()"
                      class="w-full text-[10px] text-text-muted hover:text-red-400
                             transition-colors py-1 text-left flex items-center gap-1.5">
                <ng-icon name="lucideTrash2" size="10" />
                Borrar historial
              </button>
            </div>
          }
        </div>
      </div>

      <!-- ── MAIN: Chat area ─────────────────────────────────────── -->
      <div class="flex-1 flex flex-col min-w-0 relative">

        <!-- Messages scroll area -->
        <div class="flex-1 flex flex-col items-center px-4 overflow-y-auto">

          <!-- EMPTY STATE -->
          @if (!hasSearched() && !isLoading()) {
            <div class="w-full max-w-2xl flex flex-col items-center justify-center gap-6 text-center py-8">

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

              <!-- Suggested queries 2×2 -->
              <div class="grid grid-cols-2 gap-2 w-full mt-2">
                <button (click)="runSuggestedQuery('mouse gamer para FPS menos de 150 mil')"
                        class="flex flex-col gap-1.5 p-3.5 rounded-xl border border-border/60 bg-bg-elevated
                               text-left hover:bg-bg-subtle hover:-translate-y-0.5 hover:border-border
                               transition-all duration-200">
                  <ng-icon name="lucideMouse" size="15" class="text-violet-400" />
                  <p class="text-[12px] font-medium text-text-primary">Mouse FPS</p>
                  <p class="text-[10px] text-text-muted leading-relaxed">menos de 150 mil</p>
                </button>

                <button (click)="runSuggestedQuery('teclado mecánico para oficina silencioso')"
                        class="flex flex-col gap-1.5 p-3.5 rounded-xl border border-border/60 bg-bg-elevated
                               text-left hover:bg-bg-subtle hover:-translate-y-0.5 hover:border-border
                               transition-all duration-200">
                  <ng-icon name="lucideKeyboard" size="15" class="text-blue-400" />
                  <p class="text-[12px] font-medium text-text-primary">Teclado silencioso</p>
                  <p class="text-[10px] text-text-muted leading-relaxed">oficina, bajo ruido</p>
                </button>

                <button (click)="runSuggestedQuery('audífonos gaming con micrófono menos de 200 mil')"
                        class="flex flex-col gap-1.5 p-3.5 rounded-xl border border-border/60 bg-bg-elevated
                               text-left hover:bg-bg-subtle hover:-translate-y-0.5 hover:border-border
                               transition-all duration-200">
                  <ng-icon name="lucideHeadphones" size="15" class="text-green-400" />
                  <p class="text-[12px] font-medium text-text-primary">Audífonos gaming</p>
                  <p class="text-[10px] text-text-muted leading-relaxed">con micrófono, menos de 200 mil</p>
                </button>

                <button (click)="runSuggestedQuery('setup gamer completo más económico para juegos actuales')"
                        class="flex flex-col gap-1.5 p-3.5 rounded-xl border border-border/60 bg-bg-elevated
                               text-left hover:bg-bg-subtle hover:-translate-y-0.5 hover:border-border
                               transition-all duration-200">
                  <ng-icon name="lucideMonitor" size="15" class="text-yellow-400" />
                  <p class="text-[12px] font-medium text-text-primary">Setup completo</p>
                  <p class="text-[10px] text-text-muted leading-relaxed">más económico</p>
                </button>
              </div>
            </div>
          }

          <!-- CHAT FLOW -->
          @if (hasSearched() || isLoading()) {
            <div class="w-full max-w-2xl flex flex-col gap-6 py-8">

              <!-- User message pill -->
              @if (activeQuery) {
                <div class="flex justify-end">
                  <div class="px-4 py-2.5 rounded-2xl rounded-br-sm
                              bg-bg-elevated border border-border/50
                              text-[13px] text-text-primary max-w-[80%]
                              break-words overflow-hidden">
                    {{ activeQuery }}
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

              <!-- Clarification -->
              @if (clarificationNeeded() && clarificationQuestion() && !isLoading()) {
                <div #clarificationRef class="flex gap-2.5">
                  <div class="w-6 h-6 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
                    <ng-icon name="lucideSparkles" size="11" class="text-violet-400" />
                  </div>
                  <div class="flex-1 flex flex-col gap-3 min-w-0">
                    <p class="text-[13px] text-text-primary leading-[1.65] break-words">{{ clarificationQuestion() }}</p>
                    <form (ngSubmit)="onClarify()"
                          class="rounded-2xl border border-border/60 bg-bg-elevated focus-within:border-border transition-colors">
                      <div class="flex items-center gap-1.5 px-3 py-2.5">
                        <input type="text" [(ngModel)]="clarification" name="clarification"
                               placeholder="Escribe tu respuesta…" autofocus maxlength="300"
                               class="flex-1 bg-transparent text-[13px] text-text-primary
                                      placeholder:text-text-muted outline-none border-none min-w-0" />
                        <button type="submit" [disabled]="!clarification.trim()"
                                class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                                       disabled:cursor-not-allowed transition-all duration-200"
                                [style.background]="clarification.trim() ? 'var(--color-accent)' : 'var(--color-bg-base)'"
                                [style.box-shadow]="clarification.trim() ? '0 0 10px var(--color-accent-glow)' : 'none'"
                                [style.border]="clarification.trim() ? 'none' : '1px solid var(--color-border)'">
                          <ng-icon name="lucideArrowUp" size="14"
                                   [style.color]="clarification.trim() ? 'white' : 'var(--color-text-muted)'" />
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
                  <div class="flex-1 min-w-0 overflow-hidden">
                    <p class="text-[13px] text-text-primary leading-relaxed mb-4">
                      {{ greeting() ?? 'Aquí están los mejores resultados para tu búsqueda:' }}
                    </p>
                    <app-search-results />
                    @if (closingMessage()) {
                      <p class="text-[12px] font-semibold text-text-muted mt-3">{{ closingMessage() }}</p>
                    }
                  </div>
                </div>
              }

            </div>
          }
        </div>

        <!-- ── Bottom PromptInput ───────────────────────────────── -->
        <div class="sticky bottom-0 z-10 px-4 py-4 bg-bg-base/90 backdrop-blur-sm border-t border-border/40">
          <div class="max-w-2xl mx-auto">

            <!-- Cuando hay pregunta de aclaración pendiente: hint, no segundo input -->
            @if (clarificationNeeded() && !isLoading()) {
              <div class="flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-violet-500/30
                          bg-violet-500/5 text-[12px] text-violet-400">
                <ng-icon name="lucideCornerLeftUp" size="14" class="shrink-0" />
                Responde la pregunta de la IA para continuar
              </div>
            } @else {
              <form (ngSubmit)="onSearch()">
                <div class="rounded-2xl border border-border/60 bg-bg-elevated
                            focus-within:border-border transition-colors">
                  <div class="flex items-center gap-1.5 px-3 py-2.5">
                    <ng-icon name="lucideSparkles" size="14" class="text-violet-400 shrink-0" />
                    <input type="text" [(ngModel)]="query" name="query"
                           placeholder="Describe lo que buscas…"
                           maxlength="500"
                           [disabled]="isLoading()"
                           class="flex-1 bg-transparent text-[13px] text-text-primary
                                  placeholder:text-text-muted outline-none border-none min-w-0
                                  disabled:opacity-50" />
                    <button type="submit" [disabled]="isLoading() || !query.trim()"
                            class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                                   disabled:cursor-not-allowed transition-all duration-200"
                            [style.background]="query.trim() && !isLoading() ? 'var(--color-accent)' : 'var(--color-bg-base)'"
                            [style.box-shadow]="query.trim() && !isLoading() ? '0 0 10px var(--color-accent-glow)' : 'none'"
                            [style.border]="query.trim() && !isLoading() ? 'none' : '1px solid var(--color-border)'">
                      <ng-icon name="lucideArrowUp" size="14"
                               [style.color]="query.trim() && !isLoading() ? 'white' : 'var(--color-text-muted)'" />
                    </button>
                  </div>
                </div>
              </form>
              <p class="text-[10px] text-text-muted text-center mt-1.5 opacity-60">Enter para buscar</p>
            }

          </div>
        </div>

      </div><!-- /main -->
    </div>
  `,
})
export class SmartSearchComponent implements OnInit, AfterViewChecked {
  private readonly store      = inject(Store);
  private readonly router     = inject(Router);
  private readonly route      = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('clarificationRef') clarificationRef?: ElementRef<HTMLDivElement>;

  query         = '';
  clarification = '';
  activeQuery   = '';     // the query that was last submitted (shown in the user bubble)
  history       = signal<HistoryItem[]>([]);

  private shouldScrollToClarification = false;

  readonly greeting             = toSignal(this.store.select(selectGreeting),              { initialValue: null });
  readonly closingMessage       = toSignal(this.store.select(selectClosingMessage),        { initialValue: null });
  readonly isLoading            = toSignal(this.store.select(selectSearchIsLoading),       { initialValue: false });
  readonly clarificationNeeded  = toSignal(this.store.select(selectClarificationNeeded),   { initialValue: false });
  readonly clarificationQuestion = toSignal(this.store.select(selectClarificationQuestion), { initialValue: null });
  readonly searchError          = toSignal(this.store.select(selectSearchError),           { initialValue: null });
  readonly hasSearched          = toSignal(this.store.select(selectHasSearched),           { initialValue: false });
  readonly hasResults           = toSignal(this.store.select(selectHasResults),            { initialValue: false });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loadHistory();
    const q = this.route.snapshot.queryParamMap.get('q');
    if (q?.trim()) {
      this.query       = q.trim();
      this.activeQuery = q.trim();
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
    this.activeQuery = this.query.trim();
    this.query = '';
    this.router.navigate([], { queryParams: { q: this.activeQuery }, replaceUrl: true });
    this.store.dispatch(SearchAiActions.search({ query: this.activeQuery }));
    this.saveToHistory(this.activeQuery);
    this.shouldScrollToClarification = true;
  }

  onClarify(): void {
    if (!this.clarification.trim()) return;
    this.store.dispatch(SearchAiActions.submitClarification({
      query: this.activeQuery || this.query.trim(),
      clarification: this.clarification.trim(),
    }));
    this.clarification = '';
  }

  runSuggestedQuery(q: string): void {
    this.query = q;
    this.onSearch();
  }

  newConversation(): void {
    this.store.dispatch(SearchAiActions.clearResults());
    this.query       = '';
    this.activeQuery = '';
    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  loadConversation(q: string): void {
    this.query = q;
    this.onSearch();
  }

  deleteHistory(id: string): void {
    const updated = this.history().filter(h => h.id !== id);
    this.history.set(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  }

  clearAllHistory(): void {
    this.history.set([]);
    localStorage.removeItem(HISTORY_KEY);
  }

  private loadHistory(): void {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) this.history.set(JSON.parse(raw) as HistoryItem[]);
    } catch { /* ignore */ }
  }

  private saveToHistory(q: string): void {
    const existing = this.history().filter(h => h.query !== q);
    const updated: HistoryItem[] = [
      { id: Date.now().toString(), query: q, ts: Date.now() },
      ...existing,
    ].slice(0, MAX_HISTORY);
    this.history.set(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  }
}
