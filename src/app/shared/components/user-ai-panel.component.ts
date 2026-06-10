import {
  Component, Input, Output, EventEmitter, inject, signal,
  ElementRef, ViewChild, AfterViewChecked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgIcon } from '@ng-icons/core';
import * as SearchAiActions from '../../core/store/search-ai/search-ai.actions';
import {
  selectSearchIsLoading,
  selectClarificationNeeded,
  selectClarificationQuestion,
  selectSearchError,
  selectHasSearched,
  selectHasResults,
} from '../../core/store/search-ai/search-ai.selectors';
import { SearchResultsComponent } from '../../features/search/search-results/search-results.component';
import { AiTypingIndicatorComponent } from './ai-typing-indicator.component';

const QUICK_QUERIES = [
  { icon: 'lucideMouse',      label: 'Mouse FPS',         desc: 'menos de $150.000',       query: 'mouse gamer para FPS menos de 150 mil' },
  { icon: 'lucideKeyboard',   label: 'Teclado mecánico',  desc: 'oficina, silencioso',      query: 'teclado mecánico para oficina silencioso' },
  { icon: 'lucideHeadphones', label: 'Audífonos gaming',  desc: 'con micrófono',            query: 'audífonos gaming con micrófono menos de 200 mil' },
  { icon: 'lucideMonitor',    label: 'Setup completo',    desc: 'más económico',            query: 'setup gamer completo más económico para juegos actuales' },
];

@Component({
  selector: 'app-user-ai-panel',
  standalone: true,
  imports: [FormsModule, RouterLink, NgIcon, SearchResultsComponent, AiTypingIndicatorComponent],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" (click)="close.emit()"></div>

      <div class="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[540px]
                  flex flex-col animate-slide-in-right border-l border-border/40 shadow-2xl"
           style="background:var(--color-bg-surface)">

        <!-- Header -->
        <div class="h-14 flex items-center justify-between px-4 border-b border-border/40 shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center"
                 style="background:linear-gradient(135deg,rgba(255,0,60,0.15),rgba(155,48,255,0.15))">
              <ng-icon name="lucideSparkles" size="15" style="color:#9B30FF" />
            </div>
            <div>
              <p class="text-[13px] font-semibold text-text-primary leading-none">Asistente IA</p>
              <p class="text-[10px] text-text-muted mt-0.5">Encuentra tu próximo equipo</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            @if (hasSearched()) {
              <button (click)="newSearch()"
                      class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px]
                             text-text-secondary hover:text-text-primary hover:bg-bg-elevated
                             border border-border/60 transition-colors">
                <ng-icon name="lucidePlus" size="11" />Nueva
              </button>
            }
            <button (click)="close.emit()"
                    class="w-8 h-8 rounded-lg flex items-center justify-center
                           text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors">
              <ng-icon name="lucideX" size="16" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div #messagesContainer class="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">

          <!-- Empty state: quick queries -->
          @if (!hasSearched() && !isLoading()) {
            <div class="flex flex-col gap-3 pt-1">
              <p class="text-[12px] text-text-secondary font-medium">
                Describe lo que necesitas y la IA encuentra los mejores productos:
              </p>
              <div class="grid grid-cols-2 gap-2">
                @for (q of quickQueries; track q.label) {
                  <button (click)="runQuery(q.query)"
                          class="flex flex-col gap-1.5 p-3 rounded-xl border border-border/60 bg-bg-elevated
                                 text-left hover:bg-bg-subtle hover:-translate-y-0.5 hover:border-border
                                 transition-all duration-150">
                    <ng-icon [name]="q.icon" size="13" class="text-violet-400" />
                    <p class="text-[11px] font-medium text-text-primary">{{ q.label }}</p>
                    <p class="text-[10px] text-text-muted">{{ q.desc }}</p>
                  </button>
                }
              </div>
              <a routerLink="/search" (click)="close.emit()"
                 class="text-center text-[11px] text-text-muted hover:text-accent transition-colors mt-1">
                Ir a búsqueda completa →
              </a>
            </div>
          }

          <!-- User query bubble -->
          @if (activeQuery && (hasSearched() || isLoading())) {
            <div class="flex justify-end">
              <div class="max-w-[80%] px-3 py-2 rounded-2xl rounded-br-sm text-[13px] text-text-primary"
                   style="background:var(--color-bg-elevated);border:1px solid var(--color-border)">
                {{ activeQuery }}
              </div>
            </div>
          }

          <!-- Loading -->
          @if (isLoading()) {
            <div class="flex gap-2.5">
              <div class="w-6 h-6 rounded-full shrink-0 flex items-center justify-center"
                   style="background:rgba(155,48,255,0.15)">
                <ng-icon name="lucideSparkles" size="11" style="color:#9B30FF" />
              </div>
              <div class="flex flex-col gap-1 pt-0.5">
                <app-ai-typing-indicator />
                <p class="text-[11px] text-text-muted animate-pulse">Analizando tu búsqueda…</p>
              </div>
            </div>
          }

          <!-- Clarification -->
          @if (clarificationNeeded() && clarificationQuestion() && !isLoading()) {
            <div class="flex gap-2.5">
              <div class="w-6 h-6 rounded-full shrink-0 flex items-center justify-center"
                   style="background:rgba(155,48,255,0.15)">
                <ng-icon name="lucideSparkles" size="11" style="color:#9B30FF" />
              </div>
              <div class="flex-1 flex flex-col gap-2.5 min-w-0">
                <p class="text-[13px] text-text-primary leading-[1.65]">{{ clarificationQuestion() }}</p>
                <form (ngSubmit)="onClarify()"
                      class="rounded-xl border border-border/60 bg-bg-elevated focus-within:border-border/80 transition-colors">
                  <div class="flex items-center gap-1.5 px-3 py-2">
                    <input type="text" [(ngModel)]="clarification" name="clarification"
                           placeholder="Escribe tu respuesta…" autofocus
                           class="flex-1 bg-transparent text-[13px] text-text-primary
                                  placeholder:text-text-muted outline-none border-none min-w-0" />
                    <button type="submit" [disabled]="!clarification.trim()"
                            class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                                   disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                            style="background:white">
                      <ng-icon name="lucideArrowUp" size="13" style="color:black" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          }

          <!-- Error -->
          @if (searchError() && !isLoading()) {
            <div class="flex gap-2 px-3 py-2 rounded-xl text-[13px]"
                 style="background:rgba(239,68,68,0.08);color:var(--color-error);border:1px solid rgba(239,68,68,0.2)">
              <ng-icon name="lucideCircleAlert" size="14" class="shrink-0 mt-0.5" />
              {{ searchError() }}
            </div>
          }

          <!-- Results -->
          @if (hasResults() && !isLoading()) {
            <div class="flex gap-2.5">
              <div class="w-6 h-6 rounded-full shrink-0 flex items-center justify-center"
                   style="background:rgba(155,48,255,0.15)">
                <ng-icon name="lucideSparkles" size="11" style="color:#9B30FF" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[12px] text-text-muted mb-3">Aquí están los mejores resultados:</p>
                <app-search-results />
                <a routerLink="/search" [queryParams]="{ q: activeQuery }" (click)="close.emit()"
                   class="inline-flex items-center gap-1 mt-3 text-[11px] text-text-muted hover:text-accent transition-colors">
                  Ver búsqueda completa <ng-icon name="lucideArrowRight" size="11" />
                </a>
              </div>
            </div>
          }

        </div>

        <!-- Input -->
        <div class="px-4 py-3 border-t border-border/40 shrink-0">
          <form (ngSubmit)="onSearch()">
            <div class="flex items-center gap-2 rounded-xl border border-border/60 bg-bg-elevated
                        focus-within:border-border/80 transition-colors px-3 py-2">
              <ng-icon name="lucideSparkles" size="13" class="text-violet-400 shrink-0" />
              <input type="text" [(ngModel)]="query" name="query"
                     placeholder="Describe lo que buscas…"
                     [disabled]="isLoading()"
                     class="flex-1 bg-transparent text-[13px] text-text-primary
                            placeholder:text-text-muted outline-none border-none min-w-0
                            disabled:opacity-50" />
              <button type="submit" [disabled]="isLoading() || !query.trim()"
                      class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                             disabled:cursor-not-allowed transition-all duration-200"
                      [style.background]="query.trim() && !isLoading() ? 'var(--color-accent)' : 'var(--color-bg-base)'"
                      [style.box-shadow]="query.trim() && !isLoading() ? '0 0 10px var(--color-accent-glow)' : 'none'"
                      [style.border]="query.trim() && !isLoading() ? 'none' : '1px solid var(--color-border)'">
                <ng-icon name="lucideArrowUp" size="13"
                         [style.color]="query.trim() && !isLoading() ? 'white' : 'var(--color-text-muted)'" />
              </button>
            </div>
          </form>
        </div>

      </div>
    }
  `,
  styles: [`
    @keyframes slide-in-right {
      from { transform: translateX(100%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
    .animate-slide-in-right { animation: slide-in-right 0.22s cubic-bezier(0.16,1,0.3,1); }
  `],
})
export class UserAiPanelComponent implements AfterViewChecked {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;

  private readonly store = inject(Store);

  query         = '';
  clarification = '';
  activeQuery   = '';
  readonly quickQueries = QUICK_QUERIES;

  readonly isLoading           = toSignal(this.store.select(selectSearchIsLoading),       { initialValue: false });
  readonly clarificationNeeded = toSignal(this.store.select(selectClarificationNeeded),   { initialValue: false });
  readonly clarificationQuestion = toSignal(this.store.select(selectClarificationQuestion), { initialValue: null });
  readonly searchError         = toSignal(this.store.select(selectSearchError),           { initialValue: null });
  readonly hasSearched         = toSignal(this.store.select(selectHasSearched),           { initialValue: false });
  readonly hasResults          = toSignal(this.store.select(selectHasResults),            { initialValue: false });

  ngAfterViewChecked(): void {
    const el = this.messagesContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  onSearch(): void {
    if (!this.query.trim() || this.isLoading()) return;
    this.activeQuery = this.query.trim();
    this.store.dispatch(SearchAiActions.search({ query: this.activeQuery }));
    this.query = '';
  }

  runQuery(q: string): void {
    this.activeQuery = q;
    this.store.dispatch(SearchAiActions.search({ query: q }));
  }

  onClarify(): void {
    if (!this.clarification.trim()) return;
    this.store.dispatch(SearchAiActions.submitClarification({
      query: this.activeQuery,
      clarification: this.clarification.trim(),
    }));
    this.clarification = '';
  }

  newSearch(): void {
    this.store.dispatch(SearchAiActions.clearResults());
    this.query       = '';
    this.activeQuery = '';
  }
}
