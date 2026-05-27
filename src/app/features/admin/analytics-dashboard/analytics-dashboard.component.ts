import { Component, inject } from '@angular/core';
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
    <div class="flex flex-col gap-6 p-6">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
          <ng-icon name="lucideSparkles" size="18" class="text-violet-400" />
        </div>
        <div>
          <h1 class="text-xl font-bold text-text-primary">Analytics IA</h1>
          <p class="text-sm text-text-secondary">Consulta y analiza los datos del marketplace con inteligencia artificial</p>
        </div>
      </div>

      <!-- Alerts -->
      @if (alerts().length > 0) {
        <div class="flex flex-col gap-2">
          @for (alert of alerts(); track $index) {
            <div class="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20
                        text-red-400 text-sm">
              <ng-icon name="lucideTriangleAlert" size="16" />
              {{ alert }}
            </div>
          }
        </div>
      }

      <!-- KPIs grid -->
      @if (kpis().length > 0) {
        <div>
          <h2 class="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Indicadores clave — {{ currentResult()?.summary?.period }}
          </h2>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            @for (kpi of kpis(); track kpi.name) {
              <app-kpi-card [kpi]="kpi" />
            }
          </div>
        </div>
      }

      <!-- Chat + narrative -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Chat -->
        <div class="h-[500px]">
          <app-analytics-chat />
        </div>

        <!-- Narrative + recommendations -->
        @if (currentResult()) {
          <div class="flex flex-col gap-4">
            <div class="p-5 rounded-2xl border border-border bg-bg-surface">
              <h3 class="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <ng-icon name="lucideSparkles" size="15" class="text-violet-400" />
                Análisis narrativo
              </h3>
              <p class="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {{ currentResult()!.narrative }}
              </p>
            </div>

            @if (currentResult()!.summary.recommendations.length > 0) {
              <div class="p-5 rounded-2xl border border-border bg-bg-surface">
                <h3 class="text-sm font-semibold text-text-primary mb-3">Recomendaciones</h3>
                <ul class="flex flex-col gap-2">
                  @for (rec of currentResult()!.summary.recommendations; track $index) {
                    <li class="flex items-start gap-2 text-sm text-text-secondary">
                      <ng-icon name="lucideCheck" size="14" class="text-emerald-400 shrink-0 mt-0.5" />
                      {{ rec }}
                    </li>
                  }
                </ul>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class AnalyticsDashboardComponent {
  private readonly store = inject(Store);

  readonly kpis = toSignal(this.store.select(selectCurrentKpis), { initialValue: [] });
  readonly alerts = toSignal(this.store.select(selectCurrentAlerts), { initialValue: [] });
  readonly currentResult = toSignal(this.store.select(selectCurrentResult), { initialValue: null });
  readonly isLoading = toSignal(this.store.select(selectAnalyticsIsLoading), { initialValue: false });
}
