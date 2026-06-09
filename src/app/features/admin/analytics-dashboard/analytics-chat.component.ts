import {
  Component, Input, Output, EventEmitter, inject, signal, computed,
  ElementRef, ViewChild, AfterViewChecked,
} from '@angular/core';
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
import { ChatMessage } from '../../../shared/models/analytics.models';

interface SavedConv {
  id: string;
  title: string;
  messages: ChatMessage[];
  savedAt: number;
}

const CONVS_KEY = 'neo_admin_analytics_convs';
const MAX_CONVS = 20;

const QUICK_QUERIES = [
  { icon: 'lucideDollarSign', label: 'GMV del mes',        desc: 'Facturación total',          query: '¿Cuál es el GMV y los ingresos totales de este mes?' },
  { icon: 'lucideUsers',      label: 'Usuarios nuevos',    desc: 'Crecimiento y tendencia',     query: '¿Cuántos usuarios nuevos se registraron este mes y cómo va el crecimiento?' },
  { icon: 'lucideTrendingUp', label: 'Top productos',      desc: 'Más vendidos del marketplace',query: '¿Cuáles son los productos más vendidos del marketplace este mes?' },
  { icon: 'lucideStore',      label: 'Vendedores activos', desc: 'Estado del ecosistema',       query: '¿Cuántos vendedores activos hay y cuál es su desempeño promedio?' },
];

@Component({
  selector: 'app-analytics-chat',
  standalone: true,
  imports: [FormsModule, NgIcon, AiTypingIndicatorComponent],
  template: `
    @if (isOpen) {
      <!-- Overlay -->
      <div class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" (click)="close.emit()"></div>

      <!-- Panel -->
      <div class="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[560px]
                  flex animate-slide-in-right border-l border-border/40 shadow-2xl">

        <!-- ── LEFT: Conversation sidebar ──────────────────────── -->
        <div class="shrink-0 w-[168px] flex flex-col bg-bg-surface border-r border-border/40">

          <div class="px-2.5 py-3 border-b border-border/40 shrink-0">
            <button (click)="newConversation()"
                    class="w-full flex items-center gap-1.5 px-3 py-2 rounded-xl
                           border border-border/60 bg-bg-elevated
                           text-[11px] text-text-secondary hover:text-text-primary hover:border-border
                           transition-colors">
              <ng-icon name="lucidePlus" size="12" />Nueva
            </button>
          </div>

          <div class="flex-1 overflow-y-auto px-1.5 py-2">
            @if (conversations().length === 0 && ngRxMessages().length === 0) {
              <p class="text-[10px] text-text-muted text-center py-5 px-2 leading-relaxed">
                Las conversaciones guardadas aparecerán aquí
              </p>
            }

            <!-- Active session indicator -->
            @if (ngRxMessages().length > 0 && !viewingConv()) {
              <div class="flex items-center gap-1.5 px-2 py-2 rounded-lg bg-bg-elevated mb-1">
                <ng-icon name="lucideMessageCircle" size="10" class="text-violet-400 shrink-0" />
                <span class="flex-1 text-[10px] text-text-primary truncate font-medium">Conversación activa</span>
              </div>
            }

            <!-- Saved conversations -->
            @if (conversations().length > 0) {
              <p class="text-[9px] text-text-muted uppercase tracking-widest px-2 mb-1 mt-1">Guardadas</p>
              @for (conv of conversations(); track conv.id) {
                <div class="group flex items-center gap-1 px-2 py-2 rounded-lg cursor-pointer
                            hover:bg-bg-elevated transition-colors"
                     [class.bg-bg-elevated]="viewingConv()?.id === conv.id"
                     (click)="loadConversation(conv)">
                  <ng-icon name="lucideSearch" size="10" class="text-text-muted shrink-0" />
                  <span class="flex-1 text-[10px] text-text-secondary truncate leading-snug">
                    {{ conv.title }}
                  </span>
                  <button (click)="$event.stopPropagation(); deleteConversation(conv.id)"
                          class="opacity-0 group-hover:opacity-100 w-4 h-4 rounded flex items-center justify-center
                                 text-text-muted hover:text-red-400 transition-all shrink-0">
                    <ng-icon name="lucideX" size="9" />
                  </button>
                </div>
              }
            }
          </div>
        </div>

        <!-- ── RIGHT: Chat area ─────────────────────────────────── -->
        <div class="flex-1 flex flex-col bg-bg-base min-w-0">

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
            <div class="flex items-center gap-0.5">
              @if (viewingConv()) {
                <button (click)="resumeLive()"
                        class="text-[10px] px-2.5 py-1 rounded-lg border border-border/50
                               text-text-muted hover:text-violet-400 hover:border-violet-500/40
                               transition-colors mr-1">
                  Volver a activa
                </button>
              }
              <button (click)="close.emit()"
                      class="w-7 h-7 rounded-lg flex items-center justify-center
                             text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors">
                <ng-icon name="lucideX" size="14" />
              </button>
            </div>
          </div>

          <!-- Viewing-past badge -->
          @if (viewingConv()) {
            <div class="px-4 py-2 bg-yellow-500/8 border-b border-yellow-500/20 flex items-center gap-2">
              <ng-icon name="lucideEye" size="11" class="text-yellow-400" />
              <p class="text-[11px] text-yellow-400">Modo lectura — conversación guardada</p>
            </div>
          }

          <!-- Messages -->
          <div #messagesContainer class="flex-1 overflow-y-auto min-h-0">

            <!-- EMPTY STATE -->
            @if (displayMessages().length === 0 && !isLoading()) {
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
            @if (displayMessages().length > 0 || isLoading()) {
              <div class="px-4 py-5 flex flex-col gap-5">

                @for (msg of displayMessages(); track msg.id) {
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
                    <div class="pt-0.5"><app-ai-typing-indicator /></div>
                  </div>
                }

                @if (error() && !isLoading()) {
                  <div class="flex items-center gap-2 px-3.5 py-2.5 rounded-xl
                              bg-red-500/8 border border-red-500/20 text-[12px] text-red-400">
                    <ng-icon name="lucideCircleAlert" size="12" />{{ error() }}
                  </div>
                }
              </div>
            }
          </div>

          <!-- Input — disabled when viewing past conversation -->
          <div class="px-4 py-3 border-t border-border/40 bg-bg-base shrink-0">
            @if (viewingConv()) {
              <div class="rounded-2xl border border-border/40 bg-bg-elevated/50 px-3 py-3 text-center">
                <p class="text-[11px] text-text-muted">
                  Conversación guardada —
                  <button (click)="resumeLive()" class="text-violet-400 hover:underline">
                    volver a la activa
                  </button>
                  para continuar
                </p>
              </div>
            } @else {
              <form (ngSubmit)="sendMessage()">
                <div class="rounded-2xl border border-border/60 bg-bg-elevated focus-within:border-border transition-colors">
                  <div class="flex items-center gap-1.5 px-3 py-2.5">
                    <ng-icon name="lucideSparkles" size="13" class="text-violet-400 shrink-0" />
                    <input type="text" [(ngModel)]="input" name="input"
                           placeholder="Escribe tu consulta del marketplace…"
                           [disabled]="isLoading()"
                           class="flex-1 bg-transparent text-[13px] text-text-primary
                                  placeholder:text-text-muted outline-none border-none min-w-0 disabled:opacity-50" />
                    <button type="submit" [disabled]="isLoading() || !input.trim()"
                            class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                                   bg-white/90 hover:bg-white disabled:opacity-25 disabled:cursor-not-allowed transition-all">
                      <ng-icon name="lucideArrowUp" size="14" class="text-black" />
                    </button>
                  </div>
                </div>
              </form>
            }
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes slide-in-right {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }
    .animate-slide-in-right { animation: slide-in-right 0.22s cubic-bezier(0.16,1,0.3,1); }
  `],
})
export class AnalyticsChatComponent implements AfterViewChecked {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;

  private readonly store = inject(Store);

  input         = '';
  viewingConv   = signal<SavedConv | null>(null);
  conversations = signal<SavedConv[]>([]);
  readonly quickQueries = QUICK_QUERIES;

  readonly ngRxMessages = toSignal(this.store.select(selectChatMessages),       { initialValue: [] });
  readonly isLoading    = toSignal(this.store.select(selectAnalyticsIsLoading), { initialValue: false });
  readonly error        = toSignal(this.store.select(selectAnalyticsError),     { initialValue: null });

  readonly displayMessages = computed<ChatMessage[]>(() => {
    const viewing = this.viewingConv();
    return viewing ? viewing.messages : this.ngRxMessages();
  });

  constructor() { this.loadConvsFromStorage(); }

  ngAfterViewChecked(): void {
    const el = this.messagesContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  sendMessage(): void {
    if (!this.input.trim() || this.isLoading()) return;
    this.store.dispatch(AnalyticsAiActions.queryAnalytics({ query: this.input.trim() }));
    this.input = '';
    this.viewingConv.set(null);
  }

  askQuestion(query: string): void { this.input = query; this.sendMessage(); }

  newConversation(): void {
    this.saveCurrentIfNonEmpty();
    this.store.dispatch(AnalyticsAiActions.clearChat());
    this.viewingConv.set(null);
  }

  loadConversation(conv: SavedConv): void {
    this.saveCurrentIfNonEmpty();
    this.viewingConv.set(conv);
  }

  resumeLive(): void { this.viewingConv.set(null); }

  deleteConversation(id: string): void {
    if (this.viewingConv()?.id === id) this.viewingConv.set(null);
    const updated = this.conversations().filter(c => c.id !== id);
    this.conversations.set(updated);
    try { localStorage.setItem(CONVS_KEY, JSON.stringify(updated)); } catch { /* quota */ }
  }

  private saveCurrentIfNonEmpty(): void {
    const msgs = this.ngRxMessages();
    if (msgs.length === 0) return;
    const firstUser = msgs.find(m => m.role === 'user');
    const title = firstUser ? firstUser.content.slice(0, 35) + (firstUser.content.length > 35 ? '…' : '') : 'Consulta';
    const newConv: SavedConv = { id: crypto.randomUUID(), title, messages: [...msgs], savedAt: Date.now() };
    const updated = [newConv, ...this.conversations()].slice(0, MAX_CONVS);
    this.conversations.set(updated);
    try { localStorage.setItem(CONVS_KEY, JSON.stringify(updated)); } catch { /* quota */ }
  }

  private loadConvsFromStorage(): void {
    try {
      const raw = localStorage.getItem(CONVS_KEY);
      if (raw) this.conversations.set(JSON.parse(raw) as SavedConv[]);
    } catch { /* ignore */ }
  }
}
