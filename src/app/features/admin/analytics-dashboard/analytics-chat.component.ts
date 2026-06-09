import { Component, inject, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgIcon } from '@ng-icons/core';
import * as AnalyticsAiActions from '../../../core/store/analytics-ai/analytics-ai.actions';
import {
  selectChatMessages,
  selectAnalyticsIsLoading,
  selectAnalyticsError,
} from '../../../core/store/analytics-ai/analytics-ai.selectors';
import { AiTypingIndicatorComponent } from '../../../shared/components/ai-typing-indicator.component';

const QUICK_QUERIES = [
  { icon: 'lucideDollarSign',  label: 'GMV del mes',       desc: 'Facturación total',       query: '¿Cuál es el GMV y los ingresos totales de este mes?' },
  { icon: 'lucideUsers',       label: 'Usuarios nuevos',   desc: 'Crecimiento y tendencia',  query: '¿Cuántos usuarios nuevos se registraron este mes y cómo va el crecimiento?' },
  { icon: 'lucideTrendingUp',  label: 'Top productos',     desc: 'Más vendidos del marketplace', query: '¿Cuáles son los productos más vendidos del marketplace este mes?' },
  { icon: 'lucideStore',       label: 'Vendedores activos',desc: 'Estado del ecosistema',   query: '¿Cuántos vendedores activos hay y cuál es su desempeño promedio?' },
];

@Component({
  selector: 'app-analytics-chat',
  standalone: true,
  imports: [FormsModule, NgIcon, AiTypingIndicatorComponent],
  template: `
    <div class="flex flex-col h-full bg-bg-base rounded-2xl border border-border/40 overflow-hidden">

      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-border/40 shrink-0">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <ng-icon name="lucideSparkles" size="13" class="text-violet-400" />
          </div>
          <span class="text-[13px] font-semibold text-text-primary">Analytics IA</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20
                       text-violet-400 font-medium">Admin</span>
        </div>
        @if (messages().length > 0) {
          <button (click)="clearChat()" title="Limpiar conversación"
                  class="w-7 h-7 rounded-lg flex items-center justify-center
                         text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <ng-icon name="lucideTrash2" size="13" />
          </button>
        }
      </div>

      <!-- Messages -->
      <div #messagesContainer class="flex-1 overflow-y-auto min-h-0">

        <!-- EMPTY STATE -->
        @if (messages().length === 0 && !isLoading()) {
          <div class="flex flex-col h-full px-5 py-6">
            <div class="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <div class="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20
                          flex items-center justify-center">
                <ng-icon name="lucideSparkles" size="22" class="text-violet-400" />
              </div>
              <h2 class="text-[18px] font-semibold text-text-primary tracking-tight">
                ¿Qué quieres analizar?
              </h2>
              <p class="text-[12px] text-text-muted max-w-[220px] leading-relaxed">
                Consulta datos del marketplace — ventas, usuarios, inventario y tendencias.
              </p>
            </div>

            <!-- 2×2 action grid -->
            <div class="grid grid-cols-2 gap-2 mt-6">
              @for (q of quickQueries; track q.label) {
                <button (click)="askQuestion(q.query)"
                        class="flex flex-col gap-1.5 p-3 rounded-xl border border-border/60 bg-bg-elevated
                               text-left hover:bg-bg-subtle hover:-translate-y-0.5 hover:border-border
                               transition-all duration-200">
                  <ng-icon [name]="q.icon" size="14" class="text-violet-400" />
                  <p class="text-[11px] font-medium text-text-primary">{{ q.label }}</p>
                  <p class="text-[9px] text-text-muted">{{ q.desc }}</p>
                </button>
              }
            </div>
          </div>
        }

        <!-- MESSAGES -->
        @if (messages().length > 0 || isLoading()) {
          <div class="px-4 py-5 flex flex-col gap-5">

            @for (msg of messages(); track msg.id) {
              @if (msg.role === 'user') {
                <div class="flex justify-end">
                  <div class="px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[80%]
                              bg-bg-elevated border border-border/50
                              text-[13px] text-text-primary">
                    {{ msg.content }}
                  </div>
                </div>
              } @else {
                <div class="flex gap-2.5">
                  <div class="w-6 h-6 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
                    <ng-icon name="lucideSparkles" size="11" class="text-violet-400" />
                  </div>
                  <p class="flex-1 text-[13px] text-text-primary leading-[1.65] whitespace-pre-wrap">
                    {{ msg.content }}
                  </p>
                </div>
              }
            }

            @if (isLoading()) {
              <div class="flex gap-2.5">
                <div class="w-6 h-6 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <ng-icon name="lucideSparkles" size="11" class="text-violet-400" />
                </div>
                <div class="pt-0.5">
                  <app-ai-typing-indicator />
                </div>
              </div>
            }

            @if (error()) {
              <div class="flex items-center gap-2 px-3.5 py-2.5 rounded-xl
                          bg-red-500/8 border border-red-500/20 text-[12px] text-red-400">
                <ng-icon name="lucideCircleAlert" size="12" />{{ error() }}
              </div>
            }

          </div>
        }
      </div>

      <!-- Input -->
      <div class="px-4 py-3 border-t border-border/40 bg-bg-base shrink-0">
        <form (ngSubmit)="sendMessage()">
          <div class="rounded-2xl border border-border/60 bg-bg-elevated focus-within:border-border transition-colors">
            <div class="flex items-center gap-1.5 px-3 py-2.5">
              <ng-icon name="lucideSparkles" size="13" class="text-violet-400 shrink-0" />
              <input type="text" [(ngModel)]="input" name="input"
                     placeholder="Escribe tu consulta del marketplace…"
                     [disabled]="isLoading()"
                     class="flex-1 bg-transparent text-[13px] text-text-primary
                            placeholder:text-text-muted outline-none border-none min-w-0
                            disabled:opacity-50" />
              <button type="submit" [disabled]="isLoading() || !input.trim()"
                      class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                             bg-white/90 hover:bg-white disabled:opacity-25
                             disabled:cursor-not-allowed transition-all">
                <ng-icon name="lucideArrowUp" size="14" class="text-black" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class AnalyticsChatComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;

  private readonly store = inject(Store);

  input = '';
  readonly quickQueries = QUICK_QUERIES;

  readonly messages  = toSignal(this.store.select(selectChatMessages),       { initialValue: [] });
  readonly isLoading = toSignal(this.store.select(selectAnalyticsIsLoading), { initialValue: false });
  readonly error     = toSignal(this.store.select(selectAnalyticsError),     { initialValue: null });

  ngAfterViewChecked(): void {
    const el = this.messagesContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  sendMessage(): void {
    if (!this.input.trim() || this.isLoading()) return;
    this.store.dispatch(AnalyticsAiActions.queryAnalytics({ query: this.input.trim() }));
    this.input = '';
  }

  askQuestion(query: string): void {
    this.input = query;
    this.sendMessage();
  }

  clearChat(): void {
    this.store.dispatch(AnalyticsAiActions.clearChat());
  }
}
