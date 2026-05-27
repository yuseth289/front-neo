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

@Component({
  selector: 'app-analytics-chat',
  standalone: true,
  imports: [FormsModule, NgIcon, AiTypingIndicatorComponent],
  template: `
    <div class="flex flex-col h-full rounded-2xl border border-border bg-bg-surface overflow-hidden">
      <!-- Header -->
      <div class="flex items-center gap-3 px-5 py-4 border-b border-border">
        <div class="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
          <ng-icon name="lucideSparkles" size="16" class="text-violet-400" />
        </div>
        <div>
          <h3 class="text-sm font-semibold text-text-primary">Asistente Analytics IA</h3>
          <p class="text-xs text-text-tertiary">Consulta datos de ventas, usuarios e inventario</p>
        </div>
        <button (click)="clearChat()"
                class="ml-auto text-xs text-text-tertiary hover:text-text-secondary transition-colors">
          Limpiar
        </button>
      </div>

      <!-- Messages -->
      <div #messagesContainer class="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
        @if (messages().length === 0) {
          <div class="flex-1 flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div class="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
              <ng-icon name="lucideSparkles" size="24" class="text-violet-400" />
            </div>
            <div>
              <p class="text-sm font-medium text-text-primary mb-1">Pregunta sobre tus datos</p>
              <p class="text-xs text-text-tertiary max-w-xs">
                "¿Cuáles son los productos más vendidos este mes?" o
                "¿Cuál es la tendencia de usuarios nuevos?"
              </p>
            </div>
          </div>
        }

        @for (msg of messages(); track msg.id) {
          <div class="flex gap-2.5"
               [class.flex-row-reverse]="msg.role === 'user'">
            @if (msg.role === 'ai') {
              <div class="w-7 h-7 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
                <ng-icon name="lucideSparkles" size="13" class="text-violet-400" />
              </div>
            }
            <div class="max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                 [class.bg-violet-600]="msg.role === 'user'"
                 [class.text-white]="msg.role === 'user'"
                 [class.rounded-tr-sm]="msg.role === 'user'"
                 [class.bg-bg-elevated]="msg.role === 'ai'"
                 [class.text-text-primary]="msg.role === 'ai'"
                 [class.rounded-tl-sm]="msg.role === 'ai'">
              {{ msg.content }}
            </div>
          </div>
        }

        @if (isLoading()) {
          <div class="flex gap-2.5">
            <div class="w-7 h-7 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
              <ng-icon name="lucideSparkles" size="13" class="text-violet-400" />
            </div>
            <app-ai-typing-indicator />
          </div>
        }

        @if (error()) {
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs">
            <ng-icon name="lucideCircleAlert" size="14" />
            {{ error() }}
          </div>
        }
      </div>

      <!-- Input -->
      <form (ngSubmit)="sendMessage()" class="p-4 border-t border-border flex gap-2">
        <input
          type="text"
          [(ngModel)]="input"
          name="input"
          placeholder="Escribe tu consulta..."
          class="flex-1 px-4 py-2.5 rounded-xl border border-border bg-bg-elevated
                 text-text-primary text-sm placeholder:text-text-tertiary
                 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          [disabled]="isLoading()"
        />
        <button type="submit"
                [disabled]="isLoading() || !input.trim()"
                class="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50
                       text-white transition-colors">
          <ng-icon name="lucideSend" size="16" />
        </button>
      </form>
    </div>
  `,
})
export class AnalyticsChatComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;

  private readonly store = inject(Store);

  input = '';

  readonly messages = toSignal(this.store.select(selectChatMessages), { initialValue: [] });
  readonly isLoading = toSignal(this.store.select(selectAnalyticsIsLoading), { initialValue: false });
  readonly error = toSignal(this.store.select(selectAnalyticsError), { initialValue: null });

  ngAfterViewChecked(): void {
    const el = this.messagesContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  sendMessage(): void {
    if (!this.input.trim() || this.isLoading()) return;
    this.store.dispatch(AnalyticsAiActions.queryAnalytics({ query: this.input.trim() }));
    this.input = '';
  }

  clearChat(): void {
    this.store.dispatch(AnalyticsAiActions.clearChat());
  }
}
