import {
  Component, Input, Output, EventEmitter, inject, signal, computed,
  ElementRef, ViewChild, AfterViewChecked, NgZone,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { AiTypingIndicatorComponent } from './ai-typing-indicator.component';
import { SellerAiService } from '../../core/services/seller-ai.service';
import { SellerBIKPI } from '../../shared/models/seller.models';

interface BiMessage {
  role: 'user' | 'ai';
  text: string;
  kpis?: SellerBIKPI[];
}

interface SavedConv {
  id: string;
  title: string;
  messages: BiMessage[];
  savedAt: number;
}

const CONVS_KEY = 'neo_seller_panel_convs';
const MAX_CONVS = 20;

const QUICK_QUESTIONS = [
  { icon: 'lucideBarChart2',  label: 'Ventas del mes', desc: 'Ingresos y órdenes',   query: '¿Cuánto he vendido este mes? Muéstrame ingresos y órdenes.' },
  { icon: 'lucideTrophy',     label: 'Top productos',  desc: 'Los más vendidos',      query: '¿Cuáles son mis productos más vendidos?' },
  { icon: 'lucideTrendingUp', label: 'Comparar meses', desc: 'Este vs. anterior',     query: '¿Cómo me fue este mes comparado con el mes anterior?' },
  { icon: 'lucideStar',       label: 'Calificaciones', desc: 'Reseñas y puntuación',  query: '¿Cómo está mi calificación y mis reseñas?' },
];

@Component({
  selector: 'app-seller-ai-panel',
  standalone: true,
  imports: [FormsModule, NgIcon, AiTypingIndicatorComponent],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" (click)="close.emit()"></div>

      <div class="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[520px]
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
              <p class="text-[10px] text-text-muted mt-0.5">Seller Analytics</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <button (click)="newConversation()"
                    class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px]
                           text-text-secondary hover:text-text-primary hover:bg-bg-elevated
                           border border-border/60 transition-colors">
              <ng-icon name="lucidePlus" size="11" />Nueva
            </button>
            <button (click)="close.emit()"
                    class="w-8 h-8 rounded-lg flex items-center justify-center
                           text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors">
              <ng-icon name="lucideX" size="16" />
            </button>
          </div>
        </div>

        <!-- Saved convs strip -->
        @if (conversations().length > 0) {
          <div class="flex gap-1.5 px-3 py-2 border-b border-border/30 overflow-x-auto shrink-0 scrollbar-none">
            @if (viewingConv()) {
              <button (click)="resumeLive()"
                      class="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium shrink-0
                             text-accent border transition-colors"
                      style="border-color:rgba(155,48,255,0.4);background:rgba(155,48,255,0.08)">
                <ng-icon name="lucideActivity" size="10" />En vivo
              </button>
            }
            @for (conv of conversations(); track conv.id) {
              <button (click)="loadConversation(conv)"
                      class="group flex items-center gap-1 px-2 py-1 rounded-md text-[10px] shrink-0
                             transition-colors border"
                      [class.bg-bg-elevated]="viewingConv()?.id === conv.id"
                      style="border-color:var(--color-border);color:var(--color-text-secondary)">
                <span class="max-w-[100px] truncate">{{ conv.title }}</span>
                <span (click)="$event.stopPropagation(); deleteConversation(conv.id)"
                      class="opacity-0 group-hover:opacity-100 ml-0.5 text-text-muted hover:text-red-400 transition-all">
                  <ng-icon name="lucideX" size="9" />
                </span>
              </button>
            }
          </div>
        }

        <!-- Messages -->
        <div #messagesContainer class="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">

          @if (displayMessages().length === 0 && !isLoading()) {
            <div class="flex flex-col gap-3 pt-2">
              <p class="text-[11px] text-text-muted">Preguntas rápidas:</p>
              <div class="grid grid-cols-2 gap-2">
                @for (q of quickQuestions; track q.label) {
                  <button (click)="askQuestion(q.query)"
                          class="flex flex-col gap-1 p-3 rounded-xl border border-border/60 bg-bg-elevated
                                 text-left hover:bg-bg-subtle hover:-translate-y-0.5 hover:border-border
                                 transition-all duration-150">
                    <ng-icon [name]="q.icon" size="13" class="text-violet-400" />
                    <p class="text-[11px] font-medium text-text-primary">{{ q.label }}</p>
                    <p class="text-[10px] text-text-muted">{{ q.desc }}</p>
                  </button>
                }
              </div>
            </div>
          }

          @for (msg of displayMessages(); track $index) {
            @if (msg.role === 'user') {
              <div class="flex justify-end">
                <div class="max-w-[80%] px-3 py-2 rounded-2xl rounded-br-sm text-[13px] text-text-primary"
                     style="background:var(--color-bg-elevated);border:1px solid var(--color-border)">
                  {{ msg.text }}
                </div>
              </div>
            } @else {
              <div class="flex gap-2.5">
                <div class="w-6 h-6 rounded-full shrink-0 mt-0.5 flex items-center justify-center"
                     style="background:rgba(155,48,255,0.15)">
                  <ng-icon name="lucideSparkles" size="11" style="color:#9B30FF" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[13px] text-text-primary leading-[1.65] whitespace-pre-wrap">{{ msg.text }}</p>
                  @if (msg.kpis && msg.kpis.length > 0) {
                    <div class="grid grid-cols-2 gap-2 mt-3">
                      @for (kpi of msg.kpis; track kpi.name) {
                        <div class="p-2.5 rounded-xl border border-border/50"
                             style="background:var(--color-bg-elevated)">
                          <p class="text-[10px] text-text-muted">{{ kpi.name }}</p>
                          <p class="text-[15px] font-bold text-text-primary mt-0.5 font-mono">
                            {{ kpi.value }}{{ kpi.unit ? ' ' + kpi.unit : '' }}
                          </p>
                          @if (kpi.variationPct !== null) {
                            <p class="text-[10px] mt-0.5"
                               [style.color]="kpi.trend === 'up' ? 'var(--color-success)' : kpi.trend === 'down' ? 'var(--color-error)' : 'var(--color-text-muted)'">
                              {{ kpi.trend === 'up' ? '+' : kpi.trend === 'down' ? '' : '' }}{{ kpi.variationPct }}%
                            </p>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          }

          @if (isLoading()) {
            <div class="flex gap-2.5">
              <div class="w-6 h-6 rounded-full shrink-0 flex items-center justify-center"
                   style="background:rgba(155,48,255,0.15)">
                <ng-icon name="lucideSparkles" size="11" style="color:#9B30FF" />
              </div>
              <div class="flex flex-col gap-1 pt-0.5">
                <app-ai-typing-indicator />
                <p class="text-[11px] text-text-muted animate-pulse">Analizando tus métricas…</p>
              </div>
            </div>
          }

          @if (error()) {
            <div class="flex gap-2 px-3 py-2 rounded-xl text-[13px]"
                 style="background:rgba(239,68,68,0.08);color:var(--color-error);border:1px solid rgba(239,68,68,0.2)">
              <ng-icon name="lucideCircleAlert" size="14" class="shrink-0 mt-0.5" />
              {{ error() }}
            </div>
          }
        </div>

        <!-- Input -->
        <div class="px-4 py-3 border-t border-border/40 shrink-0">
          <form (ngSubmit)="sendMessage()">
            <div class="flex items-center gap-2 rounded-xl border border-border/60 bg-bg-elevated
                        focus-within:border-border/80 transition-colors px-3 py-2">
              <input type="text" [(ngModel)]="input" name="input"
                     placeholder="Pregunta sobre tus ventas…"
                     [disabled]="isLoading()"
                     class="flex-1 bg-transparent text-[13px] text-text-primary
                            placeholder:text-text-muted outline-none border-none min-w-0
                            disabled:opacity-50" />
              <button type="submit" [disabled]="isLoading() || !input.trim()"
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
  `,
  styles: [`
    @keyframes slide-in-right {
      from { transform: translateX(100%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
    .animate-slide-in-right { animation: slide-in-right 0.22s cubic-bezier(0.16,1,0.3,1); }
    .scrollbar-none { scrollbar-width: none; }
    .scrollbar-none::-webkit-scrollbar { display: none; }
  `],
})
export class SellerAiPanelComponent implements AfterViewChecked {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;

  private readonly aiService = inject(SellerAiService);
  private readonly zone = inject(NgZone);

  input         = '';
  isLoading     = signal(false);
  error         = signal<string | null>(null);
  messages      = signal<BiMessage[]>([]);
  viewingConv   = signal<SavedConv | null>(null);
  conversations = signal<SavedConv[]>([]);
  readonly quickQuestions = QUICK_QUESTIONS;

  readonly displayMessages = computed<BiMessage[]>(() =>
    this.viewingConv() ? this.viewingConv()!.messages : this.messages(),
  );

  constructor() { this.loadConvsFromStorage(); }

  ngAfterViewChecked(): void {
    const el = this.messagesContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  sendMessage(): void {
    if (!this.input.trim() || this.isLoading()) return;
    const query = this.input.trim();
    this.input = '';
    this.viewingConv.set(null);
    this.error.set(null);
    this.messages.update(msgs => [...msgs, { role: 'user', text: query }]);
    this.isLoading.set(true);

    this.aiService.biQuery(query).subscribe({
      next: (res) => this.zone.run(() => {
        this.isLoading.set(false);
        this.messages.update(msgs => [...msgs, {
          role: 'ai',
          text: res.narrative,
          kpis: res.kpis,
        }]);
      }),
      error: (err) => this.zone.run(() => {
        this.isLoading.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo obtener respuesta. Intenta de nuevo.');
      }),
    });
  }

  askQuestion(query: string): void {
    this.input = query;
    this.sendMessage();
  }

  newConversation(): void {
    this.saveCurrentIfNonEmpty();
    this.messages.set([]);
    this.error.set(null);
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
    const msgs = this.messages();
    if (msgs.length === 0) return;
    const firstUser = msgs.find(m => m.role === 'user');
    const title = firstUser ? firstUser.text.slice(0, 35) + (firstUser.text.length > 35 ? '…' : '') : 'Consulta';
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
