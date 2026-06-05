import {
  Component, Input, Output, EventEmitter, OnInit, inject, signal, computed,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { AiTypingIndicatorComponent } from '../../../shared/components/ai-typing-indicator.component';
import { SellerAiService } from '../../../core/services/seller-ai.service';
import {
  SellerAssistResultResponse, ImageEnhancementResponse, EnhancementOperation,
  SellerBIResponse, SellerBIKPI,
} from '../../../shared/models/seller.models';

export interface AiProductChatInput {
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
}

export interface ApplyDescriptionEvent {
  seoTitle?: string;
  description?: string;
}

interface ChatMessage {
  role: 'ai' | 'user';
  text: string;
  result?: SellerAssistResultResponse;
  biResponse?: SellerBIResponse;
  enhancementResult?: ImageEnhancementResponse;
  imagePreview?: string;   // small thumbnail — persisted in localStorage
  imageBase64?: string;    // full base64 for Nano Banana — in-memory only
}

interface StorableMessage {
  role: 'ai' | 'user';
  text: string;
  result?: SellerAssistResultResponse;
  biResponse?: SellerBIResponse;
  imagePreview?: string;
}

const BI_KEYWORDS = [
  'vend', 'ingres', 'gananci', 'factur', 'restock', 'tendencia', 'trend',
  'cuánto', 'cuantas', 'cuántas', 'cuántos', 'cuantos',
  'mejor product', 'top product', 'más vendid', 'mas vendid',
  'mis ordenes', 'mis órdenes', 'mis ventas', 'este mes', 'último mes',
  'calificaci', 'reseñas', 'rese', 'pedido', 'pendiente',
  'análisis', 'analisis', 'reporte', 'informe', 'resumen',
];

const OP_CHIPS: { op: EnhancementOperation; label: string }[] = [
  { op: 'background_removal', label: 'Quitar fondo' },
  { op: 'white_background',   label: 'Fondo blanco' },
  { op: 'color_correction',   label: 'Colores' },
  { op: 'sharpening',         label: 'Nitidez' },
  { op: 'smart_crop',         label: 'Encuadre' },
  { op: 'promotional_image',  label: 'Promocional' },
];

@Component({
  selector: 'app-ai-product-chat',
  standalone: true,
  imports: [DecimalPipe, FormsModule, NgIcon, AiTypingIndicatorComponent],
  template: `
    <!-- Overlay -->
    <div class="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
         (click)="close.emit()"></div>

    <!-- Panel -->
    <div class="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[440px]
                bg-bg-surface border-l border-border shadow-2xl flex flex-col
                animate-slide-in-right">

      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <ng-icon name="lucideSparkles" size="18" class="text-violet-400" />
          </div>
          <div>
            <p class="text-sm font-semibold text-text-primary">Asistente IA</p>
            <p class="text-xs text-text-tertiary">Sugerencias y mejora de imágenes</p>
          </div>
        </div>
        <div class="flex items-center gap-1">
          @if (messages().length > 0) {
            <button (click)="clearHistory()"
                    title="Limpiar conversación"
                    class="w-8 h-8 rounded-lg flex items-center justify-center
                           text-text-tertiary hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <ng-icon name="lucideTrash2" size="14" />
            </button>
          }
          <button (click)="close.emit()"
                  class="w-8 h-8 rounded-lg flex items-center justify-center
                         text-text-tertiary hover:text-text-primary hover:bg-bg-elevated transition-colors">
            <ng-icon name="lucideX" size="16" />
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div #scrollRef class="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0">

        <!-- Welcome -->
        <div class="flex gap-2.5">
          <div class="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
            <ng-icon name="lucideSparkles" size="13" class="text-violet-400" />
          </div>
          <div class="bg-bg-elevated rounded-2xl rounded-tl-sm px-4 py-3 max-w-[88%]">
            <p class="text-sm text-text-primary leading-relaxed">
              ¡Hola! Soy tu asistente IA para
              @if (productInput.name) {
                <strong class="text-violet-400">"{{ productInput.name }}"</strong>.
              } @else {
                tu producto.
              }
              Puedo mejorar la descripción, analizar y transformar imágenes con
              <span class="text-yellow-400 font-semibold">Nano Banana</span>.
            </p>
          </div>
        </div>

        <!-- Quick actions -->
        @if (!hasResult() && !loading()) {
          <div class="flex flex-wrap gap-2 ml-9">
            <button (click)="requestOptimize()"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-violet-500/30
                           bg-violet-500/5 text-xs text-violet-300 hover:bg-violet-500/10 transition-colors">
              <ng-icon name="lucidePenLine" size="12" />Mejorar descripción
            </button>
            <button (click)="imgFileRef.click()"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-yellow-500/30
                           bg-yellow-500/5 text-xs text-yellow-300 hover:bg-yellow-500/10 transition-colors">
              <ng-icon name="lucideCamera" size="12" />Analizar imagen
            </button>
            <button (click)="requestScore()"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green-500/30
                           bg-green-500/5 text-xs text-green-300 hover:bg-green-500/10 transition-colors">
              <ng-icon name="lucideBarChart2" size="12" />Puntuar listing
            </button>
            <button (click)="requestSalesQuery()"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-blue-500/30
                           bg-blue-500/5 text-xs text-blue-300 hover:bg-blue-500/10 transition-colors">
              <ng-icon name="lucideTrendingUp" size="12" />Mis ventas
            </button>
          </div>
        }

        <!-- Chat messages -->
        @for (msg of messages(); track $index) {

          @if (msg.role === 'user') {
            <!-- User bubble -->
            <div class="flex justify-end">
              <div class="flex flex-col items-end gap-1.5 max-w-[82%]">
                @if (msg.imagePreview) {
                  <div class="rounded-xl overflow-hidden border border-violet-500/30 w-40 shrink-0">
                    <img [src]="msg.imagePreview" alt="Imagen subida"
                         class="w-full h-32 object-cover" />
                  </div>
                }
                @if (msg.text) {
                  <div class="bg-violet-600 rounded-2xl rounded-tr-sm px-4 py-2.5">
                    <p class="text-sm text-white">{{ msg.text }}</p>
                  </div>
                }
              </div>
            </div>

          } @else {
            <!-- AI bubble -->
            <div class="flex gap-2.5">
              <div class="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
                <ng-icon name="lucideSparkles" size="13" class="text-violet-400" />
              </div>
              <div class="flex flex-col gap-2 max-w-[88%]">
                @if (msg.text) {
                  <div class="bg-bg-elevated rounded-2xl rounded-tl-sm px-4 py-3">
                    <p class="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{{ msg.text }}</p>
                  </div>
                }

                @if (msg.result) {

                  <!-- SEO Title card -->
                  @if (msg.result.optimizedContent.seoTitle) {
                    <div class="bg-violet-500/5 border border-violet-500/20 rounded-xl p-3 flex flex-col gap-2">
                      <p class="text-xs font-semibold text-violet-400 uppercase tracking-wider">Título SEO sugerido</p>
                      <p class="text-sm text-text-primary font-medium">{{ msg.result.optimizedContent.seoTitle }}</p>
                      <button (click)="applyTitle(msg.result)"
                              class="flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-lg
                                     bg-violet-600 hover:bg-violet-500 text-xs text-white font-medium transition-colors">
                        <ng-icon name="lucideCheck" size="11" />Aplicar título
                      </button>
                    </div>
                  }

                  <!-- Description card -->
                  @if (msg.result.optimizedContent.commercialDescription) {
                    <div class="bg-bg-elevated border border-border rounded-xl p-3 flex flex-col gap-2">
                      <p class="text-xs font-semibold text-text-secondary uppercase tracking-wider">Descripción optimizada</p>
                      <p class="text-xs text-text-secondary leading-relaxed line-clamp-4">
                        {{ msg.result.optimizedContent.commercialDescription }}
                      </p>
                      <button (click)="applyDescription(msg.result)"
                              class="flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-lg
                                     bg-bg-surface border border-border hover:border-violet-500/50
                                     text-xs text-text-secondary hover:text-violet-400 transition-colors">
                        <ng-icon name="lucideCopy" size="11" />Aplicar descripción
                      </button>
                    </div>
                  }

                  <!-- Listing score card -->
                  @if (msg.result.listingScore.totalScore !== undefined) {
                    <div class="bg-bg-elevated border border-border rounded-xl p-3">
                      <div class="flex items-center justify-between mb-2">
                        <p class="text-xs font-semibold text-text-secondary">Puntaje del listing</p>
                        <span class="text-sm font-bold"
                              [class.text-green-400]="msg.result.listingScore.totalScore >= 70"
                              [class.text-yellow-400]="msg.result.listingScore.totalScore >= 40 && msg.result.listingScore.totalScore < 70"
                              [class.text-red-400]="msg.result.listingScore.totalScore < 40">
                          {{ msg.result.listingScore.totalScore | number:'1.0-0' }}/100
                        </span>
                      </div>
                      <div class="w-full h-1.5 bg-bg-base rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-700"
                             [style.width.%]="msg.result.listingScore.totalScore"
                             [class.bg-green-400]="msg.result.listingScore.totalScore >= 70"
                             [class.bg-yellow-400]="msg.result.listingScore.totalScore >= 40 && msg.result.listingScore.totalScore < 70"
                             [class.bg-red-400]="msg.result.listingScore.totalScore < 40"></div>
                      </div>
                      @if (msg.result.listingScore.improvementSuggestions.length) {
                        <ul class="mt-2 flex flex-col gap-1">
                          @for (s of msg.result.listingScore.improvementSuggestions; track $index) {
                            <li class="text-xs text-text-tertiary flex gap-1.5">
                              <ng-icon name="lucideArrowRight" size="11" class="text-violet-400 mt-0.5 shrink-0" />{{ s }}
                            </li>
                          }
                        </ul>
                      }
                    </div>
                  }

                  <!-- Image analysis card -->
                  @if (msg.result.imageAnalysis.length) {
                    @for (analysis of msg.result.imageAnalysis; track analysis.imageIndex) {
                      <div class="bg-bg-elevated border border-border rounded-xl p-3 flex flex-col gap-2">
                        <div class="flex items-center justify-between">
                          <p class="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                            Análisis de imagen {{ analysis.imageIndex + 1 }}
                          </p>
                          <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                                [class.bg-green-500/15]="analysis.qualityScore >= 70"
                                [class.text-green-400]="analysis.qualityScore >= 70"
                                [class.bg-yellow-500/15]="analysis.qualityScore >= 40 && analysis.qualityScore < 70"
                                [class.text-yellow-400]="analysis.qualityScore >= 40 && analysis.qualityScore < 70"
                                [class.bg-red-500/15]="analysis.qualityScore < 40"
                                [class.text-red-400]="analysis.qualityScore < 40">
                            {{ analysis.qualityScore | number:'1.0-0' }}/100
                          </span>
                        </div>
                        <!-- Quality row -->
                        <div class="grid grid-cols-3 gap-1.5 text-center">
                          <div class="rounded-lg bg-bg-base px-2 py-1.5">
                            <p class="text-[9px] text-text-tertiary uppercase tracking-wider">Fondo</p>
                            <p class="text-[11px] font-medium text-text-secondary mt-0.5 capitalize">
                              {{ bgLabel(analysis.backgroundType) }}
                            </p>
                          </div>
                          <div class="rounded-lg bg-bg-base px-2 py-1.5">
                            <p class="text-[9px] text-text-tertiary uppercase tracking-wider">Luz</p>
                            <p class="text-[11px] font-medium mt-0.5"
                               [class.text-green-400]="analysis.lightingQuality === 'excellent'"
                               [class.text-yellow-400]="analysis.lightingQuality === 'good'"
                               [class.text-red-400]="analysis.lightingQuality === 'poor'">
                              {{ lightLabel(analysis.lightingQuality) }}
                            </p>
                          </div>
                          <div class="rounded-lg bg-bg-base px-2 py-1.5">
                            <p class="text-[9px] text-text-tertiary uppercase tracking-wider">Foco</p>
                            <p class="text-[11px] font-medium mt-0.5"
                               [class.text-green-400]="analysis.sharpness === 'sharp'"
                               [class.text-yellow-400]="analysis.sharpness === 'acceptable'"
                               [class.text-red-400]="analysis.sharpness === 'blurry'">
                              {{ sharpLabel(analysis.sharpness) }}
                            </p>
                          </div>
                        </div>
                        <!-- Issues -->
                        @if (analysis.issues.length) {
                          <div class="flex flex-col gap-1">
                            @for (issue of analysis.issues; track $index) {
                              <p class="text-xs text-red-400/80 flex gap-1.5 items-start">
                                <ng-icon name="lucideAlertCircle" size="11" class="shrink-0 mt-0.5" />{{ issue }}
                              </p>
                            }
                          </div>
                        }
                      </div>
                    }

                    <!-- Nano Banana controls — shown only on last analysis message -->
                    @if ($index === lastAnalysisIndex() && currentImageBase64()) {
                      <div class="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 flex flex-col gap-2.5">
                        <div class="flex items-center gap-2">
                          <span class="text-base">🍌</span>
                          <p class="text-xs font-semibold text-yellow-400">Transformar con Nano Banana</p>
                        </div>
                        <div class="flex flex-wrap gap-1.5">
                          @for (chip of opChips; track chip.op) {
                            <button type="button" (click)="toggleOp(chip.op)"
                                    class="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all"
                                    [class.border-yellow-500]="isOpSelected(chip.op)"
                                    [class.bg-yellow-500/15]="isOpSelected(chip.op)"
                                    [class.text-yellow-300]="isOpSelected(chip.op)"
                                    [class.border-border]="!isOpSelected(chip.op)"
                                    [class.text-text-tertiary]="!isOpSelected(chip.op)">
                              {{ chip.label }}
                            </button>
                          }
                        </div>
                        <button (click)="enhanceCurrentImage()"
                                [disabled]="enhancing() || selectedOps().length === 0"
                                class="flex items-center justify-center gap-2 py-2 rounded-lg
                                       bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40
                                       disabled:cursor-not-allowed text-xs font-semibold text-black transition-colors">
                          @if (enhancing()) {
                            <ng-icon name="lucideRefreshCw" size="13" class="animate-spin" />Procesando…
                          } @else {
                            <ng-icon name="lucideZap" size="13" />Transformar imagen (~30 s)
                          }
                        </button>
                      </div>
                    }
                  }
                }

                <!-- BI response -->
                @if (msg.biResponse) {
                  <div class="flex flex-col gap-2">
                    <!-- Narrative -->
                    @if (msg.biResponse.narrative) {
                      <div class="bg-bg-elevated rounded-2xl rounded-tl-sm px-4 py-3">
                        <p class="text-sm text-text-primary leading-relaxed">{{ msg.biResponse.narrative }}</p>
                      </div>
                    }
                    <!-- KPI grid -->
                    @if (msg.biResponse.kpis.length) {
                      <div class="grid grid-cols-2 gap-2">
                        @for (kpi of msg.biResponse.kpis; track kpi.name) {
                          <div class="bg-bg-elevated border rounded-xl p-2.5 flex flex-col gap-0.5"
                               [class.border-red-500/30]="kpi.isAlert"
                               [class.border-border]="!kpi.isAlert">
                            <p class="text-[10px] text-text-tertiary uppercase tracking-wider truncate">{{ kpi.name }}</p>
                            <div class="flex items-baseline gap-1">
                              <p class="text-sm font-bold text-text-primary truncate">{{ formatKpiValue(kpi) }}</p>
                              <span class="text-xs shrink-0" [class]="kpiTrendColor(kpi)">{{ kpiTrend(kpi) }}</span>
                            </div>
                            <p class="text-[10px] text-text-tertiary">
                              {{ kpi.unit !== 'COP' ? kpi.unit + ' · ' : '' }}{{ kpi.period }}
                              @if (kpi.variationPct !== null) {
                                · {{ kpi.variationPct > 0 ? '+' : '' }}{{ kpi.variationPct }}%
                              }
                            </p>
                          </div>
                        }
                      </div>
                    }
                    <!-- Recommendations -->
                    @if (msg.biResponse.recommendations.length) {
                      <div class="bg-bg-elevated border border-border rounded-xl p-3">
                        <p class="text-xs font-semibold text-text-secondary mb-2">Recomendaciones</p>
                        <ul class="flex flex-col gap-1.5">
                          @for (rec of msg.biResponse.recommendations; track $index) {
                            <li class="text-xs text-text-secondary flex gap-2 items-start">
                              <ng-icon name="lucideArrowRight" size="11" class="text-violet-400 mt-0.5 shrink-0" />
                              {{ rec }}
                            </li>
                          }
                        </ul>
                      </div>
                    }
                  </div>
                }

                <!-- Enhancement result -->
                @if (msg.enhancementResult) {
                  @if (msg.enhancementResult.enhancedImages.length) {
                    <div class="bg-bg-elevated border border-yellow-500/20 rounded-xl p-3 flex flex-col gap-2">
                      <div class="flex items-center justify-between">
                        <p class="text-xs font-semibold text-yellow-400">Imagen transformada</p>
                        <span class="text-xs text-green-400 font-medium">
                          +{{ msg.enhancementResult.overallQualityImprovement | number:'1.0-0' }} pts
                        </span>
                      </div>
                      <div class="rounded-lg overflow-hidden border border-border">
                        <img [src]="'data:image/jpeg;base64,' + msg.enhancementResult.enhancedImages[0].enhancedBase64"
                             alt="Imagen mejorada" class="w-full max-h-52 object-contain bg-white" />
                      </div>
                      <p class="text-[11px] text-text-tertiary">{{ msg.enhancementResult.enhancedImages[0].modificationSummary }}</p>
                      <div class="flex gap-2">
                        <button (click)="saveEnhancedImageToGallery(msg.enhancementResult.enhancedImages[0].enhancedBase64)"
                                class="flex items-center gap-1.5 flex-1 justify-center py-1.5 rounded-lg
                                       bg-yellow-500/15 border border-yellow-500/30 text-xs text-yellow-300
                                       hover:bg-yellow-500/25 font-medium transition-colors">
                          <ng-icon name="lucideImagePlus" size="12" />Guardar en galería
                        </button>
                        <a [href]="'data:image/jpeg;base64,' + msg.enhancementResult.enhancedImages[0].enhancedBase64"
                           download="producto-mejorado.jpg"
                           class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border
                                  text-xs text-text-tertiary hover:text-text-secondary transition-colors">
                          <ng-icon name="lucideDownload" size="12" />
                        </a>
                      </div>
                    </div>
                  }
                  <!-- Promotional image -->
                  @if (msg.enhancementResult.promotionalImageBase64) {
                    <div class="bg-bg-elevated border border-purple-500/20 rounded-xl p-3 flex flex-col gap-2">
                      <p class="text-xs font-semibold text-purple-400">Imagen promocional</p>
                      <div class="rounded-lg overflow-hidden border border-border">
                        <img [src]="'data:image/jpeg;base64,' + msg.enhancementResult.promotionalImageBase64"
                             alt="Imagen promocional" class="w-full max-h-52 object-contain bg-white" />
                      </div>
                      <button (click)="saveEnhancedImageToGallery(msg.enhancementResult.promotionalImageBase64!)"
                              class="flex items-center gap-1.5 justify-center py-1.5 rounded-lg
                                     bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300
                                     hover:bg-purple-500/20 font-medium transition-colors">
                        <ng-icon name="lucideImagePlus" size="12" />Guardar imagen promocional
                      </button>
                    </div>
                  }
                }
              </div>
            </div>
          }
        }

        <!-- Loading -->
        @if (loading() || enhancing()) {
          <div class="flex gap-2.5">
            <div class="w-7 h-7 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
              @if (enhancing()) {
                <span class="text-sm">🍌</span>
              } @else {
                <ng-icon name="lucideSparkles" size="13" class="text-violet-400" />
              }
            </div>
            <div class="bg-bg-elevated rounded-2xl rounded-tl-sm px-4 py-3">
              @if (enhancing()) {
                <p class="text-xs text-yellow-400 mb-1.5">Nano Banana procesando imagen…</p>
              }
              <app-ai-typing-indicator />
            </div>
          </div>
        }

        <!-- Error -->
        @if (error()) {
          <div class="mx-1 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {{ error() }}
          </div>
        }
      </div>

      <!-- Input bar -->
      <div class="px-4 py-3 border-t border-border shrink-0">
        <!-- Hidden file input for image upload -->
        <input #imgFileRef type="file" accept="image/jpeg,image/png,image/webp" class="hidden"
               (change)="onImageSelect($event)" />
        <div class="flex gap-2">
          <button type="button" (click)="imgFileRef.click()" [disabled]="loading() || enhancing()"
                  title="Subir imagen para analizar"
                  class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                         border border-yellow-500/30 bg-yellow-500/5 text-yellow-400
                         hover:bg-yellow-500/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ng-icon name="lucideCamera" size="15" />
          </button>
          <input type="text" [(ngModel)]="userMessage" (keydown.enter)="sendMessage()"
                 [disabled]="loading() || enhancing()"
                 placeholder="Pregunta algo sobre tu producto…"
                 class="flex-1 px-3 py-2 rounded-xl border border-border bg-bg-elevated
                        text-sm text-text-primary placeholder:text-text-tertiary
                        focus:outline-none focus:ring-2 focus:ring-violet-500/30
                        disabled:opacity-50 min-w-0" />
          <button (click)="sendMessage()" [disabled]="loading() || enhancing() || !userMessage.trim()"
                  class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                         bg-violet-600 hover:bg-violet-500 disabled:opacity-40
                         disabled:cursor-not-allowed transition-colors">
            <ng-icon name="lucideSend" size="15" class="text-white" />
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slide-in-right {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }
    .animate-slide-in-right { animation: slide-in-right 0.25s cubic-bezier(0.16,1,0.3,1); }
  `],
})
export class AiProductChatComponent implements OnInit {
  @Input() productInput: AiProductChatInput = { name: '', description: '', price: 0, category: '', brand: '' };
  @Input() productId?: string | null;
  @Output() close            = new EventEmitter<void>();
  @Output() applyContent     = new EventEmitter<ApplyDescriptionEvent>();
  @Output() saveImage        = new EventEmitter<string>();

  private readonly sellerAi = inject(SellerAiService);

  readonly messages        = signal<ChatMessage[]>([]);
  readonly loading         = signal(false);
  readonly error           = signal<string | null>(null);
  readonly enhancing       = signal(false);
  readonly currentImageBase64 = signal<string | null>(null);
  readonly selectedOps     = signal<EnhancementOperation[]>([
    'background_removal', 'white_background', 'color_correction', 'sharpening',
  ]);
  userMessage = '';

  readonly opChips = OP_CHIPS;

  readonly hasResult = computed(() => this.messages().some(m => !!m.result));

  readonly lastAnalysisIndex = computed(() => {
    const msgs = this.messages();
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].result?.imageAnalysis?.length) return i;
    }
    return -1;
  });

  private get storageKey(): string {
    return `neo_ai_chat_${this.productId ?? 'draft'}`;
  }

  ngOnInit(): void {
    this.loadFromStorage();
  }

  // ── Quick actions ──────────────────────────────────────────────────────

  requestOptimize(): void {
    this.addUserMsg('Mejora la descripción y el título de mi producto');
    this.callOptimizeAI();
  }

  requestScore(): void {
    this.addUserMsg('Puntúa mi listing actual y dime cómo mejorar');
    this.callOptimizeAI();
  }

  requestSalesQuery(): void {
    const query = '¿Cómo van mis ventas este mes? Muéstrame ingresos, órdenes y mis productos más vendidos.';
    this.addUserMsg(query);
    this.callBiQuery(query);
  }

  sendMessage(): void {
    const text = this.userMessage.trim();
    if (!text || this.loading() || this.enhancing()) return;
    this.userMessage = '';
    this.addUserMsg(text);
    if (this.isBiQuery(text)) {
      this.callBiQuery(text);
    } else {
      this.callOptimizeAI();
    }
  }

  private isBiQuery(text: string): boolean {
    const lower = text.toLowerCase();
    return lower.includes('?') || BI_KEYWORDS.some(kw => lower.includes(kw));
  }

  // ── Image upload & analysis ────────────────────────────────────────────

  onImageSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      this.error.set('La imagen supera los 10 MB.');
      return;
    }
    this.analyzeImage(file);
  }

  private async analyzeImage(file: File): Promise<void> {
    this.error.set(null);
    const [thumb, base64] = await Promise.all([
      this.resizeToThumbnail(file, 320),
      this.fileToBase64(file),
    ]);

    this.currentImageBase64.set(base64);
    this.addMessage({ role: 'user', text: 'Analiza esta imagen de mi producto.', imagePreview: thumb });

    this.loading.set(true);
    const name = this.productInput.name || 'Producto';
    this.sellerAi
      .analyzeImages(name, [file], this.productInput.category, this.productInput.brand)
      .subscribe({
        next: (result) => {
          this.loading.set(false);
          const a = result.imageAnalysis?.[0];
          const scoreText = a ? ` Calidad: ${Math.round(a.qualityScore)}/100.` : '';
          this.addMessage({
            role: 'ai',
            text: `Analicé tu imagen.${scoreText} Aquí está el detalle:`,
            result,
          });
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.error?.message ?? 'Error al analizar la imagen.');
        },
      });
  }

  // ── Nano Banana enhancement ────────────────────────────────────────────

  toggleOp(op: EnhancementOperation): void {
    this.selectedOps.update(ops =>
      ops.includes(op) ? ops.filter(o => o !== op) : [...ops, op],
    );
  }

  isOpSelected(op: EnhancementOperation): boolean {
    return this.selectedOps().includes(op);
  }

  enhanceCurrentImage(): void {
    const base64 = this.currentImageBase64();
    if (!base64 || this.enhancing()) return;

    this.error.set(null);
    this.enhancing.set(true);
    const ops = this.selectedOps();
    const file = this.base64ToFile(base64, 'producto.jpg');
    const generatePromo = ops.includes('promotional_image');

    this.sellerAi.enhanceImages([file], ops, this.productInput.name, generatePromo).subscribe({
      next: (result) => {
        this.enhancing.set(false);
        const improvement = result.overallQualityImprovement.toFixed(0);
        this.addMessage({
          role: 'ai',
          text: `✅ Imagen transformada con Nano Banana (+${improvement} pts de calidad).`,
          enhancementResult: result,
        });
        this.currentImageBase64.set(null);
      },
      error: (err) => {
        this.enhancing.set(false);
        this.error.set(err?.error?.message ?? 'Error al procesar con Nano Banana. Intenta de nuevo.');
      },
    });
  }

  saveEnhancedImageToGallery(base64: string): void {
    this.saveImage.emit(base64);
    this.addMessage({ role: 'ai', text: '✅ Imagen guardada en la galería del producto.' });
  }

  // ── Apply content ──────────────────────────────────────────────────────

  applyTitle(result: SellerAssistResultResponse): void {
    this.applyContent.emit({ seoTitle: result.optimizedContent.seoTitle });
    this.addMessage({ role: 'ai', text: '✅ Título aplicado al formulario.' });
  }

  applyDescription(result: SellerAssistResultResponse): void {
    this.applyContent.emit({ description: result.optimizedContent.commercialDescription });
    this.addMessage({ role: 'ai', text: '✅ Descripción aplicada al formulario.' });
  }

  // ── History ────────────────────────────────────────────────────────────

  clearHistory(): void {
    this.messages.set([]);
    this.currentImageBase64.set(null);
    try { localStorage.removeItem(this.storageKey); } catch { /* quota */ }
  }

  // ── Label helpers ──────────────────────────────────────────────────────

  bgLabel(type: string): string {
    const map: Record<string, string> = {
      white: 'Blanco', colored: 'Color', transparent: 'Trans.', lifestyle: 'Lifestyle', other: 'Otro',
    };
    return map[type] ?? type;
  }

  lightLabel(q: string): string {
    return q === 'excellent' ? 'Excelente' : q === 'good' ? 'Buena' : 'Mala';
  }

  sharpLabel(s: string): string {
    return s === 'sharp' ? 'Nítida' : s === 'acceptable' ? 'Aceptable' : 'Borrosa';
  }

  // ── Private ────────────────────────────────────────────────────────────

  private addUserMsg(text: string): void {
    this.addMessage({ role: 'user', text });
    this.error.set(null);
  }

  private addMessage(msg: ChatMessage): void {
    this.messages.update(msgs => [...msgs, msg]);
    this.saveToStorage();
  }

  private callOptimizeAI(): void {
    this.loading.set(true);
    this.sellerAi.optimizeProduct({
      name:        this.productInput.name || 'Producto sin nombre',
      description: this.productInput.description,
      price:       this.productInput.price,
      category:    this.productInput.category,
      brand:       this.productInput.brand,
    }).subscribe({
      next: (result) => {
        this.loading.set(false);
        const score = result.listingScore;
        const scoreTxt = score ? ` Puntaje actual: ${Math.round(score.totalScore)}/100.` : '';
        this.addMessage({
          role: 'ai',
          text: `Aquí están mis sugerencias para "${this.productInput.name || 'tu producto'}".${scoreTxt}`,
          result,
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Error al conectar con la IA. Intenta de nuevo.');
      },
    });
  }

  private callBiQuery(query: string): void {
    this.loading.set(true);
    this.sellerAi.biQuery(query).subscribe({
      next: (bi) => {
        this.loading.set(false);
        this.addMessage({ role: 'ai', text: '', biResponse: bi });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Error al consultar datos de ventas.');
      },
    });
  }

  kpiTrend(kpi: SellerBIKPI): string {
    if (kpi.trend === 'up') return '↑';
    if (kpi.trend === 'down') return '↓';
    return '→';
  }

  kpiTrendColor(kpi: SellerBIKPI): string {
    if (kpi.trend === 'up')   return kpi.isAlert ? 'text-yellow-400' : 'text-green-400';
    if (kpi.trend === 'down') return kpi.isAlert ? 'text-red-400' : 'text-red-400';
    return 'text-text-tertiary';
  }

  formatKpiValue(kpi: SellerBIKPI): string {
    if (kpi.unit === 'COP' && typeof kpi.value === 'number') {
      return `$${(kpi.value as number).toLocaleString('es-CO')}`;
    }
    return String(kpi.value);
  }

  // ── localStorage ───────────────────────────────────────────────────────

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const stored: StorableMessage[] = JSON.parse(raw);
      this.messages.set(stored.map(m => ({
        role: m.role,
        text: m.text,
        result: m.result,
        biResponse: m.biResponse,
        imagePreview: m.imagePreview,
      })));
    } catch { /* parse error or quota */ }
  }

  private saveToStorage(): void {
    try {
      const storable: StorableMessage[] = this.messages().map(m => ({
        role: m.role,
        text: m.text,
        result: m.result,
        biResponse: m.biResponse,
        imagePreview: m.imagePreview,
        // imageBase64 & enhancementResult excluded (contain large base64)
      }));
      localStorage.setItem(this.storageKey, JSON.stringify(storable));
    } catch { /* quota exceeded */ }
  }

  // ── Image utilities ────────────────────────────────────────────────────

  private async resizeToThumbnail(file: File, maxW = 320): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(''); };
      img.src = url;
    });
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private base64ToFile(base64: string, filename: string): File {
    const bytes = atob(base64);
    const ab = new ArrayBuffer(bytes.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < bytes.length; i++) ia[i] = bytes.charCodeAt(i);
    return new File([ab], filename, { type: 'image/jpeg' });
  }
}
