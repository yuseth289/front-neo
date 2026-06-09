import {
  Component, inject, signal,
  ViewChild, ElementRef, AfterViewChecked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { AiTypingIndicatorComponent } from '../../../shared/components/ai-typing-indicator.component';
import { SellerAiService } from '../../../core/services/seller-ai.service';
import { SellerBIResponse, SellerBIKPI } from '../../../shared/models/seller.models';

interface BiMessage {
  role: 'user' | 'ai';
  text: string;
  bi?: SellerBIResponse;
}

interface SavedConv {
  id: string;
  title: string;
  messages: BiMessage[];
  savedAt: number;
}

const CONVS_KEY = 'neo_seller_bi_convs';
const MAX_CONVS = 20;

const QUICK_QUESTIONS = [
  { icon: 'lucideBarChart2',  label: 'Ventas del mes',  desc: 'Ingresos y órdenes',    query: '¿Cuánto he vendido este mes? Muéstrame ingresos y órdenes.' },
  { icon: 'lucideTrophy',     label: 'Top productos',   desc: 'Los más vendidos',       query: '¿Cuáles son mis productos más vendidos?' },
  { icon: 'lucideTrendingUp', label: 'Comparar meses',  desc: 'Este vs. anterior',      query: '¿Cómo me fue este mes comparado con el mes anterior?' },
  { icon: 'lucideStar',       label: 'Calificaciones',  desc: 'Reseñas y puntuación',   query: '¿Cómo está mi calificación y mis reseñas?' },
];

@Component({
  selector: 'app-seller-bi-chat',
  standalone: true,
  imports: [FormsModule, DecimalPipe, NgIcon, AiTypingIndicatorComponent],
  template: `
    <div class="flex bg-bg-base overflow-hidden" style="height: calc(100vh - 72px)">

      <!-- ── LEFT: Conversation sidebar ──────────────────────── -->
      <div class="hidden md:flex shrink-0 w-[240px] flex-col border-r border-border/40 bg-bg-surface">

        <div class="px-4 py-4 border-b border-border/40 shrink-0">
          <button (click)="goBack()"
                  class="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text-primary
                         transition-colors mb-4">
            <ng-icon name="lucideChevronLeft" size="13" />Analytics
          </button>
          <div class="flex items-center gap-2 mb-3">
            <div class="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <ng-icon name="lucideBrainCircuit" size="14" class="text-violet-400" />
            </div>
            <span class="text-[13px] font-semibold text-text-primary">Asistente BI</span>
          </div>
          <button (click)="newConversation()"
                  class="w-full flex items-center gap-2 px-3 py-2 rounded-xl
                         border border-border/60 bg-bg-elevated
                         text-[12px] text-text-secondary hover:text-text-primary hover:border-border
                         transition-colors">
            <ng-icon name="lucidePlus" size="13" />Nueva conversación
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-2 py-2">
          @if (conversations().length === 0 && messages().length === 0) {
            <p class="text-[10px] text-text-muted text-center py-6 px-3 leading-relaxed">
              Tus conversaciones guardadas aparecerán aquí
            </p>
          }

          @if (messages().length > 0 && activeConvId() === null) {
            <div class="flex items-center gap-2 px-2 py-2 rounded-lg bg-bg-elevated mb-1">
              <ng-icon name="lucideMessageCircle" size="10" class="text-violet-400 shrink-0" />
              <span class="flex-1 text-[11px] text-text-primary truncate font-medium">Conversación activa</span>
            </div>
          }

          @if (conversations().length > 0) {
            <p class="text-[9px] text-text-muted uppercase tracking-widest px-2 mb-1 mt-2">Guardadas</p>
            @for (conv of conversations(); track conv.id) {
              <div class="group flex items-center gap-1.5 px-2 py-2 rounded-lg cursor-pointer
                          hover:bg-bg-elevated transition-colors"
                   [class.bg-bg-elevated]="activeConvId() === conv.id"
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

      <!-- ── RIGHT: Chat area ─────────────────────────────────── -->
      <div class="flex-1 flex flex-col min-w-0 min-h-0">

        <div #scrollRef class="flex-1 overflow-y-auto min-h-0">

          <!-- EMPTY STATE -->
          @if (messages().length === 0 && !loading()) {
            <div class="flex flex-col h-full max-w-[640px] mx-auto px-6 py-10">
              <div class="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                <div class="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20
                            flex items-center justify-center">
                  <ng-icon name="lucideBrainCircuit" size="28" class="text-violet-400" />
                </div>
                <h2 class="text-[24px] font-semibold text-text-primary tracking-tight">
                  ¿Qué quieres analizar?
                </h2>
                <p class="text-[13px] text-text-muted max-w-[300px] leading-relaxed">
                  Pregúntame sobre ventas, ingresos, productos y reseñas de tu tienda.
                </p>
              </div>
              <div class="grid grid-cols-2 gap-3 mt-6">
                @for (q of quickQuestions; track q.label) {
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
          @if (messages().length > 0 || loading()) {
            <div class="max-w-[800px] mx-auto px-5 py-6 flex flex-col gap-6">

              @for (msg of messages(); track $index) {
                @if (msg.role === 'user') {
                  <div class="flex justify-end">
                    <div class="px-5 py-3 rounded-2xl rounded-br-sm max-w-[75%]
                                bg-bg-elevated border border-border/50
                                text-[14px] text-text-primary">
                      {{ msg.text }}
                    </div>
                  </div>
                } @else {
                  <div class="flex gap-3">
                    <div class="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
                      <ng-icon name="lucideSparkles" size="12" class="text-violet-400" />
                    </div>
                    <div class="flex-1 flex flex-col gap-4 min-w-0">
                      @if (msg.text) {
                        <p class="text-[14px] text-text-primary leading-[1.7]">{{ msg.text }}</p>
                      }
                      @if (msg.bi) {
                        @if (msg.bi.kpis.length) {
                          <div class="rounded-2xl border border-border/40 bg-bg-elevated overflow-hidden">
                            <div class="px-4 py-2.5 border-b border-border/40 flex items-center gap-2">
                              <ng-icon name="lucideBarChart2" size="11" class="text-text-muted" />
                              <span class="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Métricas</span>
                            </div>
                            <div class="p-4 grid grid-cols-2 lg:grid-cols-3 gap-3">
                              @for (kpi of msg.bi.kpis; track kpi.name) {
                                <div class="rounded-xl border px-4 py-3 flex flex-col gap-1"
                                     [class.border-red-500/30]="kpi.isAlert"
                                     [class.bg-red-500/5]="kpi.isAlert"
                                     [class.border-border/40]="!kpi.isAlert"
                                     [class.bg-bg-base]="!kpi.isAlert">
                                  <p class="text-[9px] text-text-muted uppercase tracking-wider truncate">{{ kpi.name }}</p>
                                  <div class="flex items-baseline gap-1.5 mt-0.5">
                                    <p class="text-[15px] font-bold text-text-primary truncate">{{ formatValue(kpi) }}</p>
                                    <span class="text-[12px] font-medium shrink-0" [class]="trendClass(kpi)">{{ trendArrow(kpi) }}</span>
                                  </div>
                                  <p class="text-[9px] text-text-muted mt-0.5">
                                    {{ kpi.unit !== 'COP' ? kpi.unit + ' · ' : '' }}{{ kpi.period }}
                                    @if (kpi.variationPct !== null && kpi.variationPct !== undefined) {
                                      · <span [class.text-green-400]="kpi.variationPct > 0"
                                              [class.text-red-400]="kpi.variationPct < 0">
                                          {{ kpi.variationPct > 0 ? '+' : '' }}{{ kpi.variationPct | number:'1.1-1' }}%
                                        </span>
                                    }
                                  </p>
                                </div>
                              }
                            </div>
                          </div>
                        }
                        @if (msg.bi.recommendations.length) {
                          <div class="rounded-2xl border border-border/40 bg-bg-elevated overflow-hidden">
                            <div class="px-4 py-2.5 border-b border-border/40 flex items-center gap-2">
                              <ng-icon name="lucideLightbulb" size="11" class="text-yellow-400" />
                              <span class="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Recomendaciones</span>
                            </div>
                            <ul class="px-4 py-3 flex flex-col gap-2">
                              @for (rec of msg.bi.recommendations; track $index) {
                                <li class="flex items-start gap-2 text-[13px] text-text-secondary leading-relaxed">
                                  <ng-icon name="lucideArrowRight" size="11" class="text-violet-400 mt-0.5 shrink-0" />{{ rec }}
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

              @if (loading()) {
                <div class="flex gap-3">
                  <div class="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
                    <ng-icon name="lucideSparkles" size="12" class="text-violet-400" />
                  </div>
                  <div class="pt-0.5"><app-ai-typing-indicator /></div>
                </div>
              }

              @if (error()) {
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
          <div class="max-w-[800px] mx-auto rounded-2xl border border-border/60 bg-bg-elevated
                      focus-within:border-border transition-colors">
            <div class="flex items-center gap-2 px-4 py-3">
              <ng-icon name="lucideSparkles" size="14" class="text-violet-400 shrink-0" />
              <input type="text" [(ngModel)]="userInput" (keydown.enter)="send()"
                     [disabled]="loading()"
                     placeholder="Pregunta sobre ventas, ingresos…"
                     class="flex-1 bg-transparent text-[14px] text-text-primary
                            placeholder:text-text-muted outline-none border-none min-w-0 disabled:opacity-50" />
              <button (click)="send()" [disabled]="loading() || !userInput.trim()"
                      class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                             bg-white/90 hover:bg-white disabled:opacity-25 disabled:cursor-not-allowed transition-all">
                <ng-icon name="lucideArrowUp" size="15" class="text-black" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class SellerBiChatComponent implements AfterViewChecked {
  @ViewChild('scrollRef') private scrollRef!: ElementRef<HTMLDivElement>;

  private readonly sellerAi = inject(SellerAiService);
  private readonly router   = inject(Router);

  messages      = signal<BiMessage[]>([]);
  conversations = signal<SavedConv[]>([]);
  activeConvId  = signal<string | null>(null);
  loading       = signal(false);
  error         = signal<string | null>(null);
  userInput     = '';

  readonly quickQuestions = QUICK_QUESTIONS;

  constructor() { this.loadConvsFromStorage(); }

  ngAfterViewChecked(): void {
    const el = this.scrollRef?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  goBack(): void { this.router.navigate(['/seller/analytics']); }

  askQuestion(query: string): void { this.userInput = query; this.send(); }

  send(): void {
    const q = this.userInput.trim();
    if (!q || this.loading()) return;
    this.userInput = '';
    this.error.set(null);
    this.activeConvId.set(null);
    this.messages.update(ms => [...ms, { role: 'user', text: q }]);
    this.loading.set(true);

    this.sellerAi.biQuery(q).subscribe({
      next: (bi) => {
        this.loading.set(false);
        this.messages.update(ms => [...ms, { role: 'ai', text: bi.narrative, bi }]);
        this.persistCurrentSession();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Error al consultar datos. Intenta de nuevo.');
      },
    });
  }

  newConversation(): void {
    this.persistCurrentSession();
    this.messages.set([]);
    this.activeConvId.set(null);
    this.error.set(null);
  }

  loadConversation(conv: SavedConv): void {
    this.persistCurrentSession();
    this.messages.set([...conv.messages]);
    this.activeConvId.set(conv.id);
    this.error.set(null);
  }

  deleteConversation(id: string): void {
    if (this.activeConvId() === id) {
      this.messages.set([]);
      this.activeConvId.set(null);
    }
    const updated = this.conversations().filter(c => c.id !== id);
    this.conversations.set(updated);
    localStorage.setItem(CONVS_KEY, JSON.stringify(updated));
  }

  formatValue(kpi: SellerBIKPI): string {
    if (kpi.unit === 'COP' && typeof kpi.value === 'number') {
      return `$${(kpi.value as number).toLocaleString('es-CO')}`;
    }
    return String(kpi.value);
  }

  trendArrow(kpi: SellerBIKPI): string {
    return kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '→';
  }

  trendClass(kpi: SellerBIKPI): string {
    if (kpi.trend === 'up')   return kpi.isAlert ? 'text-yellow-400' : 'text-green-400';
    if (kpi.trend === 'down') return 'text-red-400';
    return 'text-text-muted';
  }

  private persistCurrentSession(): void {
    const msgs = this.messages();
    if (msgs.length === 0) return;
    const firstUser = msgs.find(m => m.role === 'user');
    const title = firstUser
      ? firstUser.text.slice(0, 40) + (firstUser.text.length > 40 ? '…' : '')
      : 'Conversación';
    const existingId = this.activeConvId();

    let updated: SavedConv[];
    if (existingId) {
      updated = this.conversations().map(c =>
        c.id === existingId ? { ...c, messages: [...msgs], savedAt: Date.now() } : c
      );
    } else {
      const newConv: SavedConv = { id: crypto.randomUUID(), title, messages: [...msgs], savedAt: Date.now() };
      updated = [newConv, ...this.conversations()].slice(0, MAX_CONVS);
      this.activeConvId.set(newConv.id);
    }
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
