import { Component, Input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { ImageAnalysisResult } from '../../../shared/models/seller.models';

const QUALITY_LABEL: Record<string, string> = {
  excellent: 'Excelente',
  good: 'Buena',
  poor: 'Deficiente',
};
const SHARPNESS_LABEL: Record<string, string> = {
  sharp: 'Nítida',
  acceptable: 'Aceptable',
  blurry: 'Borrosa',
};

@Component({
  selector: 'app-image-analyzer',
  standalone: true,
  imports: [NgIcon],
  template: `
    <div class="flex flex-col gap-3 p-4 rounded-xl border border-border bg-bg-elevated">
      <!-- Score bar -->
      <div class="flex items-center gap-3">
        <span class="text-xs text-text-tertiary shrink-0">Imagen {{ analysis.imageIndex + 1 }}</span>
        <div class="flex-1 h-1.5 rounded-full bg-bg-surface overflow-hidden">
          <div class="h-full rounded-full transition-all"
               [style.width.%]="analysis.qualityScore"
               [class.bg-emerald-500]="analysis.qualityScore >= 70"
               [class.bg-amber-500]="analysis.qualityScore >= 40 && analysis.qualityScore < 70"
               [class.bg-red-500]="analysis.qualityScore < 40">
          </div>
        </div>
        <span class="text-xs font-bold text-text-primary shrink-0">{{ analysis.qualityScore }}/100</span>
      </div>

      <!-- Tags row -->
      <div class="flex flex-wrap gap-1.5">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-medium border"
              [class.bg-emerald-500/10]="analysis.lightingQuality === 'excellent'"
              [class.border-emerald-500/30]="analysis.lightingQuality === 'excellent'"
              [class.text-emerald-400]="analysis.lightingQuality === 'excellent'"
              [class.bg-amber-500/10]="analysis.lightingQuality === 'good'"
              [class.border-amber-500/30]="analysis.lightingQuality === 'good'"
              [class.text-amber-400]="analysis.lightingQuality === 'good'"
              [class.bg-red-500/10]="analysis.lightingQuality === 'poor'"
              [class.border-red-500/30]="analysis.lightingQuality === 'poor'"
              [class.text-red-400]="analysis.lightingQuality === 'poor'">
          Iluminación: {{ qualityLabel }}
        </span>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-medium border"
              [class.bg-emerald-500/10]="analysis.sharpness === 'sharp'"
              [class.border-emerald-500/30]="analysis.sharpness === 'sharp'"
              [class.text-emerald-400]="analysis.sharpness === 'sharp'"
              [class.bg-red-500/10]="analysis.sharpness === 'blurry'"
              [class.border-red-500/30]="analysis.sharpness === 'blurry'"
              [class.text-red-400]="analysis.sharpness === 'blurry'"
              [class.bg-border]="analysis.sharpness === 'acceptable'"
              [class.border-border]="analysis.sharpness === 'acceptable'"
              [class.text-text-tertiary]="analysis.sharpness === 'acceptable'">
          {{ sharpnessLabel }}
        </span>
        @if (analysis.needsBackgroundRemoval) {
          <span class="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30
                       text-violet-400 text-[10px] font-medium">
            Requiere fondo blanco
          </span>
        }
      </div>

      <!-- Issues -->
      @if (analysis.issues.length > 0) {
        <ul class="flex flex-col gap-1">
          @for (issue of analysis.issues; track $index) {
            <li class="flex items-center gap-1.5 text-xs text-red-400">
              <ng-icon name="lucideCircleAlert" size="11" />
              {{ issue }}
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class ImageAnalyzerComponent {
  @Input({ required: true }) analysis!: ImageAnalysisResult;

  get qualityLabel(): string {
    return QUALITY_LABEL[this.analysis.lightingQuality] ?? this.analysis.lightingQuality;
  }

  get sharpnessLabel(): string {
    return SHARPNESS_LABEL[this.analysis.sharpness] ?? this.analysis.sharpness;
  }
}
