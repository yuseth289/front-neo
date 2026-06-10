import {
  Component, inject, signal, computed,
  ViewChild, ElementRef, AfterViewChecked,
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
import { KpiCardComponent } from './kpi-card.component';
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
  { icon: 'lucideDollarSign', label: 'GMV del mes',        desc: 'Facturación total',            query: '¿Cuál es el GMV y los ingresos totales de este mes?' },
  { icon: 'lucideUsers',      label: 'Usuarios nuevos',    desc: 'Crecimiento y tendencia',       query: '¿Cuántos usuarios nuevos se registraron este mes y cómo va el crecimiento?' },
  { icon: 'lucideTrendingUp', label: 'Top productos',      desc: 'Más vendidos del marketplace',  query: '¿Cuáles son los productos más vendidos del marketplace este mes?' },
  { icon: 'lucideStore',      label: 'Vendedores activos', desc: 'Estado del ecosistema',         query: '¿Cuántos vendedores activos hay y cuál es su desempeño promedio?' },
];

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [FormsModule, NgIcon, KpiCardComponent, AiTypingIndicatorComponent],
  template: `
    <div class="relative flex bg-bg-base overflow-hidden -m-4 sm:-m-6" style="height: calc(100vh - 64px)">

      <!-- Expand sidebar button (visible when collapsed) -->
      @if (!sidebarOpen()) {
        <button (click)="sidebarOpen.set(true)"
                class="hidden md:flex absolute top-3 left-3 z-20 w-8 h-8 rounded-xl border border-border/60
                       bg-bg-elevated items-center justify-center text-text-muted
                       hover:text-text-primary hover:border-border transition-colors">
          <ng-icon name="lucideMenu" size="15" />
        </button>
      }

      <!-- ── LEFT: Conversation sidebar ──────────────────────────── -->
      @if (sidebarOpen()) {
      <div class="hidden md:flex shrink-0 w-[240px] flex-col border-r border-border/40 bg-bg-surface">

        <div class="px-4 py-4 border-b border-border/40 shrink-0">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20
                          flex items-center justify-center">
                <ng-icon name="lucideSparkles" size="15" class="text-violet-400" />
              </div>
              <div>
                <p class="text-[13px] font-semibold text-text-primary leading-tight">Analytics IA</p>
                <p class="text-[9px] text-text-muted">Panel Admin</p>
              </div>
            </div>
            <button (click)="sidebarOpen.set(false)"
                    class="w-6 h-6 rounded-lg flex items-center justify-center
                           text-text-muted hover:text-text-primary hover:bg-bg-elevated/80 transition-colors"
                    title="Ocultar panel">
              <ng-icon name="lucideX" size="12" />
            </button>
          </div>
          <button (click)="newConversation()"
                  class="w-full flex items-center gap-2 px-3 py-2 rounded-xl
                         border border-border/60 bg-bg-elevated
                         text-[12px] text-text-secondary hover:text-text-primary hover:border-border
                         transition-colors">
            <ng-icon name="lucidePlus" size="13" />Nueva consulta
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-2 py-2">
          @if (conversations().length === 0 && ngRxMessages().length === 0) {
            <p class="text-[10px] text-text-muted text-center py-6 px-3 leading-relaxed">
              Tus consultas guardadas aparecerán aquí
            </p>
          }

          @if (ngRxMessages().length > 0 && !viewingConv()) {
            <div class="flex items-center gap-2 px-2 py-2 rounded-lg bg-bg-elevated mb-1">
              <ng-icon name="lucideMessageCircle" size="10" class="text-violet-400 shrink-0" />
              <span class="flex-1 text-[11px] text-text-primary truncate font-medium">Consulta activa</span>
            </div>
          }

          @if (conversations().length > 0) {
            <p class="text-[9px] text-text-muted uppercase tracking-widest px-2 mb-1 mt-2">Guardadas</p>
            @for (conv of conversations(); track conv.id) {
              <div class="group flex items-center gap-1.5 px-2 py-2 rounded-lg cursor-pointer
                          hover:bg-bg-elevated transition-colors"
                   [class.bg-bg-elevated]="viewingConv()?.id === conv.id"
                   (click)="loadConversation(conv)">
                <ng-icon name="lucideSearch" size="10" class="text-text-muted shrink-0" />
                <span class="flex-1 text-[11px] text-text-secondary truncate leading-snug">
                  {{ conv.title }}
                </span>
                <button (click)="$event.stopPropagation(); deleteConversation(conv.id)"
                        class="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center
                               text-text-muted hover:text-red-400 transition-all shrink-0">
                  <ng-icon name="lucideX" size="10" />
                </button>
              </div>
            }
          }
        </div>
      </div>
      }

      <!-- ── RIGHT: Chat area ───────────────────────────────────── -->
      <div class="flex-1 flex flex-col min-w-0 min-h-0">

        <!-- Viewing-past badge -->
        @if (viewingConv()) {
          <div class="px-5 py-2.5 bg-yellow-500/8 border-b border-yellow-500/20
                      flex items-center gap-2 shrink-0">
            <ng-icon name="lucideEye" size="11" class="text-yellow-400" />
            <p class="text-[11px] text-yellow-400">Modo lectura — consulta guardada</p>
            <button (click)="resumeLive()"
                    class="ml-auto text-[11px] text-violet-400 hover:underline">
              Volver a activa
            </button>
          </div>
        }

        <!-- Messages -->
        <div #messagesContainer class="flex-1 overflow-y-auto min-h-0">

          <!-- EMPTY STATE -->
          @if (displayMessages().length === 0 && !isLoading()) {
            <div class="flex flex-col h-full max-w-[660px] mx-auto px-6 py-10">
              <div class="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                <div class="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20
                            flex items-center justify-center">
                  <ng-icon name="lucideSparkles" size="28" class="text-violet-400" />
                </div>
                <h2 class="text-[24px] font-semibold text-text-primary tracking-tight">
                  ¿Qué quieres analizar?
                </h2>
                <p class="text-[13px] text-text-muted max-w-[340px] leading-relaxed">
                  Consulta datos del marketplace — ventas, usuarios, inventario y tendencias en tiempo real.
                </p>
              </div>
              <div class="grid grid-cols-2 gap-3 mt-6">
                @for (q of quickQueries; track q.label) {
                  <button (click)="askQuestion(q.query)"
                          class="flex flex-col gap-2 p-4 rounded-2xl border border-border/60 bg-bg-elevated
                                 text-left hover:bg-bg-subtle hover:-translate-y-0.5 hover:border-border
                                 transition-all duration-200">
                    <ng-icon [name]="q.icon" size="16" class="text-violet-400" />
                    <p class="text-[12px] font-medium text-text-primary">{{ q.label }}</p>
                    <p class="text-[11px] text-text-muted">{{ q.desc }}</p>
                  </button>
                }
              </div>
            </div>
          }

          <!-- MESSAGES -->
          @if (displayMessages().length > 0 || isLoading()) {
            <div class="max-w-[860px] mx-auto px-6 py-6 flex flex-col gap-6">

              @for (msg of displayMessages(); track msg.id) {
                @if (msg.role === 'user') {
                  <div class="flex justify-end">
                    <div class="px-5 py-3 rounded-2xl rounded-br-sm max-w-[75%]
                                bg-bg-elevated border border-border/50
                                text-[14px] text-text-primary">
                      {{ msg.content }}
                    </div>
                  </div>
                } @else {
                  <div class="flex gap-3">
                    <div class="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
                      <ng-icon name="lucideSparkles" size="12" class="text-violet-400" />
                    </div>
                    <div class="flex-1 flex flex-col gap-4 min-w-0">
                      @if (msg.content) {
                        <p class="text-[14px] text-text-primary leading-[1.7] whitespace-pre-wrap">
                          {{ msg.content }}
                        </p>
                      }
                      @if (msg.result) {
                        <!-- Alerts inline -->
                        @if (msg.result.summary.alerts.length > 0) {
                          <div class="flex flex-col gap-2">
                            @for (alert of msg.result.summary.alerts; track $index) {
                              <div class="flex items-center gap-2 px-4 py-2.5 rounded-xl
                                          bg-red-500/8 border border-red-500/20 text-[12px] text-red-400">
                                <ng-icon name="lucideTriangleAlert" size="12" />{{ alert }}
                              </div>
                            }
                          </div>
                        }
                        <!-- KPIs inline -->
                        @if (msg.result.summary.kpis.length > 0) {
                          <div class="rounded-2xl border border-border/40 bg-bg-elevated overflow-hidden">
                            <div class="px-4 py-2.5 border-b border-border/40 flex items-center gap-2">
                              <ng-icon name="lucideBarChart2" size="11" class="text-text-muted" />
                              <span class="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                                Indicadores clave
                              </span>
                              @if (msg.result.summary.period) {
                                <span class="text-[10px] text-text-muted ml-1">
                                  — {{ msg.result.summary.period }}
                                </span>
                              }
                            </div>
                            <div class="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                              @for (kpi of msg.result.summary.kpis; track kpi.name) {
                                <app-kpi-card [kpi]="kpi" />
                              }
                            </div>
                          </div>
                        }
                        <!-- Recommendations inline -->
                        @if (msg.result.summary.recommendations.length > 0) {
                          <div class="rounded-2xl border border-border/40 bg-bg-elevated overflow-hidden">
                            <div class="px-4 py-2.5 border-b border-border/40 flex items-center gap-2">
                              <ng-icon name="lucideLightbulb" size="11" class="text-yellow-400" />
                              <span class="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                                Recomendaciones
                              </span>
                            </div>
                            <ul class="px-4 py-3 flex flex-col gap-2">
                              @for (rec of msg.result.summary.recommendations; track $index) {
                                <li class="flex items-start gap-2 text-[13px] text-text-secondary leading-relaxed">
                                  <ng-icon name="lucideArrowRight" size="11" class="text-violet-400 mt-0.5 shrink-0" />
                                  {{ rec }}
                                </li>
                              }
                            </ul>
                          </div>
                        }
                      }
                    </div>
                  </div>
                }
              }

              @if (isLoading()) {
                <div class="flex gap-3">
                  <div class="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
                    <ng-icon name="lucideSparkles" size="12" class="text-violet-400" />
                  </div>
                  <div class="pt-0.5"><app-ai-typing-indicator /></div>
                </div>
              }

              @if (error() && !isLoading()) {
                <div class="flex items-center gap-2 px-4 py-3 rounded-xl
                            bg-red-500/8 border border-red-500/20 text-[13px] text-red-400">
                  <ng-icon name="lucideCircleAlert" size="13" />{{ error() }}
                </div>
              }
            </div>
          }
        </div>

        <!-- Input -->
        <div class="px-5 py-4 border-t border-border/40 bg-bg-base shrink-0">
          @if (viewingConv()) {
            <div class="max-w-[860px] mx-auto rounded-2xl border border-border/40
                        bg-bg-elevated/50 px-4 py-3.5 text-center">
              <p class="text-[12px] text-text-muted">
                Consulta guardada —
                <button (click)="resumeLive()" class="text-violet-400 hover:underline">
                  volver a la activa
                </button>
                para continuar
              </p>
            </div>
          } @else {
            <form (ngSubmit)="sendMessage()" class="max-w-[860px] mx-auto">
              <div class="rounded-2xl border border-border/60 bg-bg-elevated
                          focus-within:border-border transition-colors">
                <div class="flex items-center gap-2 px-4 py-3">
                  <ng-icon name="lucideSparkles" size="14" class="text-violet-400 shrink-0" />
                  <input type="text" [(ngModel)]="input" name="input"
                         placeholder="Escribe tu consulta del marketplace…"
                         [disabled]="isLoading()"
                         class="flex-1 bg-transparent text-[14px] text-text-primary
                                placeholder:text-text-muted outline-none border-none min-w-0
                                disabled:opacity-50" />
                  <button type="submit" [disabled]="isLoading() || !input.trim()"
                          class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                                 bg-white/90 hover:bg-white disabled:opacity-25
                                 disabled:cursor-not-allowed transition-all">
                    <ng-icon name="lucideArrowUp" size="15" class="text-black" />
                  </button>
                </div>
              </div>
            </form>
          }
        </div>

      </div>
    </div>
  `,
})
export class AnalyticsDashboardComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;

  private readonly store = inject(Store);

  sidebarOpen   = signal(true);
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
    const title = firstUser
      ? firstUser.content.slice(0, 40) + (firstUser.content.length > 40 ? '…' : '')
      : 'Consulta';
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
