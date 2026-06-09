import { Component, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgIcon } from '@ng-icons/core';
import {
  selectCurrentKpis,
  selectCurrentAlerts,
  selectCurrentResult,
  selectAnalyticsIsLoading,
} from '../../../core/store/analytics-ai/analytics-ai.selectors';
import { KpiCardComponent } from './kpi-card.component';
import { AnalyticsChatComponent } from './analytics-chat.component';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [NgIcon, KpiCardComponent, AnalyticsChatComponent],
  template: `
    <div class="flex flex-col gap-5">

      <!-- ── Header ──────────────────────────────────────────────── -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20
                    flex items-center justify-center shrink-0">
          <ng-icon name="lucideSparkles" size="18" class="text-violet-400" />
        </div>
        <div>
          <h1 class="text-[20px] font-bold text-text-primary tracking-tight">Analytics IA</h1>
          <p class="text-[12px] text-text-muted">Consulta y analiza los datos del marketplace en tiempo real</p>
        </div>
      </div>

      <!-- ── Alerts ──────────────────────────────────────────────── -->
      @if (alerts().length > 0) {
        <div class="flex flex-col gap-2">
          @for (alert of alerts(); track $index) {
            <div class="flex items-center gap-2 px-4 py-3 rounded-xl
                        bg-red-500/8 border border-red-500/20 text-red-400 text-[13px]">
              <ng-icon name="lucideTriangleAlert" size="14" />{{ alert }}
            </div>
          }
        </div>
      }

      <!-- ── KPI grid (only when there are results) ──────────────── -->
      @if (kpis().length > 0) {
        <div>
          <div class="flex items-center gap-2 mb-3">
            <p class="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
              Indicadores clave
            </p>
            @if (currentResult()?.summary?.period) {
              <span class="text-[10px] text-text-muted">— {{ currentResult()!.summary.period }}</span>
            }
          </div>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            @for (kpi of kpis(); track kpi.name) {
              <app-kpi-card [kpi]="kpi" />
            }
          </div>
        </div>
      }

      <!-- ── Narrative + Recommendations (appear after first query) ── -->
      @if (currentResult()) {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <div class="rounded-2xl border border-border/40 bg-bg-elevated overflow-hidden">
            <div class="px-4 py-3 border-b border-border/40 flex items-center gap-2">
              <ng-icon name="lucideFileText" size="12" class="text-text-muted" />
              <span class="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Análisis narrativo</span>
            </div>
            <div class="px-4 py-4">
              <p class="text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap">
                {{ currentResult()!.narrative }}
              </p>
            </div>
          </div>

          @if (currentResult()!.summary.recommendations.length > 0) {
            <div class="rounded-2xl border border-border/40 bg-bg-elevated overflow-hidden">
              <div class="px-4 py-3 border-b border-border/40 flex items-center gap-2">
                <ng-icon name="lucideLightbulb" size="12" class="text-yellow-400" />
                <span class="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Recomendaciones</span>
              </div>
              <ul class="px-4 py-4 flex flex-col gap-2">
                @for (rec of currentResult()!.summary.recommendations; track $index) {
                  <li class="flex items-start gap-2 text-[12px] text-text-secondary leading-relaxed">
                    <ng-icon name="lucideArrowRight" size="10" class="text-violet-400 mt-0.5 shrink-0" />
                    {{ rec }}
                  </li>
                }
              </ul>
            </div>
          }

        </div>
      }

    </div>

    <!-- Floating AI chat button -->
    <button (click)="showChat.set(true)"
            class="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-3 rounded-full
                   bg-violet-600 hover:bg-violet-500 text-white font-medium text-[13px]
                   shadow-lg hover:shadow-violet-500/30 hover:shadow-xl transition-all
                   hover:-translate-y-0.5">
      <ng-icon name="lucideSparkles" size="15" />
      Consultar IA
    </button>

    <!-- Analytics chat panel -->
    <app-analytics-chat [isOpen]="showChat()" (close)="showChat.set(false)" />
  `,
})
export class AnalyticsDashboardComponent {
  private readonly store = inject(Store);

  showChat       = signal(false);
  readonly kpis  = toSignal(this.store.select(selectCurrentKpis),    { initialValue: [] });
  readonly alerts        = toSignal(this.store.select(selectCurrentAlerts),  { initialValue: [] });
  readonly currentResult = toSignal(this.store.select(selectCurrentResult),  { initialValue: null });
  readonly isLoading     = toSignal(this.store.select(selectAnalyticsIsLoading), { initialValue: false });
}
