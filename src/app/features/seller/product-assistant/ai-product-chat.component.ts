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
    <div class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
         (click)="close.emit()"></div>

    <!-- Panel — full-height slide-in, bg-bg-base like Vercel's main chat area -->
    <div class="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[460px]
                bg-bg-base flex flex-col animate-slide-in-right
                border-l border-border/40">

      <!-- ── Header ─────────────────────────────────────────── -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-border/40 shrink-0">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <ng-icon name="lucideSparkles" size="13" class="text-violet-400" />
          </div>
          <span class="text-[13px] font-semibold text-text-primary">Asistente IA</span>
          @if (productInput.name) {
            <span class="hidden sm:block text-[11px] text-text-muted truncate max-w-[120px]">
              · {{ productInput.name }}
            </span>
          }
        </div>
        <div class="flex items-center gap-0.5">
          @if (messages().length > 0) {
            <button (click)="clearHistory()" title="Limpiar conversación"
                    class="w-7 h-7 rounded-lg flex items-center justify-center
                           text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <ng-icon name="lucideTrash2" size="13" />
            </button>
          }
          <button (click)="close.emit()"
                  class="w-7 h-7 rounded-lg flex items-center justify-center
                         text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors">
            <ng-icon name="lucideX" size="14" />
          </button>
        </div>
      </div>

      <!-- ── Messages scroll area ───────────────────────────── -->
      <div #scrollRef class="flex-1 overflow-y-auto min-h-0">

        <!-- ── GREETING (empty state — like Vercel's "What can I help with?") -->
        @if (messages().length === 0 && !loading()) {
          <div class="flex flex-col h-full px-5 py-6">

            <!-- Centered greeting text -->
            <div class="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <div class="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20
                          flex items-center justify-center">
                <ng-icon name="lucideSparkles" size="22" class="text-violet-400" />
              </div>
              <h2 class="text-[20px] font-semibold text-text-primary tracking-tight">
                ¿En qué puedo ayudarte?
              </h2>
              <p class="text-[12px] text-text-muted max-w-[220px] leading-relaxed">
                @if (productInput.name) {
                  Pregúntame sobre
                  <span class="text-text-secondary font-medium">{{ productInput.name }}</span>
                  o sube una imagen para analizarla.
                } @else {
                  Optimiza títulos, analiza imágenes o consulta tus datos de ventas.
                }
              </p>
            </div>

            <!-- Suggested actions — 2×2 grid (like Vercel's SuggestedActions) -->
            <div class="grid grid-cols-2 gap-2 mt-6">
              <button (click)="requestOptimize()"
                      class="flex flex-col gap-1.5 p-3.5 rounded-xl border border-border/60 bg-bg-elevated
                             text-left hover:bg-bg-subtle hover:-translate-y-0.5 hover:border-border
                             transition-all duration-200">
                <ng-icon name="lucidePenLine" size="15" class="text-violet-400" />
                <p class="text-[12px] font-medium text-text-primary">Mejorar contenido</p>
                <p class="text-[10px] text-text-muted leading-relaxed">Optimiza título y descripción</p>
              </button>

              <button (click)="requestScore()"
                      class="flex flex-col gap-1.5 p-3.5 rounded-xl border border-border/60 bg-bg-elevated
                             text-left hover:bg-bg-subtle hover:-translate-y-0.5 hover:border-border
                             transition-all duration-200">
                <ng-icon name="lucideBarChart2" size="15" class="text-green-400" />
                <p class="text-[12px] font-medium text-text-primary">Puntuar listing</p>
                <p class="text-[10px] text-text-muted leading-relaxed">Analiza qué mejorar</p>
              </button>

              <button (click)="imgFileRef.click()"
                      class="flex flex-col gap-1.5 p-3.5 rounded-xl border border-border/60 bg-bg-elevated
                             text-left hover:bg-bg-subtle hover:-translate-y-0.5 hover:border-border
                             transition-all duration-200">
                <ng-icon name="lucideCamera" size="15" class="text-yellow-400" />
                <p class="text-[12px] font-medium text-text-primary">Analizar imagen</p>
                <p class="text-[10px] text-text-muted leading-relaxed">Calidad y mejoras con IA</p>
              </button>

              <button (click)="requestSalesQuery()"
                      class="flex flex-col gap-1.5 p-3.5 rounded-xl border border-border/60 bg-bg-elevated
                             text-left hover:bg-bg-subtle hover:-translate-y-0.5 hover:border-border
                             transition-all duration-200">
                <ng-icon name="lucideTrendingUp" size="15" class="text-blue-400" />
                <p class="text-[12px] font-medium text-text-primary">Ver mis ventas</p>
                <p class="text-[10px] text-text-muted leading-relaxed">Ingresos y tendencias</p>
              </button>
            </div>
          </div>
        }

        <!-- ── MESSAGES ────────────────────────────────────── -->
        @if (messages().length > 0 || loading()) {
          <div class="px-5 py-5 flex flex-col gap-6">

            @for (msg of messages(); track $index) {

              @if (msg.role === 'user') {
                <!-- User message: right, pill bubble (like Vercel) -->
                <div class="flex justify-end">
                  <div class="flex flex-col items-end gap-1.5 max-w-[82%]">
                    @if (msg.imagePreview) {
                      <div class="rounded-2xl overflow-hidden border border-border/50 w-44">
                        <img [src]="msg.imagePreview" alt="Imagen subida" class="w-full h-36 object-cover" />
                      </div>
                    }
                    @if (msg.text) {
                      <div class="px-4 py-2.5 rounded-2xl rounded-br-sm
                                  bg-bg-elevated border border-border/50
                                  text-[13px] text-text-primary leading-relaxed">
                        {{ msg.text }}
                      </div>
                    }
                  </div>
                </div>

              } @else {
                <!-- AI message: left, NO bubble on text (like Vercel) -->
                <div class="flex gap-2.5">
                  <div class="w-6 h-6 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
                    <ng-icon name="lucideSparkles" size="11" class="text-violet-400" />
                  </div>

                  <div class="flex-1 flex flex-col gap-3 min-w-0">

                    <!-- AI text — no bubble, just plain text like Vercel -->
                    @if (msg.text) {
                      <p class="text-[13px] text-text-primary leading-[1.65] whitespace-pre-wrap">{{ msg.text }}</p>
                    }

                    @if (msg.result) {

                      <!-- SEO Title — tool output card -->
                      @if (msg.result.optimizedContent.seoTitle) {
                        <div class="rounded-xl border border-border/50 bg-bg-elevated overflow-hidden">
                          <div class="px-3.5 py-2 border-b border-border/40 flex items-center gap-2">
                            <ng-icon name="lucideTag" size="10" class="text-violet-400" />
                            <span class="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Título SEO</span>
                          </div>
                          <div class="px-3.5 py-3 flex flex-col gap-3">
                            <p class="text-[13px] font-medium text-text-primary leading-snug">
                              {{ msg.result.optimizedContent.seoTitle }}
                            </p>
                            <button (click)="applyTitle(msg.result)"
                                    class="w-fit flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                           bg-violet-600 hover:bg-violet-500 text-[11px] text-white font-medium transition-colors">
                              <ng-icon name="lucideCheck" size="10" />Aplicar título
                            </button>
                          </div>
                        </div>
                      }

                      <!-- Description — tool output card -->
                      @if (msg.result.optimizedContent.commercialDescription) {
                        <div class="rounded-xl border border-border/50 bg-bg-elevated overflow-hidden">
                          <div class="px-3.5 py-2 border-b border-border/40 flex items-center gap-2">
                            <ng-icon name="lucideFileText" size="10" class="text-text-muted" />
                            <span class="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Descripción optimizada</span>
                          </div>
                          <div class="px-3.5 py-3 flex flex-col gap-3">
                            <p class="text-[12px] text-text-secondary leading-relaxed line-clamp-4">
                              {{ msg.result.optimizedContent.commercialDescription }}
                            </p>
                            <button (click)="applyDescription(msg.result)"
                                    class="w-fit flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                           border border-border hover:border-violet-500/50
                                           text-[11px] text-text-secondary hover:text-violet-400 transition-colors">
                              <ng-icon name="lucideCopy" size="10" />Aplicar descripción
                            </button>
                          </div>
                        </div>
                      }

                      <!-- Listing score — tool output card -->
                      @if (msg.result.listingScore.totalScore !== undefined) {
                        <div class="rounded-xl border border-border/50 bg-bg-elevated overflow-hidden">
                          <div class="px-3.5 py-2 border-b border-border/40 flex items-center justify-between">
                            <div class="flex items-center gap-2">
                              <ng-icon name="lucideBarChart2" size="10" class="text-text-muted" />
                              <span class="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Puntaje del listing</span>
                            </div>
                            <span class="text-[13px] font-bold"
                                  [class.text-green-400]="msg.result.listingScore.totalScore >= 70"
                                  [class.text-yellow-400]="msg.result.listingScore.totalScore >= 40 && msg.result.listingScore.totalScore < 70"
                                  [class.text-red-400]="msg.result.listingScore.totalScore < 40">
                              {{ msg.result.listingScore.totalScore | number:'1.0-0' }}/100
                            </span>
                          </div>
                          <div class="px-3.5 py-3 flex flex-col gap-2">
                            <div class="h-1 w-full bg-bg-base rounded-full overflow-hidden">
                              <div class="h-full rounded-full transition-all duration-700"
                                   [style.width.%]="msg.result.listingScore.totalScore"
                                   [class.bg-green-400]="msg.result.listingScore.totalScore >= 70"
                                   [class.bg-yellow-400]="msg.result.listingScore.totalScore >= 40 && msg.result.listingScore.totalScore < 70"
                                   [class.bg-red-400]="msg.result.listingScore.totalScore < 40"></div>
                            </div>
                            @if (msg.result.listingScore.improvementSuggestions.length) {
                              <ul class="flex flex-col gap-1 mt-1">
                                @for (s of msg.result.listingScore.improvementSuggestions; track $index) {
                                  <li class="text-[11px] text-text-muted flex gap-1.5 items-start">
                                    <ng-icon name="lucideArrowRight" size="10" class="text-violet-400 mt-0.5 shrink-0" />{{ s }}
                                  </li>
                                }
                              </ul>
                            }
                          </div>
                        </div>
                      }

                      <!-- Image analysis -->
                      @if (msg.result.imageAnalysis.length) {
                        @for (analysis of msg.result.imageAnalysis; track analysis.imageIndex) {
                          <div class="rounded-xl border border-border/50 bg-bg-elevated overflow-hidden">
                            <div class="px-3.5 py-2 border-b border-border/40 flex items-center justify-between">
                              <span class="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                                Análisis · imagen {{ analysis.imageIndex + 1 }}
                              </span>
                              <span class="text-[11px] font-bold px-2 py-0.5 rounded-full"
                                    [class.bg-green-500/15]="analysis.qualityScore >= 70"
                                    [class.text-green-400]="analysis.qualityScore >= 70"
                                    [class.bg-yellow-500/15]="analysis.qualityScore >= 40 && analysis.qualityScore < 70"
                                    [class.text-yellow-400]="analysis.qualityScore >= 40 && analysis.qualityScore < 70"
                                    [class.bg-red-500/15]="analysis.qualityScore < 40"
                                    [class.text-red-400]="analysis.qualityScore < 40">
                                {{ analysis.qualityScore | number:'1.0-0' }}/100
                              </span>
                            </div>
                            <div class="px-3.5 py-3 flex flex-col gap-2.5">
                              <div class="grid grid-cols-3 gap-1.5 text-center">
                                <div class="rounded-lg bg-bg-base px-2 py-2">
                                  <p class="text-[9px] text-text-muted uppercase tracking-wider">Fondo</p>
                                  <p class="text-[11px] font-medium text-text-secondary mt-1 capitalize">{{ bgLabel(analysis.backgroundType) }}</p>
                                </div>
                                <div class="rounded-lg bg-bg-base px-2 py-2">
                                  <p class="text-[9px] text-text-muted uppercase tracking-wider">Luz</p>
                                  <p class="text-[11px] font-medium mt-1"
                                     [class.text-green-400]="analysis.lightingQuality === 'excellent'"
                                     [class.text-yellow-400]="analysis.lightingQuality === 'good'"
                                     [class.text-red-400]="analysis.lightingQuality === 'poor'">
                                    {{ lightLabel(analysis.lightingQuality) }}
                                  </p>
                                </div>
                                <div class="rounded-lg bg-bg-base px-2 py-2">
                                  <p class="text-[9px] text-text-muted uppercase tracking-wider">Foco</p>
                                  <p class="text-[11px] font-medium mt-1"
                                     [class.text-green-400]="analysis.sharpness === 'sharp'"
                                     [class.text-yellow-400]="analysis.sharpness === 'acceptable'"
                                     [class.text-red-400]="analysis.sharpness === 'blurry'">
                                    {{ sharpLabel(analysis.sharpness) }}
                                  </p>
                                </div>
                              </div>
                              @if (analysis.issues.length) {
                                <div class="flex flex-col gap-1">
                                  @for (issue of analysis.issues; track $index) {
                                    <p class="text-[11px] text-red-400/80 flex gap-1.5 items-start">
                                      <ng-icon name="lucideAlertCircle" size="10" class="shrink-0 mt-0.5" />{{ issue }}
                                    </p>
                                  }
                                </div>
                              }
                            </div>
                          </div>
                        }

                        <!-- Nano Banana controls -->
                        @if ($index === lastAnalysisIndex() && currentImageBase64()) {
                          <div class="rounded-xl border border-yellow-500/25 bg-yellow-500/5 overflow-hidden">
                            <div class="px-3.5 py-2 border-b border-yellow-500/20 flex items-center gap-2">
                              <span class="text-sm">🍌</span>
                              <span class="text-[10px] font-semibold text-yellow-400 uppercase tracking-wider">Transformar con Nano Banana</span>
                            </div>
                            <div class="px-3.5 py-3 flex flex-col gap-2.5">
                              <div class="flex flex-wrap gap-1.5">
                                @for (chip of opChips; track chip.op) {
                                  <button type="button" (click)="toggleOp(chip.op)"
                                          class="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all"
                                          [class.border-yellow-500]="isOpSelected(chip.op)"
                                          [class.bg-yellow-500/15]="isOpSelected(chip.op)"
                                          [class.text-yellow-300]="isOpSelected(chip.op)"
                                          [class.border-border]="!isOpSelected(chip.op)"
                                          [class.text-text-muted]="!isOpSelected(chip.op)">
                                    {{ chip.label }}
                                  </button>
                                }
                              </div>
                              <button (click)="enhanceCurrentImage()"
                                      [disabled]="enhancing() || selectedOps().length === 0"
                                      class="flex items-center justify-center gap-2 py-2 rounded-lg
                                             bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40
                                             disabled:cursor-not-allowed text-[12px] font-semibold text-black transition-colors">
                                @if (enhancing()) {
                                  <ng-icon name="lucideRefreshCw" size="12" class="animate-spin" />Procesando…
                                } @else {
                                  <ng-icon name="lucideZap" size="12" />Transformar (~30 s)
                                }
                              </button>
                            </div>
                          </div>
                        }
                      }
                    }

                    <!-- BI response -->
                    @if (msg.biResponse) {
                      <div class="flex flex-col gap-2.5">
                        @if (msg.biResponse.narrative) {
                          <p class="text-[13px] text-text-primary leading-[1.65]">{{ msg.biResponse.narrative }}</p>
                        }
                        @if (msg.biResponse.kpis.length) {
                          <div class="grid grid-cols-2 gap-2">
                            @for (kpi of msg.biResponse.kpis; track kpi.name) {
                              <div class="rounded-xl border bg-bg-elevated p-3 flex flex-col gap-0.5"
                                   [class.border-red-500/30]="kpi.isAlert"
                                   [class.border-border/50]="!kpi.isAlert">
                                <p class="text-[9px] text-text-muted uppercase tracking-wider truncate">{{ kpi.name }}</p>
                                <div class="flex items-baseline gap-1 mt-0.5">
                                  <p class="text-[13px] font-bold text-text-primary truncate">{{ formatKpiValue(kpi) }}</p>
                                  <span class="text-[11px] shrink-0" [class]="kpiTrendColor(kpi)">{{ kpiTrend(kpi) }}</span>
                                </div>
                                <p class="text-[9px] text-text-muted mt-0.5">
                                  {{ kpi.unit !== 'COP' ? kpi.unit + ' · ' : '' }}{{ kpi.period }}
                                  @if (kpi.variationPct !== null) {
                                    · {{ kpi.variationPct > 0 ? '+' : '' }}{{ kpi.variationPct }}%
                                  }
                                </p>
                              </div>
                            }
                          </div>
                        }
                        @if (msg.biResponse.recommendations.length) {
                          <div class="rounded-xl border border-border/50 bg-bg-elevated overflow-hidden">
                            <div class="px-3.5 py-2 border-b border-border/40">
                              <span class="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Recomendaciones</span>
                            </div>
                            <ul class="px-3.5 py-3 flex flex-col gap-1.5">
                              @for (rec of msg.biResponse.recommendations; track $index) {
                                <li class="text-[12px] text-text-secondary flex gap-2 items-start">
                                  <ng-icon name="lucideArrowRight" size="10" class="text-violet-400 mt-0.5 shrink-0" />{{ rec }}
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
                        <div class="rounded-xl border border-yellow-500/25 bg-bg-elevated overflow-hidden">
                          <div class="px-3.5 py-2 border-b border-yellow-500/20 flex items-center justify-between">
                            <span class="text-[10px] font-semibold text-yellow-400 uppercase tracking-wider">Imagen transformada</span>
                            <span class="text-[11px] text-green-400 font-medium">
                              +{{ msg.enhancementResult.overallQualityImprovement | number:'1.0-0' }} pts
                            </span>
                          </div>
                          <div class="p-3 flex flex-col gap-2">
                            <div class="rounded-lg overflow-hidden border border-border/50">
                              <img [src]="'data:image/jpeg;base64,' + msg.enhancementResult.enhancedImages[0].enhancedBase64"
                                   alt="Imagen mejorada" class="w-full max-h-52 object-contain bg-white" />
                            </div>
                            <p class="text-[10px] text-text-muted">{{ msg.enhancementResult.enhancedImages[0].modificationSummary }}</p>
                            <div class="flex gap-2">
                              <button (click)="saveEnhancedImageToGallery(msg.enhancementResult.enhancedImages[0].enhancedBase64)"
                                      class="flex items-center gap-1.5 flex-1 justify-center py-1.5 rounded-lg
                                             bg-yellow-500/15 border border-yellow-500/30 text-[11px] text-yellow-300
                                             hover:bg-yellow-500/25 font-medium transition-colors">
                                <ng-icon name="lucideImagePlus" size="11" />Guardar en galería
                              </button>
                              <a [href]="'data:image/jpeg;base64,' + msg.enhancementResult.enhancedImages[0].enhancedBase64"
                                 download="producto-mejorado.jpg"
                                 class="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/50
                                        text-[11px] text-text-muted hover:text-text-secondary transition-colors">
                                <ng-icon name="lucideDownload" size="11" />
                              </a>
                            </div>
                          </div>
                        </div>
                      }
                      @if (msg.enhancementResult.promotionalImageBase64) {
                        <div class="rounded-xl border border-purple-500/25 bg-bg-elevated overflow-hidden">
                          <div class="px-3.5 py-2 border-b border-purple-500/20">
                            <span class="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">Imagen promocional</span>
                          </div>
                          <div class="p-3 flex flex-col gap-2">
                            <div class="rounded-lg overflow-hidden border border-border/50">
                              <img [src]="'data:image/jpeg;base64,' + msg.enhancementResult.promotionalImageBase64"
                                   alt="Imagen promocional" class="w-full max-h-52 object-contain bg-white" />
                            </div>
                            <button (click)="saveEnhancedImageToGallery(msg.enhancementResult.promotionalImageBase64!)"
                                    class="flex items-center gap-1.5 justify-center py-1.5 rounded-lg
                                           bg-purple-500/10 border border-purple-500/30 text-[11px] text-purple-300
                                           hover:bg-purple-500/20 font-medium transition-colors">
                              <ng-icon name="lucideImagePlus" size="11" />Guardar imagen promocional
                            </button>
                          </div>
                        </div>
                      }
                    }

                  </div>
                </div>
              }
            }

            <!-- Loading indicator (like Vercel's ThinkingMessage) -->
            @if (loading() || enhancing()) {
              <div class="flex gap-2.5">
                <div class="w-6 h-6 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  @if (enhancing()) { <span class="text-xs">🍌</span> }
                  @else { <ng-icon name="lucideSparkles" size="11" class="text-violet-400" /> }
                </div>
                <div class="pt-1 flex flex-col gap-1">
                  @if (enhancing()) {
                    <p class="text-[11px] text-yellow-400 mb-1">Nano Banana procesando imagen…</p>
                  }
                  <app-ai-typing-indicator />
                </div>
              </div>
            }

            <!-- Error -->
            @if (error()) {
              <div class="px-3.5 py-2.5 rounded-xl bg-red-500/8 border border-red-500/20 text-[12px] text-red-400">
                {{ error() }}
              </div>
            }

          </div>
        }
      </div>

      <!-- ── Input bar — Vercel PromptInput style ────────────── -->
      <div class="px-4 py-3 border-t border-border/40 bg-bg-base shrink-0">
        <input #imgFileRef type="file" accept="image/jpeg,image/png,image/webp" class="hidden"
               (change)="onImageSelect($event)" />

        <div class="rounded-2xl border border-border/60 bg-bg-elevated
                    focus-within:border-border transition-colors">
          <div class="flex items-center gap-1.5 px-3 py-2.5">
            <button type="button" (click)="imgFileRef.click()" [disabled]="loading() || enhancing()"
                    title="Subir imagen"
                    class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                           text-text-muted hover:text-text-secondary hover:bg-bg-subtle
                           disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ng-icon name="lucidePaperclip" size="14" />
            </button>
            <input type="text" [(ngModel)]="userMessage" (keydown.enter)="sendMessage()"
                   [disabled]="loading() || enhancing()"
                   placeholder="Pregunta sobre tu producto…"
                   class="flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-muted
                          outline-none border-none min-w-0 disabled:opacity-50" />
            <button (click)="sendMessage()" [disabled]="loading() || enhancing() || !userMessage.trim()"
                    class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                           bg-text-primary hover:opacity-80
                           disabled:opacity-20 disabled:cursor-not-allowed transition-all">
              <ng-icon name="lucideArrowUp" size="14" class="text-bg-base" />
            </button>
          </div>
        </div>

        <p class="text-[10px] text-text-muted text-center mt-1.5 opacity-60">
          Enter para enviar
        </p>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slide-in-right {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }
    .animate-slide-in-right { animation: slide-in-right 0.22s cubic-bezier(0.16,1,0.3,1); }
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
