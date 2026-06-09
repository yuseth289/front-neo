import {
  Component, inject, signal, ViewChild, ElementRef, AfterViewChecked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { AiTypingIndicatorComponent } from '../../../shared/components/ai-typing-indicator.component';
import { SellerAiService } from '../../../core/services/seller-ai.service';
import { SellerBIResponse, SellerBIKPI } from '../../../shared/models/seller.models';

interface BiMessage {
  role: 'user' | 'ai';
  text: string;
  bi?: SellerBIResponse;
}

const STORAGE_KEY = 'neo_seller_bi_chat';

const QUICK_QUESTIONS = [
  { icon: 'lucideBarChart2',    label: 'Ventas del mes',    desc: 'Ingresos y órdenes',      query: '¿Cuánto he vendido este mes? Muéstrame ingresos y órdenes.' },
  { icon: 'lucideTrophy',       label: 'Top productos',     desc: 'Los más vendidos',        query: '¿Cuáles son mis productos más vendidos?' },
  { icon: 'lucideTrendingUp',   label: 'Comparar meses',    desc: 'Este vs. anterior',       query: '¿Cómo me fue este mes comparado con el mes anterior?' },
  { icon: 'lucideStar',         label: 'Calificaciones',    desc: 'Reseñas y puntuación',    query: '¿Cómo está mi calificación y mis reseñas?' },
];

@Component({
  selector: 'app-seller-bi-chat',
  standalone: true,
  imports: [FormsModule, DecimalPipe, NgIcon, AiTypingIndicatorComponent],
  template: `
    <div class="flex flex-col bg-bg-base rounded-2xl border border-border/40 overflow-hidden"
         style="min-height:520px;max-height:700px;">

      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-border/40 shrink-0">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <ng-icon name="lucideSparkles" size="13" class="text-violet-400" />
          </div>
          <span class="text-[13px] font-semibold text-text-primary">Asistente BI</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20
                       text-violet-400 font-medium">IA</span>
        </div>
        @if (messages().length > 0) {
          <button (click)="clearHistory()" title="Limpiar conversación"
                  class="w-7 h-7 rounded-lg flex items-center justify-center
                         text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <ng-icon name="lucideTrash2" size="13" />
          </button>
        }
      </div>

      <!-- Messages -->
      <div #scrollRef class="flex-1 overflow-y-auto min-h-0">

        <!-- EMPTY STATE -->
        @if (messages().length === 0 && !loading()) {
          <div class="flex flex-col h-full px-5 py-6">
            <div class="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <div class="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20
                          flex items-center justify-center">
                <ng-icon name="lucideBrainCircuit" size="22" class="text-violet-400" />
              </div>
              <h2 class="text-[18px] font-semibold text-text-primary tracking-tight">
                ¿Qué quieres analizar?
              </h2>
              <p class="text-[12px] text-text-muted max-w-[200px] leading-relaxed">
                Pregúntame sobre ventas, ingresos, productos y reseñas de tu tienda.
              </p>
            </div>

            <!-- 2×2 action grid -->
            <div class="grid grid-cols-2 gap-2 mt-6">
              @for (q of quickQuestions; track q.label) {
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
        @if (messages().length > 0 || loading()) {
          <div class="px-4 py-5 flex flex-col gap-5">

            @for (msg of messages(); track $index) {

              @if (msg.role === 'user') {
                <div class="flex justify-end">
                  <div class="px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[80%]
                              bg-bg-elevated border border-border/50
                              text-[13px] text-text-primary">
                    {{ msg.text }}
                  </div>
                </div>

              } @else {
                <div class="flex gap-2.5">
                  <div class="w-6 h-6 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
                    <ng-icon name="lucideSparkles" size="11" class="text-violet-400" />
                  </div>
                  <div class="flex-1 flex flex-col gap-3 min-w-0">

                    <!-- Narrative — plain text, no bubble -->
                    @if (msg.text) {
                      <p class="text-[13px] text-text-primary leading-[1.65]">{{ msg.text }}</p>
                    }

                    @if (msg.bi) {
                      <!-- KPI tool-output card -->
                      @if (msg.bi.kpis.length) {
                        <div class="rounded-xl border border-border/50 bg-bg-elevated overflow-hidden">
                          <div class="px-3.5 py-2 border-b border-border/40 flex items-center gap-2">
                            <ng-icon name="lucideBarChart2" size="10" class="text-text-muted" />
                            <span class="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Métricas</span>
                          </div>
                          <div class="p-3 grid grid-cols-2 gap-2">
                            @for (kpi of msg.bi.kpis; track kpi.name) {
                              <div class="rounded-lg border px-3 py-2.5 flex flex-col gap-0.5"
                                   [class.border-red-500/30]="kpi.isAlert"
                                   [class.bg-red-500/5]="kpi.isAlert"
                                   [class.border-border/40]="!kpi.isAlert"
                                   [class.bg-bg-base]="!kpi.isAlert">
                                <p class="text-[9px] text-text-muted uppercase tracking-wider truncate">{{ kpi.name }}</p>
                                <div class="flex items-baseline gap-1 mt-0.5">
                                  <p class="text-[13px] font-bold text-text-primary truncate">{{ formatValue(kpi) }}</p>
                                  <span class="text-[11px] font-medium shrink-0" [class]="trendClass(kpi)">{{ trendArrow(kpi) }}</span>
                                </div>
                                <p class="text-[9px] text-text-muted mt-0.5">
                                  {{ kpi.unit !== 'COP' ? kpi.unit + ' · ' : '' }}{{ kpi.period }}
                                  @if (kpi.variationPct !== null && kpi.variationPct !== undefined) {
                                    ·&nbsp;<span [class.text-green-400]="kpi.variationPct > 0"
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

                      <!-- Recommendations tool-output card -->
                      @if (msg.bi.recommendations.length) {
                        <div class="rounded-xl border border-border/50 bg-bg-elevated overflow-hidden">
                          <div class="px-3.5 py-2 border-b border-border/40 flex items-center gap-2">
                            <ng-icon name="lucideLightbulb" size="10" class="text-yellow-400" />
                            <span class="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Recomendaciones</span>
                          </div>
                          <ul class="px-3.5 py-3 flex flex-col gap-1.5">
                            @for (rec of msg.bi.recommendations; track $index) {
                              <li class="text-[12px] text-text-secondary flex gap-2 items-start leading-relaxed">
                                <ng-icon name="lucideArrowRight" size="10" class="text-violet-400 mt-0.5 shrink-0" />
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

            <!-- Loading -->
            @if (loading()) {
              <div class="flex gap-2.5">
                <div class="w-6 h-6 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <ng-icon name="lucideSparkles" size="11" class="text-violet-400" />
                </div>
                <div class="pt-0.5">
                  <app-ai-typing-indicator />
                </div>
              </div>
            }

            <!-- Error -->
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
        <div class="rounded-2xl border border-border/60 bg-bg-elevated focus-within:border-border transition-colors">
          <div class="flex items-center gap-1.5 px-3 py-2.5">
            <ng-icon name="lucideSparkles" size="13" class="text-violet-400 shrink-0" />
            <input type="text" [(ngModel)]="userInput" (keydown.enter)="send()"
                   [disabled]="loading()"
                   placeholder="Pregunta sobre ventas, ingresos, productos…"
                   class="flex-1 bg-transparent text-[13px] text-text-primary
                          placeholder:text-text-muted outline-none border-none min-w-0
                          disabled:opacity-50" />
            <button (click)="send()" [disabled]="loading() || !userInput.trim()"
                    class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                           bg-white/90 hover:bg-white disabled:opacity-25
                           disabled:cursor-not-allowed transition-all">
              <ng-icon name="lucideArrowUp" size="14" class="text-black" />
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SellerBiChatComponent implements AfterViewChecked {
  @ViewChild('scrollRef') private scrollRef!: ElementRef<HTMLDivElement>;

  private readonly sellerAi = inject(SellerAiService);

  readonly messages = signal<BiMessage[]>([]);
  readonly loading  = signal(false);
  readonly error    = signal<string | null>(null);
  userInput = '';

  readonly quickQuestions = QUICK_QUESTIONS;

  constructor() {
    this.loadFromStorage();
  }

  ngAfterViewChecked(): void {
    const el = this.scrollRef?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  askQuestion(query: string): void {
    this.userInput = query;
    this.send();
  }

  send(): void {
    const q = this.userInput.trim();
    if (!q || this.loading()) return;
    this.userInput = '';
    this.error.set(null);
    this.messages.update(ms => [...ms, { role: 'user', text: q }]);
    this.loading.set(true);

    this.sellerAi.biQuery(q).subscribe({
      next: (bi) => {
        this.loading.set(false);
        this.messages.update(ms => [...ms, { role: 'ai', text: bi.narrative, bi }]);
        this.saveToStorage();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Error al consultar datos. Intenta de nuevo.');
      },
    });
  }

  clearHistory(): void {
    this.messages.set([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* quota */ }
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

  private saveToStorage(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.messages())); } catch { /* quota */ }
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.messages.set(JSON.parse(raw));
    } catch { /* ignore */ }
  }
}
