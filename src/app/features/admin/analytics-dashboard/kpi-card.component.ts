import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { KPIResult } from '../../../shared/models/analytics.models';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [NgIcon, DecimalPipe],
  template: `
    <div class="rounded-xl border bg-bg-elevated p-4 flex flex-col gap-2"
         [class.border-red-500/30]="kpi.isAlert"
         [class.bg-red-500/5]="kpi.isAlert"
         [class.border-border/50]="!kpi.isAlert">

      <div class="flex items-center justify-between gap-1">
        <span class="text-[9px] font-semibold text-text-muted uppercase tracking-wider truncate">{{ kpi.name }}</span>
        @if (kpi.variationPct !== null) {
          <span class="shrink-0 text-[11px] font-semibold flex items-center gap-0.5"
                [class.text-green-400]="kpi.trend === 'up'"
                [class.text-red-400]="kpi.trend === 'down'"
                [class.text-text-muted]="kpi.trend === 'stable'">
            @if (kpi.trend === 'up') { <ng-icon name="lucideTrendingUp" size="11" /> }
            @else if (kpi.trend === 'down') { <ng-icon name="lucideTrendingDown" size="11" /> }
            {{ kpi.variationPct > 0 ? '+' : '' }}{{ kpi.variationPct | number:'1.1-1' }}%
          </span>
        }
      </div>

      <div class="flex items-baseline gap-1">
        <span class="text-[22px] font-bold text-text-primary leading-none">{{ kpi.value }}</span>
        @if (kpi.unit) {
          <span class="text-[11px] text-text-muted">{{ kpi.unit }}</span>
        }
      </div>

      <span class="text-[10px] text-text-muted">{{ kpi.period }}</span>

      @if (kpi.isAlert) {
        <div class="flex items-center gap-1 text-[10px] text-red-400">
          <ng-icon name="lucideTriangleAlert" size="10" />Requiere atención
        </div>
      }
    </div>
  `,
})
export class KpiCardComponent {
  @Input({ required: true }) kpi!: KPIResult;
}
