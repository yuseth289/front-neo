import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgIcon } from '@ng-icons/core';
import { signal } from '@angular/core';
import * as SellerAiActions from '../../../core/store/seller-ai/seller-ai.actions';
import {
  selectEnhancedImages,
  selectPromotionalImage,
  selectIsEnhancingImages,
  selectSellerError,
} from '../../../core/store/seller-ai/seller-ai.selectors';
import { AiTypingIndicatorComponent } from '../../../shared/components/ai-typing-indicator.component';

const OPERATIONS = [
  { id: 'background_removal', label: 'Eliminar fondo' },
  { id: 'white_background', label: 'Fondo blanco' },
  { id: 'color_correction', label: 'Corrección de color' },
  { id: 'sharpening', label: 'Nitidez' },
  { id: 'noise_reduction', label: 'Reducción de ruido' },
  { id: 'upscaling', label: 'Aumentar resolución' },
  { id: 'smart_crop', label: 'Encuadre inteligente' },
  { id: 'promotional_image', label: 'Imagen promocional' },
];

@Component({
  selector: 'app-image-enhancer',
  standalone: true,
  imports: [NgIcon, AiTypingIndicatorComponent],
  template: `
    <div class="flex flex-col gap-5 p-5 rounded-2xl border border-border bg-bg-surface">
      <div class="flex items-center gap-2">
        <ng-icon name="lucideImageUp" size="16" class="text-violet-400" />
        <h3 class="text-sm font-semibold text-text-primary">Mejorar imágenes con IA</h3>
        <span class="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20
                     text-violet-400 font-mono">Nano Banana</span>
      </div>

      <!-- File upload -->
      <div>
        <label class="text-xs text-text-tertiary font-medium uppercase tracking-wider mb-2 block">
          Imágenes a mejorar
        </label>
        <label class="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-border
                      hover:border-violet-500/40 cursor-pointer transition-colors">
          <ng-icon name="lucideUploadCloud" size="24" class="text-text-tertiary" />
          <span class="text-sm text-text-secondary">
            @if (selectedFiles().length > 0) {
              {{ selectedFiles().length }} imagen{{ selectedFiles().length !== 1 ? 'es' : '' }} seleccionada{{ selectedFiles().length !== 1 ? 's' : '' }}
            } @else {
              Arrastra imágenes o haz clic
            }
          </span>
          <input type="file" accept="image/*" multiple class="hidden" (change)="onFilesSelected($event)" />
        </label>
      </div>

      <!-- Operations -->
      <div>
        <label class="text-xs text-text-tertiary font-medium uppercase tracking-wider mb-2 block">
          Operaciones a aplicar
        </label>
        <div class="flex flex-wrap gap-2">
          @for (op of operations; track op.id) {
            <button type="button"
                    (click)="toggleOperation(op.id)"
                    class="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                    [class.bg-violet-600]="selectedOperations().includes(op.id)"
                    [class.border-violet-600]="selectedOperations().includes(op.id)"
                    [class.text-white]="selectedOperations().includes(op.id)"
                    [class.bg-bg-elevated]="!selectedOperations().includes(op.id)"
                    [class.border-border]="!selectedOperations().includes(op.id)"
                    [class.text-text-secondary]="!selectedOperations().includes(op.id)">
              {{ op.label }}
            </button>
          }
        </div>
      </div>

      <!-- Action -->
      <button (click)="enhance()"
              [disabled]="isEnhancing() || selectedFiles().length === 0 || selectedOperations().length === 0"
              class="flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500
                     disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium
                     transition-colors">
        @if (isEnhancing()) {
          <app-ai-typing-indicator />
        } @else {
          <ng-icon name="lucideSparkles" size="16" />
          Mejorar con IA
        }
      </button>

      <!-- Error -->
      @if (error()) {
        <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs">
          <ng-icon name="lucideCircleAlert" size="14" />
          {{ error() }}
        </div>
      }

      <!-- Results -->
      @if (enhancedImages().length > 0) {
        <div>
          <h4 class="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
            Imágenes mejoradas
          </h4>
          <div class="grid grid-cols-2 gap-3">
            @for (img of enhancedImages(); track img.originalIndex) {
              <div class="flex flex-col gap-2">
                <div class="aspect-square rounded-xl overflow-hidden bg-bg-elevated">
                  <img [src]="'data:image/jpeg;base64,' + img.enhancedBase64"
                       [alt]="'Imagen mejorada ' + (img.originalIndex + 1)"
                       class="w-full h-full object-cover" />
                </div>
                <div class="flex items-center justify-between text-xs text-text-tertiary">
                  <span>Calidad</span>
                  <span class="font-medium text-emerald-400">
                    {{ img.qualityBefore }}% → {{ img.qualityAfter }}%
                  </span>
                </div>
                <p class="text-xs text-text-tertiary line-clamp-2">{{ img.modificationSummary }}</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- Promotional image -->
      @if (promotionalImage()) {
        <div>
          <h4 class="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">Imagen promocional</h4>
          <div class="rounded-xl overflow-hidden aspect-video">
            <img [src]="'data:image/jpeg;base64,' + promotionalImage()"
                 alt="Imagen promocional generada"
                 class="w-full h-full object-cover" />
          </div>
        </div>
      }
    </div>
  `,
})
export class ImageEnhancerComponent {
  private readonly store = inject(Store);

  readonly operations = OPERATIONS;
  readonly selectedFiles = signal<File[]>([]);
  readonly selectedOperations = signal<string[]>(['background_removal', 'white_background', 'color_correction', 'sharpening']);

  readonly enhancedImages = toSignal(this.store.select(selectEnhancedImages), { initialValue: [] });
  readonly promotionalImage = toSignal(this.store.select(selectPromotionalImage), { initialValue: null });
  readonly isEnhancing = toSignal(this.store.select(selectIsEnhancingImages), { initialValue: false });
  readonly error = toSignal(this.store.select(selectSellerError), { initialValue: null });

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles.set(Array.from(input.files));
    }
  }

  toggleOperation(id: string): void {
    this.selectedOperations.update(ops =>
      ops.includes(id) ? ops.filter(o => o !== id) : [...ops, id],
    );
  }

  enhance(): void {
    if (this.selectedFiles().length === 0 || this.selectedOperations().length === 0) return;
    this.store.dispatch(SellerAiActions.enhanceImages({
      images: this.selectedFiles(),
      operations: this.selectedOperations(),
    }));
  }
}
