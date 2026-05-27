import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgIcon } from '@ng-icons/core';
import * as SellerAiActions from '../../../core/store/seller-ai/seller-ai.actions';
import {
  selectOptimizedContent,
  selectListingScore,
  selectImageAnalysis,
  selectSellerIsLoading,
  selectIsAnalyzingImages,
  selectSellerError,
  selectHasOptimizedContent,
} from '../../../core/store/seller-ai/seller-ai.selectors';
import { ContentPreviewComponent } from './content-preview.component';
import { ImageAnalyzerComponent } from './image-analyzer.component';
import { ImageEnhancerComponent } from './image-enhancer.component';
import { ScoreBreakdownComponent } from '../listing-score/score-breakdown.component';
import { AiTypingIndicatorComponent } from '../../../shared/components/ai-typing-indicator.component';

type Tab = 'optimize' | 'analyze' | 'enhance';

@Component({
  selector: 'app-seller-assistant',
  standalone: true,
  imports: [
    FormsModule, NgIcon,
    ContentPreviewComponent, ImageAnalyzerComponent, ImageEnhancerComponent,
    ScoreBreakdownComponent, AiTypingIndicatorComponent,
  ],
  template: `
    <div class="flex flex-col gap-6 p-6">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
          <ng-icon name="lucideSparkles" size="18" class="text-violet-400" />
        </div>
        <div>
          <h1 class="text-xl font-bold text-text-primary">Asistente de producto IA</h1>
          <p class="text-sm text-text-secondary">Optimiza listings, analiza y mejora tus imágenes con inteligencia artificial</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 p-1 rounded-xl bg-bg-elevated border border-border w-fit">
        @for (tab of tabs; track tab.id) {
          <button (click)="activeTab.set(tab.id)"
                  class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  [class.bg-bg-surface]="activeTab() === tab.id"
                  [class.text-text-primary]="activeTab() === tab.id"
                  [class.shadow-sm]="activeTab() === tab.id"
                  [class.text-text-tertiary]="activeTab() !== tab.id"
                  [class.hover:text-text-secondary]="activeTab() !== tab.id">
            <ng-icon [name]="tab.icon" size="15" />
            {{ tab.label }}
          </button>
        }
      </div>

      <!-- Tab: Optimize -->
      @if (activeTab() === 'optimize') {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Form -->
          <form (ngSubmit)="optimize()" class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs text-text-secondary font-medium">Nombre del producto *</label>
              <input type="text" [(ngModel)]="form.name" name="name" required
                     class="px-4 py-2.5 rounded-xl border border-border bg-bg-surface text-text-primary text-sm
                            focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                     placeholder="ej. Mouse gamer Logitech G502 X Plus" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs text-text-secondary font-medium">Descripción actual</label>
              <textarea [(ngModel)]="form.description" name="description" rows="4"
                        class="px-4 py-2.5 rounded-xl border border-border bg-bg-surface text-text-primary text-sm
                               resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                        placeholder="Describe el producto, características, uso..."></textarea>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs text-text-secondary font-medium">Precio (COP)</label>
                <input type="number" [(ngModel)]="form.price" name="price" min="0"
                       class="px-4 py-2.5 rounded-xl border border-border bg-bg-surface text-text-primary text-sm
                              focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                       placeholder="150000" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs text-text-secondary font-medium">Categoría</label>
                <input type="text" [(ngModel)]="form.category" name="category"
                       class="px-4 py-2.5 rounded-xl border border-border bg-bg-surface text-text-primary text-sm
                              focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                       placeholder="ej. Periféricos Gaming" />
              </div>
            </div>
            <button type="submit"
                    [disabled]="isLoading() || !form.name.trim()"
                    class="flex items-center justify-center gap-2 py-3 rounded-xl
                           bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed
                           text-white text-sm font-medium transition-colors">
              @if (isLoading()) {
                <app-ai-typing-indicator />
              } @else {
                <ng-icon name="lucideSparkles" size="16" />
                Optimizar con IA
              }
            </button>
            @if (error()) {
              <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs">
                <ng-icon name="lucideCircleAlert" size="14" />
                {{ error() }}
              </div>
            }
          </form>

          <!-- Results column -->
          <div class="flex flex-col gap-4">
            @if (hasOptimizedContent()) {
              <app-content-preview [content]="optimizedContent()!" />
            }
            @if (listingScore()) {
              <app-score-breakdown [score]="listingScore()!" />
            }
          </div>
        </div>
      }

      <!-- Tab: Analyze images -->
      @if (activeTab() === 'analyze') {
        <div class="flex flex-col gap-5">
          <!-- Product name for context -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-text-secondary font-medium">Nombre del producto (para contexto)</label>
            <input type="text" [(ngModel)]="analyzeProductName" name="analyzeProductName"
                   class="px-4 py-2.5 rounded-xl border border-border bg-bg-surface text-text-primary text-sm
                          focus:outline-none focus:ring-2 focus:ring-violet-500/40 max-w-md"
                   placeholder="ej. Mouse gamer Logitech G502" />
          </div>
          <!-- Upload -->
          <div>
            <label class="text-xs text-text-tertiary font-medium uppercase tracking-wider mb-2 block">
              Sube tus imágenes de producto
            </label>
            <label class="flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-dashed border-border
                          hover:border-violet-500/40 cursor-pointer transition-colors">
              <ng-icon name="lucideImage" size="32" class="text-text-tertiary" />
              <div class="text-center">
                <p class="text-sm text-text-secondary font-medium">
                  @if (analyzeFiles().length > 0) {
                    {{ analyzeFiles().length }} imagen{{ analyzeFiles().length !== 1 ? 'es' : '' }} seleccionada{{ analyzeFiles().length !== 1 ? 's' : '' }}
                  } @else {
                    Selecciona imágenes para analizar
                  }
                </p>
                <p class="text-xs text-text-tertiary mt-1">JPG, PNG, WebP</p>
              </div>
              <input type="file" accept="image/*" multiple class="hidden" (change)="onAnalyzeFilesSelected($event)" />
            </label>
          </div>
          <button (click)="analyzeImages()"
                  [disabled]="isAnalyzingImages() || analyzeFiles().length === 0"
                  class="flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500
                         disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors w-fit px-6">
            @if (isAnalyzingImages()) {
              <app-ai-typing-indicator />
            } @else {
              <ng-icon name="lucideSparkles" size="16" />
              Analizar imágenes
            }
          </button>

          <!-- Analysis results -->
          @if (imageAnalysis().length > 0) {
            <div>
              <h3 class="text-sm font-semibold text-text-primary mb-3">Resultados del análisis</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                @for (analysis of imageAnalysis(); track analysis.imageIndex) {
                  <app-image-analyzer [analysis]="analysis" />
                }
              </div>
            </div>
            @if (listingScore()) {
              <app-score-breakdown [score]="listingScore()!" />
            }
          }
        </div>
      }

      <!-- Tab: Enhance images -->
      @if (activeTab() === 'enhance') {
        <app-image-enhancer />
      }
    </div>
  `,
})
export class SellerAssistantComponent {
  private readonly store = inject(Store);

  readonly activeTab = signal<Tab>('optimize');
  readonly analyzeFiles = signal<File[]>([]);
  analyzeProductName = '';

  readonly tabs = [
    { id: 'optimize' as Tab, label: 'Optimizar', icon: 'lucideSparkles' },
    { id: 'analyze' as Tab,  label: 'Analizar imágenes', icon: 'lucideImage' },
    { id: 'enhance' as Tab,  label: 'Mejorar imágenes', icon: 'lucideImageUp' },
  ];

  form = { name: '', description: '', price: 0, category: '' };

  readonly optimizedContent = toSignal(this.store.select(selectOptimizedContent), { initialValue: null });
  readonly listingScore = toSignal(this.store.select(selectListingScore), { initialValue: null });
  readonly imageAnalysis = toSignal(this.store.select(selectImageAnalysis), { initialValue: [] });
  readonly isLoading = toSignal(this.store.select(selectSellerIsLoading), { initialValue: false });
  readonly isAnalyzingImages = toSignal(this.store.select(selectIsAnalyzingImages), { initialValue: false });
  readonly error = toSignal(this.store.select(selectSellerError), { initialValue: null });
  readonly hasOptimizedContent = toSignal(this.store.select(selectHasOptimizedContent), { initialValue: false });

  optimize(): void {
    if (!this.form.name.trim() || this.isLoading()) return;
    this.store.dispatch(SellerAiActions.assistProduct({
      name: this.form.name,
      description: this.form.description,
      price: this.form.price,
      category: this.form.category,
      images: [],
    }));
  }

  onAnalyzeFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.analyzeFiles.set(Array.from(input.files));
  }

  analyzeImages(): void {
    if (this.analyzeFiles().length === 0) return;
    const name = this.analyzeProductName.trim() || 'Producto';
    this.store.dispatch(SellerAiActions.analyzeImages({ name, images: this.analyzeFiles() }));
  }
}
