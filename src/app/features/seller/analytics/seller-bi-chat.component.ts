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
  { icon: 'lucideBarChart2',    label: 'Ventas del mes',      query: '¿Cuánto he vendido este mes? Muéstrame ingresos y órdenes.' },
  { icon: 'lucideTrophy',       label: 'Mejores productos',   query: '¿Cuáles son mis productos más vendidos?' },
  { icon: 'lucideClipboardList',label: 'Órdenes pendientes',  query: '¿Cuántas órdenes tengo pendientes y cuáles necesito atender?' },
  { icon: 'lucideTrendingUp',   label: 'Comparar meses',      query: '¿Cómo me fue este mes comparado con el mes anterior?' },
  { icon: 'lucideStar',         label: 'Calificación',        query: '¿Cómo está mi calificación y mis reseñas?' },
];

@Component({
  selector: 'app-seller-bi-chat',
  standalone: true,
  imports: [FormsModule, DecimalPipe, NgIcon, AiTypingIndicatorComponent],
  template: `
    <div class="neo-card-premium overflow-hidden flex flex-col" style="min-height:520px;max-height:680px;">

      <!-- Header -->
      <div class="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
             style="background:linear-gradient(135deg,rgba(139,92,246,0.2),rgba(59,130,246,0.15));">
          <ng-icon name="lucideSparkles" size="18" class="text-violet-400" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-text-primary">Asistente BI</p>
          <p class="text-xs text-text-tertiary">Consulta inteligente sobre tus ventas en tiempo real</p>
        </div>
        @if (messages().length > 0) {
          <button (click)="clearHistory()"
                  title="Limpiar historial"
                  class="w-7 h-7 rounded-lg flex items-center justify-center
                         text-text-tertiary hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
            <ng-icon name="lucideTrash2" size="13" />
          </button>
        }
      </div>

      <!-- Messages -->
      <div #scrollRef class="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0">

        <!-- Empty state with quick questions -->
        @if (messages().length === 0 && !loading()) {
          <div class="flex flex-col gap-4 py-4">
            <div class="flex flex-col items-center gap-2 text-center py-4">
              <div class="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                <ng-icon name="lucideBrainCircuit" size="22" class="text-violet-400" />
              </div>
              <p class="text-sm font-medium text-text-primary">¿Qué quieres analizar hoy?</p>
              <p class="text-xs text-text-tertiary max-w-xs leading-relaxed">
                Pregúntame sobre tus ventas, ingresos, productos y más — con datos reales de tu tienda.
              </p>
            </div>
            <div class="flex flex-col gap-2">
              @for (q of quickQuestions; track q.label) {
                <button (click)="askQuestion(q.query)"
                        class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border
                               bg-bg-elevated hover:border-violet-500/40 hover:bg-violet-500/5
                               text-left text-sm text-text-secondary hover:text-text-primary
                               transition-all group">
                  <ng-icon [name]="q.icon" size="15" class="text-violet-400 shrink-0" />
                  <span class="group-hover:text-violet-300 transition-colors">{{ q.label }}</span>
                  <ng-icon name="lucideArrowRight" size="12" class="ml-auto text-text-tertiary group-hover:text-violet-400 transition-colors shrink-0" />
                </button>
              }
            </div>
          </div>
        }

        <!-- Chat messages -->
        @for (msg of messages(); track $index) {
          @if (msg.role === 'user') {
            <div class="flex justify-end">
              <div class="max-w-[82%] bg-violet-600 rounded-2xl rounded-tr-sm px-4 py-2.5">
                <p class="text-sm text-white">{{ msg.text }}</p>
              </div>
            </div>
          } @else {
            <div class="flex gap-2.5">
              <div class="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
                <ng-icon name="lucideSparkles" size="13" class="text-violet-400" />
              </div>
              <div class="flex flex-col gap-2 min-w-0 flex-1 max-w-[92%]">

                <!-- Narrative -->
                @if (msg.text) {
                  <div class="bg-bg-elevated rounded-2xl rounded-tl-sm px-4 py-3">
                    <p class="text-sm text-text-primary leading-relaxed">{{ msg.text }}</p>
                  </div>
                }

                @if (msg.bi) {
                  <!-- KPI grid -->
                  @if (msg.bi.kpis.length) {
                    <div class="grid grid-cols-2 gap-2">
                      @for (kpi of msg.bi.kpis; track kpi.name) {
                        <div class="bg-bg-elevated border rounded-xl p-3 flex flex-col gap-0.5"
                             [class.border-red-500/30]="kpi.isAlert"
                             [class.border-border]="!kpi.isAlert">
                          <p class="text-[10px] text-text-tertiary uppercase tracking-wider leading-none">{{ kpi.name }}</p>
                          <div class="flex items-baseline gap-1 mt-1">
                            <p class="text-sm font-bold text-text-primary truncate">{{ formatValue(kpi) }}</p>
                            <span class="text-xs shrink-0 font-medium" [class]="trendClass(kpi)">{{ trendArrow(kpi) }}</span>
                          </div>
                          <p class="text-[10px] text-text-tertiary mt-0.5">
                            {{ kpi.unit !== 'COP' ? kpi.unit + ' · ' : '' }}{{ kpi.period }}
                            @if (kpi.variationPct !== null && kpi.variationPct !== undefined) {
                              · <span [class.text-green-400]="kpi.variationPct > 0" [class.text-red-400]="kpi.variationPct < 0">
                                {{ kpi.variationPct > 0 ? '+' : '' }}{{ kpi.variationPct | number:'1.1-1' }}%
                              </span>
                            }
                          </p>
                        </div>
                      }
                    </div>
                  }

                  <!-- Recommendations -->
                  @if (msg.bi.recommendations.length) {
                    <div class="bg-bg-elevated border border-border rounded-xl p-3">
                      <p class="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Recomendaciones</p>
                      <ul class="flex flex-col gap-1.5">
                        @for (rec of msg.bi.recommendations; track $index) {
                          <li class="text-xs text-text-secondary flex gap-2 items-start leading-relaxed">
                            <ng-icon name="lucideArrowRight" size="10" class="text-violet-400 mt-0.5 shrink-0" />{{ rec }}
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
            <div class="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
              <ng-icon name="lucideSparkles" size="13" class="text-violet-400" />
            </div>
            <div class="bg-bg-elevated rounded-2xl rounded-tl-sm px-4 py-3">
              <app-ai-typing-indicator />
            </div>
          </div>
        }

        <!-- Error -->
        @if (error()) {
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            <ng-icon name="lucideCircleAlert" size="13" />{{ error() }}
          </div>
        }
      </div>

      <!-- Input -->
      <div class="px-4 py-3 border-t border-border shrink-0">
        <div class="flex gap-2">
          <input type="text" [(ngModel)]="userInput" (keydown.enter)="send()"
                 [disabled]="loading()"
                 placeholder="Pregunta sobre tus ventas, productos, ingresos…"
                 class="flex-1 px-3 py-2 rounded-xl border border-border bg-bg-elevated
                        text-sm text-text-primary placeholder:text-text-tertiary
                        focus:outline-none focus:ring-2 focus:ring-violet-500/30
                        disabled:opacity-50 min-w-0" />
          <button (click)="send()" [disabled]="loading() || !userInput.trim()"
                  class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                         bg-violet-600 hover:bg-violet-500 disabled:opacity-40
                         disabled:cursor-not-allowed transition-colors">
            <ng-icon name="lucideSend" size="15" class="text-white" />
          </button>
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
        this.messages.update(ms => [...ms, {
          role: 'ai',
          text: bi.narrative,
          bi,
        }]);
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
    return 'text-text-tertiary';
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.messages()));
    } catch { /* quota */ }
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.messages.set(JSON.parse(raw));
    } catch { /* ignore */ }
  }
}
