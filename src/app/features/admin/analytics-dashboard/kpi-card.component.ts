import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { KPIResult } from '../../../shared/models/analytics.models';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [NgIcon, DecimalPipe],
  template: `
    <div class="flex flex-col gap-3 p-5 rounded-xl border border-border bg-bg-surface"
         [class.border-red-500/30]="kpi.isAlert"
         [class.bg-red-500/5]="kpi.isAlert">
      <div class="flex items-center justify-between">
        <span class="text-xs text-text-tertiary font-medium uppercase tracking-wider">{{ kpi.name }}</span>
        <span class="flex items-center gap-1 text-xs font-medium"
              [class.text-emerald-400]="kpi.trend === 'up'"
              [class.text-red-400]="kpi.trend === 'down'"
              [class.text-text-tertiary]="kpi.trend === 'stable'">
          @if (kpi.trend === 'up') {
            <ng-icon name="lucideTrendingUp" size="14" />
          } @else if (kpi.trend === 'down') {
            <ng-icon name="lucideTrendingDown" size="14" />
          }
          @if (kpi.variationPct !== null) {
            {{ kpi.variationPct > 0 ? '+' : '' }}{{ kpi.variationPct | number:'1.1-1' }}%
          }
        </span>
      </div>

      <div class="flex items-end gap-1">
        <span class="text-2xl font-bold text-text-primary">{{ kpi.value }}</span>
        @if (kpi.unit) {
          <span class="text-sm text-text-tertiary mb-0.5">{{ kpi.unit }}</span>
        }
      </div>

      <span class="text-xs text-text-tertiary">{{ kpi.period }}</span>

      @if (kpi.isAlert) {
        <div class="flex items-center gap-1.5 text-xs text-red-400">
          <ng-icon name="lucideTriangleAlert" size="12" />
          Requiere atención
        </div>
      }
    </div>
  `,
})
export class KpiCardComponent {
  @Input({ required: true }) kpi!: KPIResult;
}
