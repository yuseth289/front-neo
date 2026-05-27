import { Component, Input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { OptimizedContent } from '../../../shared/models/seller.models';

@Component({
  selector: 'app-content-preview',
  standalone: true,
  imports: [NgIcon],
  template: `
    <div class="flex flex-col gap-5 p-5 rounded-2xl border border-border bg-bg-surface">
      <div class="flex items-center gap-2">
        <ng-icon name="lucideSparkles" size="16" class="text-violet-400" />
        <h3 class="text-sm font-semibold text-text-primary">Contenido optimizado por IA</h3>
      </div>

      <!-- SEO Title -->
      <div>
        <label class="text-xs text-text-tertiary font-medium uppercase tracking-wider">Título SEO</label>
        <p class="mt-1.5 text-sm font-semibold text-text-primary">{{ content.seoTitle }}</p>
      </div>

      <!-- Description -->
      <div>
        <label class="text-xs text-text-tertiary font-medium uppercase tracking-wider">Descripción comercial</label>
        <p class="mt-1.5 text-sm text-text-secondary leading-relaxed">{{ content.commercialDescription }}</p>
      </div>

      <!-- Benefits -->
      @if (content.keyBenefits.length > 0) {
        <div>
          <label class="text-xs text-text-tertiary font-medium uppercase tracking-wider">Beneficios clave</label>
          <ul class="mt-1.5 flex flex-col gap-1.5">
            @for (benefit of content.keyBenefits; track $index) {
              <li class="flex items-start gap-2 text-sm text-text-secondary">
                <ng-icon name="lucideCheck" size="14" class="text-emerald-400 shrink-0 mt-0.5" />
                {{ benefit }}
              </li>
            }
          </ul>
        </div>
      }

      <!-- Keywords -->
      @if (content.seoKeywords.length > 0) {
        <div>
          <label class="text-xs text-text-tertiary font-medium uppercase tracking-wider mb-1.5 block">
            Palabras clave SEO
          </label>
          <div class="flex flex-wrap gap-1.5">
            @for (kw of content.seoKeywords; track $index) {
              <span class="px-2.5 py-1 rounded-full text-xs bg-violet-500/10 border border-violet-500/20
                           text-violet-300">
                {{ kw }}
              </span>
            }
          </div>
        </div>
      }

      <!-- Tags -->
      @if (content.tags.length > 0) {
        <div>
          <label class="text-xs text-text-tertiary font-medium uppercase tracking-wider mb-1.5 block">Tags</label>
          <div class="flex flex-wrap gap-1.5">
            @for (tag of content.tags; track $index) {
              <span class="px-2.5 py-1 rounded-full text-xs bg-bg-elevated border border-border text-text-secondary">
                #{{ tag }}
              </span>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class ContentPreviewComponent {
  @Input({ required: true }) content!: OptimizedContent;
}
