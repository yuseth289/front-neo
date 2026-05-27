import { Component, Input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { ListingQualityScore } from '../../../shared/models/seller.models';

@Component({
  selector: 'app-score-breakdown',
  standalone: true,
  imports: [NgIcon],
  template: `
    <div class="p-5 rounded-2xl border border-border bg-bg-surface flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-text-primary">Puntuación del listing</h3>
        <!-- Total score ring -->
        <div class="relative w-14 h-14 flex items-center justify-center">
          <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor"
                    stroke-width="3" class="text-border" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor"
                    stroke-width="3" class="text-violet-500"
                    [attr.stroke-dasharray]="score.totalScore + ' 100'"
                    stroke-linecap="round" />
          </svg>
          <span class="absolute text-xs font-bold text-text-primary">{{ score.totalScore }}</span>
        </div>
      </div>

      <!-- Sub-scores -->
      <div class="grid grid-cols-2 gap-3">
        @for (item of subScores; track item.label) {
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between text-xs">
              <span class="text-text-tertiary">{{ item.label }}</span>
              <span class="font-medium text-text-primary">{{ item.value }}/100</span>
            </div>
            <div class="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500"
                   [style.width.%]="item.value"
                   [class.bg-emerald-500]="item.value >= 70"
                   [class.bg-amber-500]="item.value >= 40 && item.value < 70"
                   [class.bg-red-500]="item.value < 40">
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Missing fields -->
      @if (score.missingFields.length > 0) {
        <div>
          <p class="text-xs font-medium text-text-secondary mb-2">Campos incompletos</p>
          <div class="flex flex-wrap gap-1.5">
            @for (field of score.missingFields; track field) {
              <span class="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20
                           text-amber-400 text-[11px]">
                {{ field }}
              </span>
            }
          </div>
        </div>
      }

      <!-- Suggestions -->
      @if (score.improvementSuggestions.length > 0) {
        <div>
          <p class="text-xs font-medium text-text-secondary mb-2">Sugerencias de mejora</p>
          <ul class="flex flex-col gap-1.5">
            @for (sug of score.improvementSuggestions; track $index) {
              <li class="flex items-start gap-1.5 text-xs text-text-secondary">
                <ng-icon name="lucideLightbulb" size="12" class="text-violet-400 shrink-0 mt-0.5" />
                {{ sug }}
              </li>
            }
          </ul>
        </div>
      }
    </div>
  `,
})
export class ScoreBreakdownComponent {
  @Input({ required: true }) score!: ListingQualityScore;

  get subScores() {
    return [
      { label: 'Contenido', value: this.score.contentScore },
      { label: 'Completitud', value: this.score.completenessScore },
      { label: 'SEO', value: this.score.seoScore },
      { label: 'Imágenes', value: this.score.imageScore },
    ];
  }
}
