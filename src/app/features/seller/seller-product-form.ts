import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormControl, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { from, of, switchMap, concatMap, catchError } from 'rxjs';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';
import { SellerProductService } from '../../core/seller/seller-product.service';
import { CategoryService } from '../../core/catalog/category.service';
import { Category } from '../../shared/models/catalog.models';
import { ProductImageResponse } from '../../shared/models/product.models';
import { AiProductChatComponent, AiProductChatInput, ApplyDescriptionEvent } from './product-assistant/ai-product-chat.component';

type Condition = 'NUEVO' | 'USADO' | 'REACONDICIONADO';

interface GalleryItem {
  id: string;
  previewUrl: string;
  primary: boolean;
  file?: File;
  externalUrl?: string;
}

@Component({
  selector: 'app-seller-product-form',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, NgIcon, CopCurrencyPipe, AiProductChatComponent],
  template: `
    <div class="relative">
      <!-- Ambient backdrop -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden -z-[1]">
        <div class="neo-grid-bg absolute inset-0 opacity-20"></div>
        <span class="neo-orb red"  style="width:500px;height:500px;top:-15%;right:-8%;opacity:0.09;"></span>
        <span class="neo-orb cyan" style="width:360px;height:360px;bottom:5%;left:-5%;opacity:0.07;animation-delay:2s;"></span>
      </div>

      <div class="relative max-w-[1160px] mx-auto">

        <!-- Breadcrumb + header -->
        <div class="neo-reveal mb-7">
          <div class="flex items-center gap-1.5 text-xs text-text-muted mb-3">
            <a routerLink="/seller/dashboard" class="hover:text-text-primary transition-colors">Seller</a>
            <ng-icon name="lucideChevronRight" size="11" />
            <a routerLink="/seller/products" class="hover:text-text-primary transition-colors">Productos</a>
            <ng-icon name="lucideChevronRight" size="11" />
            <span class="text-text-secondary font-medium">{{ productId() ? 'Editar' : 'Nuevo producto' }}</span>
          </div>
          <div class="flex flex-wrap justify-between items-end gap-4">
            <div>
              <p class="neo-stat-label">{{ productId() ? 'Editar publicación' : '¿Qué vas a publicar hoy?' }}</p>
              <h1 class="font-display text-[30px] font-bold tracking-[-0.02em] text-text-primary mt-1">
                {{ productId() ? 'Actualizar producto' : 'Nueva publicación' }}
              </h1>
            </div>
            <!-- Checklist mini desktop -->
            <div class="hidden lg:flex items-center gap-2">
              @for (item of checklist(); track $index) {
                <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all"
                     [style.border-color]="item.ok ? 'rgba(0,200,120,0.4)' : 'var(--color-border)'"
                     [style.background]="item.ok ? 'rgba(0,200,120,0.06)' : 'transparent'">
                  <span class="w-3 h-3 rounded-full flex items-center justify-center shrink-0"
                    [style.background]="item.ok ? 'var(--color-success)' : 'var(--color-bg-elevated)'"
                    [style.border]="item.ok ? 'none' : '1px solid var(--color-border)'">
                    @if (item.ok) { <ng-icon name="lucideCheck" size="7" class="text-bg-base" /> }
                  </span>
                  <span class="text-[11px] font-medium"
                    [style.color]="item.ok ? 'var(--color-success)' : 'var(--color-text-muted)'">
                    {{ item.label }}
                  </span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Alerts -->
        @if (formError()) {
          <div class="mb-5 flex items-center gap-2.5 rounded-[10px] bg-error/10 border border-error/30
                      px-4 py-3 text-sm text-error neo-reveal">
            <ng-icon name="lucideTriangleAlert" size="15" /><span>{{ formError() }}</span>
          </div>
        }
        @if (formSuccess()) {
          <div class="mb-5 flex items-center gap-2.5 rounded-[10px] bg-success/10 border border-success/30
                      px-4 py-3 text-sm text-success neo-reveal">
            <ng-icon name="lucideCircleCheck" size="15" /><span>Producto guardado correctamente</span>
          </div>
        }

        <!-- Two-column layout -->
        <form [formGroup]="form" (ngSubmit)="save()" novalidate>
          <div class="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5 items-start">

            <!-- ══ LEFT — product details ══════════════════════════════ -->
            <div class="flex flex-col gap-4 min-w-0">
              <div class="neo-card-premium p-5 flex flex-col gap-5">

                <!-- section header -->
                <div class="flex items-center gap-3 pb-3 border-b border-border">
                  <div class="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
                    <ng-icon name="lucidePackage" size="15" class="text-accent" />
                  </div>
                  <div>
                    <h2 class="text-[13px] font-semibold text-text-primary">Detalles del Producto</h2>
                    <p class="text-[11px] text-text-muted mt-0.5">Información esencial para el catálogo de NeoGaming.</p>
                  </div>
                </div>

                <!-- Título -->
                <div>
                  <label class="block text-[11px] font-semibold text-text-muted mb-1.5 uppercase tracking-[0.07em]">
                    Título del producto
                  </label>
                  <input type="text" formControlName="name"
                    placeholder="Ej: Teclado Mecánico Corsair K70 RGB MK.2"
                    class="w-full rounded-[10px] bg-bg-elevated border px-3.5 py-2.5 text-[14px]
                           text-text-primary placeholder:text-text-muted outline-none
                           focus:border-accent/60 focus:ring-[3px] focus:ring-accent/8 transition-all"
                    [style.border-color]="isInvalid('name') ? 'var(--color-error)' : 'var(--color-border)'" />
                  @if (isInvalid('name')) {
                    <p class="mt-1 text-xs text-error flex items-center gap-1">
                      <ng-icon name="lucideTriangleAlert" size="11" />El nombre es requerido
                    </p>
                  }
                </div>

                <!-- Categoría -->
                <div>
                  <label class="block text-[11px] font-semibold text-text-muted mb-1.5 uppercase tracking-[0.07em]">
                    Categoría del producto
                  </label>
                  <div class="relative">
                    <select formControlName="categoryId"
                      class="w-full appearance-none rounded-[10px] bg-bg-elevated border px-3.5 py-2.5 text-[14px]
                             text-text-primary outline-none focus:border-accent/60 focus:ring-[3px] focus:ring-accent/8
                             transition-all pr-9"
                      [style.border-color]="isInvalid('categoryId') ? 'var(--color-error)' : 'var(--color-border)'">
                      <option value="">Categorías</option>
                      @for (cat of categories(); track cat.id) {
                        <option [value]="cat.id">{{ cat.name }}</option>
                        @for (sub of cat.children; track sub.id) {
                          <option [value]="sub.id">— {{ sub.name }}</option>
                        }
                      }
                    </select>
                    <ng-icon name="lucideChevronRight" size="14"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none rotate-90" />
                  </div>
                </div>

                <!-- Condición -->
                <div>
                  <label class="block text-[11px] font-semibold text-text-muted mb-2 uppercase tracking-[0.07em]">
                    Condición del equipo
                  </label>
                  <div class="grid grid-cols-3 gap-2.5">
                    @for (opt of conditionOpts; track opt.value) {
                      <button type="button" (click)="condition.set(opt.value)"
                        class="relative flex flex-col items-center gap-1 py-3 rounded-[10px] border text-[12px]
                               font-semibold transition-all duration-200 overflow-hidden"
                        [style.border-color]="condition() === opt.value ? opt.color : 'var(--color-border)'"
                        [style.background]="condition() === opt.value ? opt.bg : 'var(--color-bg-elevated)'"
                        [style.color]="condition() === opt.value ? opt.color : 'var(--color-text-muted)'">
                        @if (condition() === opt.value) {
                          <span class="absolute inset-0 pointer-events-none"
                            [style.background]="'radial-gradient(circle at 50% 0%,' + opt.color + ',transparent 65%)'"
                            style="opacity:.18;filter:blur(12px);"></span>
                        }
                        <ng-icon [name]="opt.icon" size="16" class="relative z-[1]" />
                        <span class="relative z-[1] tracking-[0.04em]">{{ opt.label }}</span>
                      </button>
                    }
                  </div>
                </div>

                <!-- Marca + SKU -->
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[11px] font-semibold text-text-muted mb-1.5 uppercase tracking-[0.07em]">Marca</label>
                    <input type="text" formControlName="brand"
                      placeholder="Ej: Corsair, Razer, NVIDIA"
                      class="w-full rounded-[10px] bg-bg-elevated border border-border px-3.5 py-2.5 text-[14px]
                             text-text-primary placeholder:text-text-muted outline-none
                             focus:border-accent/60 focus:ring-[3px] focus:ring-accent/8 transition-all"
                      [class.!border-error]="isInvalid('brand')" />
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-text-muted mb-1.5 uppercase tracking-[0.07em]">SKU</label>
                    <input type="text" formControlName="sku"
                      placeholder="Ej: K70-MK2, DA-V3"
                      class="w-full rounded-[10px] bg-bg-elevated border border-border px-3.5 py-2.5 text-[14px]
                             text-text-primary placeholder:text-text-muted outline-none
                             focus:border-accent/60 focus:ring-[3px] focus:ring-accent/8 transition-all"
                      [class.!border-error]="isInvalid('sku')" />
                  </div>
                </div>

                <!-- Precio + IVA -->
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[11px] font-semibold text-text-muted mb-1.5 uppercase tracking-[0.07em]">Precio</label>
                    <div class="relative">
                      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-text-muted font-mono">$</span>
                      <input type="number" formControlName="basePrice" min="0"
                        class="w-full rounded-[10px] bg-bg-elevated border border-border pl-7 pr-3.5 py-2.5 text-[14px]
                               text-text-primary outline-none focus:border-accent/60 focus:ring-[3px] focus:ring-accent/8 transition-all"
                        [class.!border-error]="isInvalid('basePrice')" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-[11px] font-semibold text-text-muted mb-1.5 uppercase tracking-[0.07em]">IVA aplicado</label>
                    <div class="relative">
                      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-text-muted font-mono">%</span>
                      <select formControlName="ivaPercent"
                        class="w-full appearance-none rounded-[10px] bg-bg-elevated border border-border
                               pl-7 pr-8 py-2.5 text-[14px] text-text-primary outline-none
                               focus:border-accent/60 focus:ring-[3px] focus:ring-accent/8 transition-all">
                        <option [value]="0">0 — Excluido</option>
                        <option [value]="5">5</option>
                        <option [value]="19">19 — General</option>
                      </select>
                      <ng-icon name="lucideChevronRight" size="13"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none rotate-90" />
                    </div>
                  </div>
                </div>

                <!-- Price preview -->
                <div class="relative rounded-[10px] overflow-hidden border border-dashed border-neon-cyan/20 bg-neon-cyan/[0.03] px-4 py-3 flex items-center justify-between">
                  <div class="absolute inset-0 pointer-events-none"
                    style="background:radial-gradient(ellipse at 0% 50%,rgba(0,212,255,0.12),transparent 60%);"></div>
                  <div class="relative">
                    <p class="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted font-mono">Precio final al cliente</p>
                    <p class="text-[11px] text-text-muted mt-0.5">Base × (1 + IVA%) — lo que paga el comprador</p>
                  </div>
                  <span class="relative font-display text-[24px] font-bold text-neon-cyan">
                    @if (previewPrice() > 0) { {{ previewPrice() | copCurrency }} } @else { — }
                  </span>
                </div>

                <!-- Stock inicial (solo en creación) -->
                @if (!productId()) {
                  <div>
                    <label class="block text-[11px] font-semibold text-text-muted mb-1.5 uppercase tracking-[0.07em]">
                      Stock inicial <span class="text-text-muted font-normal normal-case">(unidades disponibles)</span>
                    </label>
                    <input type="number" formControlName="initialStock" min="0"
                      class="w-full rounded-[10px] bg-bg-elevated border border-border px-3 py-2.5 text-sm text-text-primary
                             outline-none focus:border-accent transition-colors" />
                  </div>
                }

                <!-- Descripción -->
                <div>
                  <label class="block text-[11px] font-semibold text-text-muted mb-1.5 uppercase tracking-[0.07em]">
                    Descripción del producto
                  </label>
                  <textarea formControlName="description" rows="4"
                    placeholder="Especificaciones técnicas, qué incluye, para qué juegos o uso es ideal…"
                    class="w-full rounded-[10px] bg-bg-elevated border border-border px-3.5 py-2.5 text-[14px]
                           text-text-primary placeholder:text-text-muted outline-none
                           focus:border-accent/60 focus:ring-[3px] focus:ring-accent/8 transition-all resize-none"
                    [class.!border-error]="isInvalid('description')"></textarea>
                  @if (isInvalid('description')) {
                    <p class="mt-1 text-xs text-error flex items-center gap-1">
                      <ng-icon name="lucideTriangleAlert" size="11" />La descripción es requerida
                    </p>
                  }
                  <!-- AI assist trigger -->
                  <div class="flex items-center gap-3 mt-2.5">
                    <button type="button" (click)="aiPanelOpen.set(true)"
                      class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-500/30
                             bg-violet-500/5 text-xs font-medium text-violet-400
                             hover:bg-violet-500/12 hover:border-violet-500/50 transition-all shrink-0">
                      <ng-icon name="lucideSparkles" size="12" />
                      Mejorar con IA
                    </button>
                    <p class="text-[11px] text-text-muted">Sugerencias de título y descripción generadas por IA</p>
                  </div>
                </div>

                <!-- Características -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <label class="text-[11px] font-semibold text-text-muted uppercase tracking-[0.07em]">
                      Características del producto
                    </label>
                    <button type="button" (click)="addSpec()"
                      class="flex items-center gap-1 text-[11px] font-medium text-accent hover:opacity-80 transition-opacity">
                      <ng-icon name="lucidePlus" size="12" />
                      Añadir
                    </button>
                  </div>

                  @if (specs().length === 0) {
                    <p class="text-[12px] text-text-muted py-2">
                      Sin características. Añade atributos como Marca, Color, Conectividad, etc.
                    </p>
                  } @else {
                    <div class="flex flex-col gap-2">
                      @for (spec of specs(); track $index; let i = $index) {
                        <div class="flex items-center gap-2">
                          <input type="text" [value]="spec.key"
                            (input)="updateSpec(i, 'key', $any($event.target).value)"
                            placeholder="Ej: Color"
                            class="w-[38%] rounded-[8px] bg-bg-elevated border border-border px-3 py-2 text-[13px]
                                   text-text-primary placeholder:text-text-muted outline-none
                                   focus:border-accent/60 transition-all" />
                          <input type="text" [value]="spec.value"
                            (input)="updateSpec(i, 'value', $any($event.target).value)"
                            placeholder="Ej: Negro"
                            class="flex-1 rounded-[8px] bg-bg-elevated border border-border px-3 py-2 text-[13px]
                                   text-text-primary placeholder:text-text-muted outline-none
                                   focus:border-accent/60 transition-all" />
                          <button type="button" (click)="removeSpec(i)"
                            class="p-1.5 text-text-muted hover:text-error transition-colors shrink-0">
                            <ng-icon name="lucideTrash2" size="13" />
                          </button>
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- Action bar -->
              <div class="flex items-center gap-3 pb-6">
                <button type="submit" [disabled]="saving()"
                  class="neo-btn-primary !py-3 !px-7 disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center gap-2 text-[14px]">
                  @if (saving()) {
                    <ng-icon name="lucideRefreshCw" size="14" class="animate-spin" />
                    Guardando…
                  } @else {
                    <ng-icon name="lucideCheck" size="14" />
                    {{ productId() ? 'Guardar cambios' : 'Publicar producto' }}
                  }
                </button>
                <a routerLink="/seller/products" class="neo-btn-outline !py-3 !px-5 text-[14px]">
                  Cancelar
                </a>
                <!-- Checklist dots mobile -->
                <div class="lg:hidden ml-auto flex items-center gap-1.5">
                  @for (item of checklist(); track $index) {
                    <span class="w-2 h-2 rounded-full"
                      [style.background]="item.ok ? 'var(--color-success)' : 'var(--color-border)'"></span>
                  }
                </div>
              </div>
            </div><!-- /left -->

            <!-- ══ RIGHT — images + preview + checklist ════════════════ -->
            <div class="flex flex-col gap-4" style="position:sticky;top:88px;">

              <!-- IMAGE GALLERY CARD -->
              <div class="neo-card-premium overflow-hidden">
                <!-- header -->
                <div class="relative px-5 pt-5 pb-4 border-b border-border">
                  <div class="absolute inset-0 pointer-events-none"
                    style="background:radial-gradient(ellipse at 70% -20%,rgba(0,212,255,0.12),transparent 60%);"></div>
                  <div class="relative flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
                        <ng-icon name="lucideImage" size="15" class="text-neon-cyan" />
                      </div>
                      <div>
                        <p class="text-[13px] font-semibold text-text-primary">Galería de imágenes</p>
                        <p class="text-[11px] text-text-muted mt-0.5">La primera imagen será la portada.</p>
                      </div>
                    </div>
                    <span class="text-[11px] font-mono text-text-muted">
                      {{ galleryCount() }}/6
                    </span>
                  </div>
                </div>

                <div class="p-5 flex flex-col gap-4">

                  <!-- Gallery grid -->
                  @if (galleryCount() > 0) {
                    <div class="grid grid-cols-3 gap-2.5">
                      @for (item of galleryItems(); track item.id; let i = $index) {
                        <div class="relative group aspect-square rounded-[10px] overflow-hidden transition-all duration-200"
                          [style.border]="item.primary ? '2px solid var(--color-accent)' : '1px solid var(--color-border)'"
                          [style.box-shadow]="item.primary ? '0 0 16px rgba(255,0,60,0.2)' : 'none'">
                          <img [src]="item.previewUrl" alt="img {{ i+1 }}" class="w-full h-full object-cover" />
                          @if (item.primary) {
                            <span class="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded
                                         bg-accent text-white tracking-[0.05em]">PORTADA</span>
                          }
                          <!-- Hover overlay -->
                          <div class="absolute inset-0 bg-bg-base/75 backdrop-blur-[2px] opacity-0
                                      group-hover:opacity-100 transition-opacity flex flex-col items-center
                                      justify-center gap-1.5 p-2">
                            @if (!item.primary) {
                              <button type="button" (click)="setPrimary(item.id)"
                                class="w-full py-1 rounded-[6px] text-[10px] font-semibold
                                       bg-accent text-white hover:bg-accent/80 transition-colors">
                                Portada
                              </button>
                            }
                            <button type="button" (click)="removeImage(item.id)"
                              class="w-full py-1 rounded-[6px] text-[10px] font-semibold
                                     bg-error/20 text-error border border-error/30
                                     hover:bg-error/30 transition-colors">
                              Eliminar
                            </button>
                          </div>
                        </div>
                      }
                      <!-- Add slot -->
                      @if (galleryCount() < 6) {
                        <div class="aspect-square rounded-[10px] border border-dashed border-border
                                    flex flex-col items-center justify-center gap-1 text-text-muted
                                    hover:border-neon-cyan/40 hover:text-neon-cyan hover:bg-neon-cyan/5
                                    transition-all cursor-pointer"
                             (click)="triggerAdd()">
                          <ng-icon name="lucidePlus" size="18" />
                          <span class="text-[10px] font-medium">Agregar</span>
                        </div>
                      }
                    </div>
                  } @else {
                    <!-- Empty hint -->
                    <div class="flex flex-col items-center gap-2 py-4 text-text-muted">
                      <ng-icon name="lucideImageUp" size="28" class="opacity-40" />
                      <p class="text-[12px]">Aún no hay imágenes</p>
                    </div>
                  }

                  <!-- Mode toggle -->
                  <div class="flex rounded-[10px] border border-border overflow-hidden bg-bg-elevated p-0.5 gap-0.5">
                    <button type="button" (click)="imgMode.set('url')"
                      class="flex-1 py-2 text-[12px] font-semibold flex items-center justify-center gap-1.5 rounded-[8px] transition-all"
                      [style.background]="imgMode() === 'url' ? 'rgba(255,0,60,0.12)' : 'transparent'"
                      [style.color]="imgMode() === 'url' ? 'var(--color-accent)' : 'var(--color-text-muted)'">
                      <ng-icon name="lucideLink" size="12" />URL
                    </button>
                    <button type="button" (click)="imgMode.set('file')"
                      class="flex-1 py-2 text-[12px] font-semibold flex items-center justify-center gap-1.5 rounded-[8px] transition-all"
                      [style.background]="imgMode() === 'file' ? 'rgba(0,212,255,0.1)' : 'transparent'"
                      [style.color]="imgMode() === 'file' ? '#00D4FF' : 'var(--color-text-muted)'">
                      <ng-icon name="lucideUploadCloud" size="12" />Subir archivo
                    </button>
                  </div>

                  <!-- URL input -->
                  @if (imgMode() === 'url') {
                    @if (imageError()) {
                      <p class="text-xs text-error -mb-1 flex items-center gap-1">
                        <ng-icon name="lucideTriangleAlert" size="11" />{{ imageError() }}
                      </p>
                    }
                    <div class="flex gap-2">
                      <input #urlInputRef type="url" [formControl]="imageUrlControl"
                        placeholder="https://cdn.ejemplo.com/imagen.jpg"
                        class="flex-1 rounded-[10px] bg-bg-elevated border border-border px-3 py-2 text-[13px]
                               text-text-primary placeholder:text-text-muted outline-none min-w-0
                               focus:border-neon-cyan/50 focus:ring-[3px] focus:ring-neon-cyan/8 transition-all" />
                      <button type="button" (click)="addFromUrl()" [disabled]="addingImage()"
                        class="shrink-0 px-3.5 py-2 rounded-[10px] border border-neon-cyan/30 text-[12px] font-semibold
                               text-neon-cyan bg-neon-cyan/8 hover:bg-neon-cyan/15 disabled:opacity-40
                               disabled:cursor-not-allowed transition-all flex items-center gap-1.5">
                        @if (addingImage()) {
                          <ng-icon name="lucideRefreshCw" size="12" class="animate-spin" />
                        } @else {
                          <ng-icon name="lucideLink" size="12" />
                        }
                        Añadir
                      </button>
                    </div>
                  }

                  <!-- File upload zone -->
                  @if (imgMode() === 'file') {
                    <div class="relative rounded-[12px] border-2 flex flex-col items-center
                                justify-center py-8 gap-3 cursor-pointer overflow-hidden transition-all duration-200"
                         [style.border-color]="dragOver() ? '#00D4FF' : 'rgba(0,212,255,0.22)'"
                         [style.background]="dragOver() ? 'rgba(0,212,255,0.07)' : 'rgba(0,212,255,0.03)'"
                         [style.border-style]="'dashed'"
                         (click)="fileInputRef.click()"
                         (dragover)="onDragOver($event)"
                         (dragleave)="dragOver.set(false)"
                         (drop)="onDrop($event)">
                      <div class="absolute inset-0 pointer-events-none"
                        style="background:radial-gradient(ellipse at 50% 0%,rgba(0,212,255,0.10),transparent 55%);"></div>
                      <div class="relative w-12 h-12 rounded-2xl bg-bg-elevated border border-neon-cyan/20
                                  flex items-center justify-center"
                           [style.box-shadow]="dragOver() ? '0 0 24px rgba(0,212,255,0.25)' : '0 0 16px rgba(0,212,255,0.10)'">
                        @if (addingImage()) {
                          <ng-icon name="lucideRefreshCw" size="20" class="text-neon-cyan animate-spin" />
                        } @else {
                          <ng-icon name="lucideUploadCloud" size="20" class="text-neon-cyan" />
                        }
                      </div>
                      <div class="relative text-center">
                        @if (addingImage()) {
                          <p class="text-[13px] font-semibold text-neon-cyan">Subiendo imagen…</p>
                        } @else {
                          <p class="text-[13px] font-semibold text-text-secondary">Haz clic o arrastra aquí</p>
                          <p class="text-[11px] text-text-muted mt-0.5">JPG, PNG, WEBP · Máx 5 MB por imagen</p>
                        }
                      </div>
                      <input #fileInputRef type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                             multiple class="hidden" (change)="onFileSelect($event)" />
                    </div>
                    @if (imageError()) {
                      <p class="text-xs text-error -mt-1 flex items-center gap-1">
                        <ng-icon name="lucideTriangleAlert" size="11" />{{ imageError() }}
                      </p>
                    }
                  }

                  <p class="text-[11px] text-text-muted -mt-1">
                    Mínimo 1, máximo 6 imágenes. La primera es la portada.
                  </p>
                </div>
              </div>

              <!-- PREVIEW CARD -->
              <div class="neo-card-premium p-4">
                <p class="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-muted font-mono mb-3">
                  Vista previa en catálogo
                </p>
                <div class="rounded-[10px] overflow-hidden bg-bg-base border border-border">
                  <div class="aspect-video bg-bg-elevated flex items-center justify-center text-text-muted overflow-hidden">
                    @if (previewImage()) {
                      <img [src]="previewImage()!" alt="" class="w-full h-full object-cover" />
                    } @else {
                      <div class="flex flex-col items-center gap-2 text-text-muted">
                        <ng-icon name="lucideImage" size="28" />
                        <span class="text-[11px]">Sin imagen</span>
                      </div>
                    }
                  </div>
                  <div class="p-3">
                    <p class="font-mono text-[9px] uppercase tracking-[0.1em] text-text-muted">
                      {{ form.value.brand || 'Marca' }}
                    </p>
                    <p class="text-[12px] font-medium text-text-primary leading-snug mt-0.5 line-clamp-2">
                      {{ form.value.name || 'Nombre del producto' }}
                    </p>
                    <p class="font-display text-[16px] font-bold mt-1.5"
                       [style.color]="previewPrice() > 0 ? 'var(--color-accent)' : 'var(--color-text-muted)'">
                      @if (previewPrice() > 0) { {{ previewPrice() | copCurrency }} } @else { — }
                    </p>
                  </div>
                </div>
              </div>

              <!-- CHECKLIST -->
              <div class="neo-card-premium p-4">
                <p class="text-[12px] font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <ng-icon name="lucideListChecks" size="14" class="text-text-muted" />
                  Checklist de publicación
                </p>
                <div class="flex flex-col gap-1">
                  @for (item of checklist(); track $index) {
                    <div class="flex items-center gap-2.5 py-[5px] rounded-[8px] px-1 transition-colors"
                         [style.background]="item.ok ? 'rgba(0,200,120,0.05)' : 'transparent'">
                      <span class="w-[18px] h-[18px] rounded-full shrink-0 flex items-center justify-center"
                        [style.background]="item.ok ? 'var(--color-success)' : 'var(--color-bg-elevated)'"
                        [style.border]="item.ok ? 'none' : '1px solid var(--color-border)'">
                        @if (item.ok) { <ng-icon name="lucideCheck" size="9" class="text-bg-base" /> }
                      </span>
                      <span class="text-[12px]"
                        [style.color]="item.ok ? 'var(--color-success)' : 'var(--color-text-muted)'">
                        {{ item.label }}
                      </span>
                    </div>
                  }
                </div>
              </div>

            </div><!-- /right -->
          </div>
        </form>
      </div>
    </div>

    <!-- AI Chat Panel -->
    @if (aiPanelOpen()) {
      <app-ai-product-chat
        [productInput]="aiProductInput()"
        [productId]="productId()"
        (close)="aiPanelOpen.set(false)"
        (applyContent)="onApplyContent($event)"
        (saveImage)="onSaveAiImage($event)"
      />
    }
  `,
})
export class SellerProductFormComponent implements OnInit {
  private route           = inject(ActivatedRoute);
  private router          = inject(Router);
  private productService  = inject(SellerProductService);
  private categoryService = inject(CategoryService);
  private fb              = inject(FormBuilder);

  productId   = signal<string | null>(null);
  categories  = signal<Category[]>([]);
  saving      = signal(false);
  formError   = signal<string | null>(null);
  formSuccess = signal(false);

  condition = signal<Condition>('NUEVO');
  readonly conditionOpts: { value: Condition; label: string; icon: string; color: string; bg: string }[] = [
    { value: 'NUEVO',           label: 'Nuevo',           icon: 'lucideSparkles',  color: '#00C878', bg: 'rgba(0,200,120,0.08)'  },
    { value: 'USADO',           label: 'Usado',           icon: 'lucideRefreshCw', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
    { value: 'REACONDICIONADO', label: 'Reacondicionado', icon: 'lucideShield',    color: '#00D4FF', bg: 'rgba(0,212,255,0.08)'  },
  ];

  // Images – existing product
  images = signal<ProductImageResponse[]>([]);

  // Images – new product (buffered until save)
  pendingImages = signal<GalleryItem[]>([]);

  imgMode       = signal<'url' | 'file'>('url');
  dragOver      = signal(false);
  addingImage   = signal(false);
  imageError    = signal<string | null>(null);
  imageUrlControl: FormControl<string> = this.fb.nonNullable.control('');

  // ── computed ──────────────────────────────────────────────

  galleryItems = computed<GalleryItem[]>(() => {
    if (this.productId()) {
      return this.images().map(img => ({
        id: img.id,
        previewUrl: img.url,
        primary: img.primary,
      }));
    }
    return this.pendingImages();
  });

  galleryCount = computed(() => this.galleryItems().length);

  previewImage = computed(() => {
    const items = this.galleryItems();
    if (!items.length) return null;
    return items.find(i => i.primary)?.previewUrl ?? items[0]?.previewUrl ?? null;
  });

  previewPrice = computed(() => {
    const raw = this.form.getRawValue();
    const base = Number(raw.basePrice) || 0;
    return base > 0 ? Math.round(base * (1 + Number(raw.ivaPercent) / 100)) : 0;
  });

  aiPanelOpen = signal(false);

  aiProductInput = computed<AiProductChatInput>(() => {
    const v = this.form.getRawValue();
    return {
      name: v.name,
      description: v.description,
      price: Number(v.basePrice) || 0,
      category: this.getCategoryName(v.categoryId),
      brand: v.brand,
    };
  });

  checklist = computed(() => {
    const v = this.form.getRawValue();
    return [
      { ok: this.galleryCount() > 0,                        label: 'Imágenes' },
      { ok: !!v.name,                                       label: 'Nombre del producto' },
      { ok: !!v.brand && !!v.categoryId,                    label: 'Marca y categoría' },
      { ok: !!v.description && v.description.length >= 20,  label: 'Descripción (≥ 20 caracteres)' },
      { ok: Number(v.basePrice) > 0,                        label: 'Precio base definido' },
    ];
  });

  form = this.fb.nonNullable.group({
    name:         ['', Validators.required],
    description:  [''],
    brand:        [''],
    sku:          [''],
    categoryId:   ['', Validators.required],
    basePrice:    [0, [Validators.required, Validators.min(1)]],
    ivaPercent:   [19, Validators.required],
    initialStock: [0, [Validators.min(0)]],
  });

  specs = signal<{ key: string; value: string }[]>([]);

  addSpec(): void { this.specs.update(s => [...s, { key: '', value: '' }]); }

  removeSpec(i: number): void { this.specs.update(s => s.filter((_, idx) => idx !== i)); }

  updateSpec(i: number, field: 'key' | 'value', val: string): void {
    this.specs.update(s => s.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  }

  private specsToRecord(): Record<string, string> {
    return Object.fromEntries(
      this.specs().filter(s => s.key.trim()).map(s => [s.key.trim(), s.value.trim()])
    );
  }

  onApplyContent(event: ApplyDescriptionEvent): void {
    if (event.seoTitle) this.form.patchValue({ name: event.seoTitle });
    if (event.description) this.form.patchValue({ description: event.description });
  }

  onSaveAiImage(base64: string): void {
    if (this.galleryCount() >= 6) return;
    const bytes = atob(base64);
    const ab = new ArrayBuffer(bytes.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < bytes.length; i++) ia[i] = bytes.charCodeAt(i);
    const file = new File([ab], 'nano-banana.jpg', { type: 'image/jpeg' });

    if (this.productId()) {
      this.addingImage.set(true);
      this.productService.uploadFile(file).pipe(
        switchMap(url => this.productService.addImage(this.productId()!, url)),
      ).subscribe({
        next: (res) => { this.images.update(imgs => [...imgs, res.data]); this.addingImage.set(false); },
        error: ()  => { this.addingImage.set(false); },
      });
    } else {
      const preview = URL.createObjectURL(file);
      this.pendingImages.update(imgs => [
        ...imgs,
        { id: crypto.randomUUID(), previewUrl: preview, file, primary: imgs.length === 0 },
      ]);
    }
  }

  private getCategoryName(categoryId: string): string {
    for (const cat of this.categories()) {
      if (cat.id === categoryId) return cat.name;
      for (const sub of (cat.children ?? [])) {
        if (sub.id === categoryId) return sub.name;
      }
    }
    return '';
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  // ── lifecycle ─────────────────────────────────────────────

  ngOnInit(): void {
    this.categoryService.getTree().subscribe({
      next: (res) => this.categories.set(res.data),
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productId.set(id);
      this.productService.getProduct(id).subscribe({
        next: (res) => {
          const p = res.data;
          this.form.patchValue({
            name: p.name, description: p.description, brand: p.brand,
            sku: p.sku, categoryId: p.categoryId,
            basePrice: p.basePrice, ivaPercent: p.ivaPercent,
          });
          if (p.condition) this.condition.set(p.condition as Condition);
          if (p.specifications) {
            this.specs.set(Object.entries(p.specifications).map(([key, value]) => ({ key, value })));
          }
          this.images.set(p.images ?? []);
        },
      });
    }
  }

  // ── image helpers ─────────────────────────────────────────

  triggerAdd(): void {
    if (this.imgMode() === 'file') {
      document.querySelector<HTMLInputElement>('input[type="file"]')?.click();
    }
  }

  addFromUrl(): void {
    const url = this.imageUrlControl.value.trim();
    if (!url) { this.imageError.set('Pega una URL válida'); return; }
    this.imageError.set(null);

    if (this.productId()) {
      this.addingImage.set(true);
      this.productService.addImage(this.productId()!, url).subscribe({
        next: (res) => {
          this.images.update(imgs => [...imgs, res.data]);
          this.imageUrlControl.reset('');
          this.addingImage.set(false);
        },
        error: (err) => {
          this.imageError.set(err.error?.message ?? 'URL inválida o inaccesible');
          this.addingImage.set(false);
        },
      });
    } else {
      if (this.galleryCount() >= 6) { this.imageError.set('Máximo 6 imágenes'); return; }
      this.pendingImages.update(imgs => [
        ...imgs,
        { id: crypto.randomUUID(), previewUrl: url, externalUrl: url, primary: imgs.length === 0 },
      ]);
      this.imageUrlControl.reset('');
    }
  }

  onFileSelect(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files?.length) this.addFiles(Array.from(files));
    (event.target as HTMLInputElement).value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files?.length) this.addFiles(Array.from(files));
  }

  private addFiles(files: File[]): void {
    this.imageError.set(null);
    const allowed = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);

    for (const file of files) {
      if (this.galleryCount() >= 6) { this.imageError.set('Máximo 6 imágenes'); break; }
      if (!allowed.has(file.type)) { this.imageError.set(`Tipo no permitido: ${file.name}`); continue; }
      if (file.size > 5 * 1024 * 1024) { this.imageError.set(`${file.name} supera los 5 MB`); continue; }

      const preview = URL.createObjectURL(file);

      if (this.productId()) {
        this.addingImage.set(true);
        this.productService.uploadFile(file).pipe(
          switchMap((url) => this.productService.addImage(this.productId()!, url)),
        ).subscribe({
          next: (res) => {
            URL.revokeObjectURL(preview);
            this.images.update(imgs => [...imgs, res.data]);
            this.addingImage.set(false);
          },
          error: (err) => {
            URL.revokeObjectURL(preview);
            this.imageError.set(err.error?.message ?? 'Error al subir la imagen');
            this.addingImage.set(false);
          },
        });
      } else {
        this.pendingImages.update(imgs => [
          ...imgs,
          { id: crypto.randomUUID(), previewUrl: preview, file, primary: imgs.length === 0 },
        ]);
      }
    }
  }

  setPrimary(imgId: string): void {
    if (this.productId()) {
      this.productService.setPrimaryImage(this.productId()!, imgId).subscribe({
        next: () => this.images.update(imgs => imgs.map(img => ({ ...img, primary: img.id === imgId }))),
      });
    } else {
      this.pendingImages.update(imgs => imgs.map(img => ({ ...img, primary: img.id === imgId })));
    }
  }

  removeImage(imgId: string): void {
    if (this.productId()) {
      this.productService.deleteImage(this.productId()!, imgId).subscribe({
        next: () => this.images.update(imgs => imgs.filter(img => img.id !== imgId)),
      });
    } else {
      const item = this.pendingImages().find(i => i.id === imgId);
      if (item?.previewUrl.startsWith('blob:')) URL.revokeObjectURL(item.previewUrl);
      this.pendingImages.update(imgs => {
        const kept = imgs.filter(i => i.id !== imgId);
        if (kept.length > 0 && !kept.some(i => i.primary)) kept[0] = { ...kept[0], primary: true };
        return kept;
      });
    }
  }

  // ── save ──────────────────────────────────────────────────

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError.set('Completa los campos obligatorios: nombre, categoría y precio.');
      return;
    }
    this.saving.set(true);
    this.formError.set(null);

    const raw = this.form.getRawValue();
    const request = {
      name: raw.name, description: raw.description, brand: raw.brand,
      sku: raw.sku, categoryId: raw.categoryId,
      basePrice: raw.basePrice, ivaPercent: raw.ivaPercent,
      condition: this.condition(),
      specifications: this.specsToRecord(),
    };

    if (this.productId()) {
      this.productService.update(this.productId()!, request).subscribe({
        next: () => {
          this.saving.set(false);
          this.formSuccess.set(true);
          setTimeout(() => this.formSuccess.set(false), 3000);
        },
        error: (err) => {
          this.formError.set(err.error?.message ?? 'Error al guardar');
          this.saving.set(false);
        },
      });
      return;
    }

    // Create → set initial stock → upload pending images → navigate to preview
    this.productService.create(request).subscribe({
      next: (res) => {
        const id = res.data.id;
        const pending = this.pendingImages();
        const initialStock = raw.initialStock ?? 0;

        if (initialStock > 0) {
          this.productService.adjustStock(id, { quantity: initialStock, notes: 'Stock inicial' })
            .subscribe({ error: () => {} });
        }

        if (pending.length === 0) {
          this.saving.set(false);
          this.router.navigate(['/seller/products', id, 'preview']);
          return;
        }

        from(pending).pipe(
          concatMap((img) => {
            const upload$ = img.file
              ? this.productService.uploadFile(img.file).pipe(
                  switchMap((url) => this.productService.addImage(id, url)),
                )
              : this.productService.addImage(id, img.externalUrl!);
            return upload$.pipe(catchError(() => of(null)));
          }),
        ).subscribe({
          complete: () => {
            this.saving.set(false);
            this.router.navigate(['/seller/products', id, 'preview']);
          },
          error: () => {
            this.saving.set(false);
            this.router.navigate(['/seller/products', id, 'preview']);
          },
        });
      },
      error: (err) => {
        this.formError.set(err.error?.message ?? 'Error al crear el producto');
        this.saving.set(false);
      },
    });
  }
}
