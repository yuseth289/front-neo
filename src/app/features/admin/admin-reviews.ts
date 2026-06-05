import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { AdminService } from '../../core/admin/admin.service';
import { ProductService } from '../../core/catalog/product.service';
import { Review, ProductSummary } from '../../shared/models/catalog.models';
import { ReviewStatus } from '../../shared/models/enums';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  styles: [`
    .review-card { transition: box-shadow 0.25s ease; }
    .review-card:hover {
      box-shadow: 0 0 0 1px rgba(var(--rating-rgb), 0.22),
                  0 8px 28px 0 rgba(var(--rating-rgb), 0.12);
    }
    .review-card:hover .rc-top-bar  { opacity: 1; }
    .review-card:hover .rc-orb      { opacity: 0.12 !important; }
    .review-card:hover .rc-avatar   {
      border-color: rgba(var(--rating-rgb), 0.5) !important;
      box-shadow: 0 0 10px 0 rgba(var(--rating-rgb), 0.28);
    }
    .review-card:hover .rc-rating-num {
      filter: drop-shadow(0 0 12px rgba(var(--rating-rgb), 0.55)) !important;
    }
    .review-card:hover .rc-body-border { border-left-color: rgba(var(--rating-rgb), 0.5) !important; }
  `],
  template: `
    <div class="relative">

      <!-- Ambient backdrop -->
      <div class="pointer-events-none absolute inset-0 overflow-hidden -z-[1]">
        <div class="neo-grid-bg absolute inset-0 opacity-30"></div>
        <div class="absolute -top-20 -right-20 w-[600px] h-[600px] rounded-full"
             style="background: radial-gradient(circle, #F59E0B 0%, transparent 65%); opacity: 0.06; filter: blur(2px)"></div>
        <div class="absolute top-[40%] -left-32 w-[480px] h-[480px] rounded-full"
             style="background: radial-gradient(circle, var(--color-accent) 0%, transparent 65%); opacity: 0.04"></div>
        <div class="absolute -bottom-16 right-1/4 w-[350px] h-[350px] rounded-full"
             style="background: radial-gradient(circle, var(--color-neon-cyan) 0%, transparent 70%); opacity: 0.035"></div>
      </div>

      <div class="relative max-w-3xl">

        <!-- ── Header ──────────────────────────────────────── -->
        <div class="neo-reveal mb-7">
          <div class="flex items-center justify-between gap-4 flex-wrap">
            <div class="flex items-center gap-4">
              <div class="relative shrink-0">
                <div class="absolute inset-0 rounded-2xl blur-xl"
                     style="background: #F59E0B; opacity: 0.18; transform: scale(1.4)"></div>
                <div class="relative w-12 h-12 rounded-2xl flex items-center justify-center border"
                     style="background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.3)">
                  <ng-icon name="lucideStar" size="21" style="color: #F59E0B" />
                </div>
              </div>
              <div>
                <p class="neo-stat-label">Admin</p>
                <h1 class="font-display text-[27px] font-bold tracking-[-0.025em] text-text-primary mt-0.5">
                  Reseñas
                </h1>
              </div>
            </div>

            <button (click)="toggleCreateForm()"
              class="flex items-center gap-1.5 px-4 py-2 rounded-full border text-[13px] font-semibold
                     transition-all duration-200 hover:brightness-110"
              [style.background]="showCreateForm() ? 'rgba(100,93,255,0.18)' : 'rgba(100,93,255,0.08)'"
              [style.border-color]="showCreateForm() ? 'rgba(100,93,255,0.55)' : 'rgba(100,93,255,0.28)'"
              [style.box-shadow]="showCreateForm() ? '0 0 16px 0 rgba(100,93,255,0.2)' : 'none'"
              style="color: var(--color-accent)">
              <ng-icon [name]="showCreateForm() ? 'lucideChevronUp' : 'lucidePlus'" size="14" />
              Nueva reseña
            </button>
          </div>
        </div>

        <!-- ── Status filter tabs ──────────────────────────── -->
        <div class="neo-reveal flex gap-1 p-1 rounded-xl border border-border mb-6"
             style="background: var(--color-bg-elevated)">
          @for (tab of statusTabs; track tab.value) {
            <button (click)="setStatus(tab.value)"
              class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
                     text-[12px] font-semibold transition-all duration-200"
              [style.background]="activeStatus() === tab.value ? 'var(--color-bg-surface)' : 'transparent'"
              [style.color]="activeStatus() === tab.value ? tab.color : 'var(--color-text-muted)'"
              [style.box-shadow]="activeStatus() === tab.value ? '0 1px 4px rgba(0,0,0,0.18)' : 'none'">
              <span class="w-1.5 h-1.5 rounded-full shrink-0"
                    [style.background]="activeStatus() === tab.value ? tab.color : 'var(--color-text-muted)'"></span>
              {{ tab.label }}
            </button>
          }
        </div>

        <!-- ── Create review form ──────────────────────────── -->
        @if (showCreateForm()) {
          <div class="neo-reveal mb-6 rounded-2xl overflow-hidden border"
               style="background: rgba(100,93,255,0.04); border-color: rgba(100,93,255,0.2);
                      box-shadow: 0 0 40px 0 rgba(100,93,255,0.08), inset 0 1px 0 rgba(255,255,255,0.04)">
            <div class="h-[3px]"
                 style="background: linear-gradient(90deg, var(--color-accent), var(--color-neon-cyan), var(--color-success))"></div>
            <div class="p-6">
              <div class="flex items-center justify-between gap-3 mb-6">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0"
                       style="background: rgba(100,93,255,0.1); border-color: rgba(100,93,255,0.25)">
                    <ng-icon name="lucidePencil" size="15" style="color: var(--color-accent)" />
                  </div>
                  <div>
                    <p class="text-[14px] font-bold text-text-primary leading-none">Crear reseña editorial</p>
                    <p class="text-[12px] text-text-muted mt-0.5">Se publica como aprobada de inmediato</p>
                  </div>
                </div>
                <div class="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border uppercase tracking-wider"
                     style="color: var(--color-success); background: rgba(0,200,120,0.08); border-color: rgba(0,200,120,0.25)">
                  <ng-icon name="lucideZap" size="9" />
                  Auto-aprobada
                </div>
              </div>

              @if (createError()) {
                <div class="mb-4 flex items-center gap-2 px-4 py-3 rounded-[10px] text-[12px] border"
                     style="background: rgba(239,68,68,0.06); color: var(--color-error); border-color: rgba(239,68,68,0.22)">
                  <ng-icon name="lucideTriangleAlert" size="12" class="shrink-0" />
                  {{ createError() }}
                </div>
              }

              <form [formGroup]="createForm" (ngSubmit)="submitCreate()" novalidate class="flex flex-col gap-4">

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="relative">
                    <label class="block text-[11px] font-mono uppercase tracking-wider mb-1.5"
                           style="color: var(--color-accent)">Producto *</label>

                    @if (selectedProduct()) {
                      <!-- Chip producto seleccionado -->
                      <div class="flex items-center gap-2 px-3 py-2.5 rounded-[10px] border"
                           style="background:var(--color-bg-elevated);border-color:var(--color-accent)/40">
                        @if (selectedProduct()!.primaryImageUrl) {
                          <img [src]="selectedProduct()!.primaryImageUrl!" alt=""
                               class="w-7 h-7 rounded-md object-cover shrink-0" />
                        }
                        <div class="min-w-0 flex-1">
                          <p class="text-[12px] font-medium text-text-primary truncate">{{ selectedProduct()!.name }}</p>
                          <p class="text-[10px] font-mono text-text-muted truncate">{{ selectedProduct()!.id }}</p>
                        </div>
                        <button type="button" (click)="clearProduct()"
                          class="p-0.5 text-text-muted hover:text-text-primary transition-colors shrink-0">
                          <ng-icon name="lucideX" size="13" />
                        </button>
                      </div>
                    } @else {
                      <!-- Input búsqueda -->
                      <div class="relative">
                        <ng-icon name="lucideSearch" size="13"
                          class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        <input type="text"
                          [value]="productQuery()"
                          (input)="onProductSearch($event)"
                          (blur)="hideDropdownDelayed()"
                          (focus)="productQuery().length >= 2 && showProductDropdown.set(true)"
                          placeholder="Buscar producto por nombre..."
                          class="w-full rounded-[10px] border pl-8 pr-3 py-2.5 text-[13px] text-text-primary
                                 placeholder:text-text-muted outline-none transition-all
                                 focus:ring-2 focus:ring-accent/20 focus:border-accent/50"
                          style="background:var(--color-bg-elevated);border-color:var(--color-border)"
                          [style.border-color]="createForm.get('productId')?.invalid && createForm.get('productId')?.touched
                            ? 'rgba(239,68,68,0.55)' : ''" />
                        @if (productSearching()) {
                          <ng-icon name="lucideRefreshCw" size="13"
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted neo-spin" />
                        }
                      </div>

                      <!-- Dropdown resultados -->
                      @if (showProductDropdown() && productResults().length > 0) {
                        <div class="absolute z-30 left-0 right-0 mt-1 rounded-[10px] border border-border
                                    bg-bg-surface shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                          @for (p of productResults(); track p.id) {
                            <button type="button" (mousedown)="selectProduct(p)"
                              class="w-full flex items-center gap-2.5 px-3 py-2.5 text-left
                                     hover:bg-bg-elevated transition-colors">
                              @if (p.primaryImageUrl) {
                                <img [src]="p.primaryImageUrl" alt=""
                                     class="w-8 h-8 rounded-md object-cover shrink-0 border border-border" />
                              } @else {
                                <div class="w-8 h-8 rounded-md bg-bg-elevated border border-border
                                            flex items-center justify-center shrink-0">
                                  <ng-icon name="lucidePackage" size="13" class="text-text-muted" />
                                </div>
                              }
                              <div class="min-w-0 flex-1">
                                <p class="text-[12px] font-medium text-text-primary truncate">{{ p.name }}</p>
                                <p class="text-[10px] font-mono text-text-muted truncate">{{ p.id }}</p>
                              </div>
                            </button>
                          }
                        </div>
                      }

                      @if (createForm.get('productId')?.invalid && createForm.get('productId')?.touched) {
                        <p class="text-[11px] mt-1" style="color: var(--color-error)">Selecciona un producto</p>
                      }
                    }
                  </div>
                  <div>
                    <label class="block text-[11px] font-mono uppercase tracking-wider mb-1.5"
                           style="color: var(--color-accent)">Nombre del comprador *</label>
                    <input type="text" formControlName="buyerName"
                      placeholder="Ej: Carlos M., Compra Verificada"
                      class="w-full rounded-[10px] border px-3.5 py-2.5 text-[13px] text-text-primary
                             placeholder:text-text-muted outline-none transition-all
                             focus:ring-2 focus:ring-accent/20 focus:border-accent/50"
                      style="background: var(--color-bg-elevated); border-color: var(--color-border)" />
                  </div>
                </div>

                <div>
                  <label class="block text-[11px] font-mono uppercase tracking-wider mb-2"
                         style="color: var(--color-accent)">Calificación *</label>
                  <div class="flex items-center gap-0.5">
                    @for (star of [1,2,3,4,5]; track star) {
                      <button type="button"
                        (click)="setCreateRating(star)"
                        (mouseenter)="createHoverRating.set(star)"
                        (mouseleave)="createHoverRating.set(0)"
                        class="p-1 transition-transform hover:scale-110 focus:outline-none">
                        <ng-icon name="lucideStar" size="28"
                          [style.color]="star <= (createHoverRating() || createForm.value.rating || 5)
                            ? ratingColor(createHoverRating() || createForm.value.rating || 5)
                            : 'var(--color-border)'"
                          [style.filter]="star <= (createHoverRating() || createForm.value.rating || 5)
                            ? 'drop-shadow(0 0 6px ' + ratingColor(createHoverRating() || createForm.value.rating || 5) + 'aa)'
                            : 'none'"
                          class="transition-all duration-100" />
                      </button>
                    }
                    <span class="ml-3 text-[15px] font-display font-bold tabular-nums"
                          [style.color]="ratingColor(createHoverRating() || createForm.value.rating || 5)"
                          [style.filter]="'drop-shadow(0 0 6px ' + ratingColor(createHoverRating() || createForm.value.rating || 5) + '66)'">
                      {{ createHoverRating() || createForm.value.rating || 5 }}
                      <span class="text-[11px] text-text-muted font-sans font-normal">/5</span>
                    </span>
                  </div>
                </div>

                <div>
                  <label class="block text-[11px] font-mono uppercase tracking-wider mb-1.5 text-text-muted">
                    Título <span class="normal-case tracking-normal font-sans">(opcional)</span>
                  </label>
                  <input type="text" formControlName="title"
                    placeholder="Ej: Excelente producto, llegó antes de lo esperado"
                    class="w-full rounded-[10px] border px-3.5 py-2.5 text-[13px] text-text-primary
                           placeholder:text-text-muted outline-none transition-all
                           focus:ring-2 focus:ring-accent/20 focus:border-accent/50"
                    style="background: var(--color-bg-elevated); border-color: var(--color-border)" />
                </div>

                <div>
                  <label class="block text-[11px] font-mono uppercase tracking-wider mb-1.5 text-text-muted">
                    Reseña <span class="normal-case tracking-normal font-sans">(opcional)</span>
                  </label>
                  <textarea formControlName="body" rows="3"
                    placeholder="Describe la experiencia con el producto…"
                    class="w-full rounded-[10px] border px-3.5 py-2.5 text-[13px] text-text-primary
                           placeholder:text-text-muted outline-none transition-all resize-none
                           focus:ring-2 focus:ring-accent/20 focus:border-accent/50"
                    style="background: var(--color-bg-elevated); border-color: var(--color-border)"
                  ></textarea>
                </div>

                <div class="flex items-center gap-2 pt-2 border-t border-border">
                  <button type="submit" [disabled]="creating()"
                    class="neo-btn-primary !py-2.5 !px-5 !text-[13px] disabled:opacity-50">
                    @if (creating()) {
                      <ng-icon name="lucideRefreshCw" size="13" class="neo-spin" />
                      Publicando…
                    } @else {
                      <ng-icon name="lucideCheck" size="13" />
                      Publicar reseña
                    }
                  </button>
                  <button type="button" (click)="toggleCreateForm()"
                    class="neo-btn-outline !py-2.5 !px-4 !text-[13px]">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        }

        <!-- Loading skeletons -->
        @if (loading()) {
          <div class="flex flex-col gap-3">
            @for (i of [1,2,3]; track $index) {
              <div class="neo-card-premium p-5 animate-pulse overflow-hidden">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-full bg-bg-elevated shrink-0"></div>
                  <div class="flex-1">
                    <div class="h-3 rounded bg-bg-elevated w-1/3 mb-2"></div>
                    <div class="h-2.5 rounded bg-bg-elevated w-1/4"></div>
                  </div>
                  <div class="w-10 h-8 rounded bg-bg-elevated shrink-0"></div>
                </div>
                <div class="mt-4 space-y-2 pl-[52px]">
                  <div class="h-2.5 rounded bg-bg-elevated w-full"></div>
                  <div class="h-2.5 rounded bg-bg-elevated w-4/5"></div>
                </div>
              </div>
            }
          </div>

        <!-- Empty state -->
        } @else if (reviews().length === 0) {
          <div class="neo-card-premium p-14 flex flex-col items-center gap-5 text-center neo-reveal">
            <div class="relative">
              <div class="absolute -inset-4 rounded-3xl blur-2xl"
                   style="background: var(--color-accent); opacity: 0.12"></div>
              <div class="relative w-16 h-16 rounded-2xl border flex items-center justify-center"
                   style="background: rgba(100,93,255,0.08); border-color: rgba(100,93,255,0.25);
                          color: var(--color-accent)">
                <ng-icon name="lucideStar" size="28" />
              </div>
            </div>
            <div>
              <p class="text-[16px] font-bold text-text-primary">Sin reseñas aún</p>
              <p class="text-[13px] text-text-muted mt-1.5 max-w-xs leading-relaxed">
                Usa el botón <span class="text-accent font-semibold">Nueva reseña</span> para agregar
                reseñas editoriales a los productos.
              </p>
            </div>
          </div>

        <!-- Reviews list (read-only) -->
        } @else {
          <div class="neo-stagger flex flex-col gap-3">
            @for (review of reviews(); track review.id) {
              <div class="review-card neo-card-premium relative cursor-default overflow-hidden"
                   [attr.style]="'--rating-rgb:' + ratingColorRgb(review.rating || 0)">

                <div class="rc-top-bar h-[3px] w-full"
                     style="opacity: 0.65; transition: opacity 0.25s"
                     [style.background]="'linear-gradient(90deg, ' + ratingColor(review.rating || 0) + ', transparent 85%)'"></div>

                <div class="rc-orb absolute top-0 right-0 w-[240px] h-[240px] rounded-full pointer-events-none
                            -translate-y-1/2 translate-x-1/2"
                     style="opacity: 0.07; transition: opacity 0.25s"
                     [style.background]="'radial-gradient(circle, ' + ratingColor(review.rating || 0) + ' 0%, transparent 70%)'"></div>

                <div class="relative p-5">
                  <div class="flex items-start gap-3">

                    <!-- Avatar -->
                    <div class="rc-avatar w-10 h-10 rounded-full border flex items-center justify-center shrink-0
                                text-[14px] font-bold uppercase select-none"
                         style="transition: border-color 0.25s, box-shadow 0.25s"
                         [style.background]="avatarBg((review.buyerName?.trim()) || 'U')"
                         [style.border-color]="avatarBorderColor((review.buyerName?.trim()) || 'U')"
                         [style.color]="ratingColor(review.rating || 0)">
                      {{ ((review.buyerName?.trim()) || 'U').charAt(0).toUpperCase() }}
                    </div>

                    <!-- Info -->
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2 flex-wrap mb-0.5">
                        <p class="text-[13px] font-semibold text-text-primary">
                          {{ (review.buyerName?.trim()) || 'Usuario' }}
                        </p>
                        <span class="text-[10px] font-mono px-2 py-0.5 rounded-md bg-bg-elevated border border-border text-text-muted">
                          {{ (review.productId || '------').slice(-6).toUpperCase() }}
                        </span>
                        <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md border"
                              [style.color]="statusColor(review.status)"
                              [style.background]="statusBg(review.status)"
                              [style.border-color]="statusBorder(review.status)">
                          {{ statusLabel(review.status) }}
                        </span>
                      </div>
                      <div class="flex items-center gap-0.5">
                        @for (s of [1,2,3,4,5]; track s) {
                          <svg viewBox="0 0 24 24" width="13" height="13">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                              [attr.fill]="s <= (review.rating || 0) ? ratingColor(review.rating || 0) : 'none'"
                              [attr.stroke]="s <= (review.rating || 0) ? ratingColor(review.rating || 0) : 'var(--color-text-secondary)'"
                              stroke-width="1.5"/>
                          </svg>
                        }
                        <span class="text-[12px] font-bold tabular-nums ml-1.5"
                              [style.color]="ratingColor(review.rating || 0)">
                          {{ review.rating ?? 0 }}/5
                        </span>
                        <span class="text-[11px] text-text-muted ml-2">
                          {{ review.createdAt | date:'d MMM yyyy':'':'es' }}
                        </span>
                      </div>

                      @if (review.title || review.body) {
                        <div class="mt-2.5">
                          @if (review.title) {
                            <p class="text-[13px] font-bold text-text-primary mb-1 leading-snug">{{ review.title }}</p>
                          }
                          @if (review.body) {
                            <div class="rc-body-border pl-3 border-l-2"
                                 style="transition: border-color 0.25s"
                                 [style.border-left-color]="ratingColor(review.rating || 0) + '28'">
                              <p class="text-[12px] text-text-secondary leading-relaxed line-clamp-2">{{ review.body }}</p>
                            </div>
                          }
                        </div>
                      }
                    </div>

                    <!-- Rating number -->
                    <div class="shrink-0 text-right">
                      <span class="rc-rating-num font-display text-[28px] font-bold leading-none tabular-nums"
                            style="transition: filter 0.25s"
                            [style.color]="ratingColor(review.rating || 0)"
                            [style.filter]="'drop-shadow(0 0 6px ' + ratingColor(review.rating || 0) + '44)'">
                        {{ review.rating || 0 }}<span class="text-[11px] text-text-muted font-sans font-normal">/5</span>
                      </span>
                    </div>
                  </div>

                  <!-- ── Moderation actions ──────────────────── -->
                  @if (review.status === 'PENDING') {
                    <div class="mt-3 pt-3 border-t border-border">
                      @if (rejectingId() === review.id) {
                        <div class="flex flex-col gap-2">
                          <textarea rows="2"
                            [value]="rejectReason()"
                            (input)="rejectReason.set($any($event.target).value)"
                            placeholder="Motivo del rechazo (opcional)…"
                            class="w-full rounded-[10px] border px-3 py-2 text-[12px] text-text-primary
                                   placeholder:text-text-muted outline-none resize-none transition-all
                                   focus:ring-1"
                            style="background:rgba(239,68,68,0.04);border-color:rgba(239,68,68,0.3)">
                          </textarea>
                          <div class="flex gap-2">
                            <button (click)="confirmReject(review.id)"
                              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors border"
                              style="background:rgba(239,68,68,0.1);color:var(--color-error);border-color:rgba(239,68,68,0.3)">
                              <ng-icon name="lucideX" size="12" />
                              Confirmar rechazo
                            </button>
                            <button (click)="cancelReject()"
                              class="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-text-muted
                                     hover:text-text-primary transition-colors border border-border">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      } @else {
                        <div class="flex items-center gap-2">
                          <button (click)="approve(review.id)"
                            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold
                                   transition-colors border hover:brightness-110"
                            style="background:rgba(0,200,120,0.1);color:var(--color-success);border-color:rgba(0,200,120,0.3)">
                            <ng-icon name="lucideCheck" size="12" />
                            Aprobar
                          </button>
                          <button (click)="startReject(review.id)"
                            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold
                                   transition-colors border hover:brightness-110"
                            style="background:rgba(239,68,68,0.08);color:var(--color-error);border-color:rgba(239,68,68,0.25)">
                            <ng-icon name="lucideX" size="12" />
                            Rechazar
                          </button>
                        </div>
                      }
                    </div>
                  }

                  @if (review.status === 'REJECTED') {
                    <div class="mt-3 pt-3 border-t border-border flex items-start gap-3">
                      <div class="flex-1">
                        @if (review.rejectReason) {
                          <p class="text-[10px] font-semibold uppercase tracking-wider mb-1"
                             style="color:var(--color-error)">Motivo de rechazo</p>
                          <p class="text-[12px] text-text-secondary">{{ review.rejectReason }}</p>
                        } @else {
                          <p class="text-[12px] text-text-muted italic">Sin motivo especificado</p>
                        }
                      </div>
                      <button (click)="approve(review.id)"
                        class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold
                               transition-colors border hover:brightness-110"
                        style="background:rgba(0,200,120,0.1);color:var(--color-success);border-color:rgba(0,200,120,0.3)">
                        <ng-icon name="lucideCheck" size="12" />
                        Re-aprobar
                      </button>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          @if (totalPages() > 1) {
            <div class="flex items-center justify-center gap-3 mt-6">
              <button (click)="prevPage()" [disabled]="page() === 0"
                class="neo-btn-outline !py-2 !px-4 !text-[13px] disabled:opacity-40 disabled:cursor-not-allowed">
                <ng-icon name="lucideChevronLeft" size="13" />
                Anterior
              </button>
              <span class="text-sm text-text-muted tabular-nums font-mono">{{ page() + 1 }} / {{ totalPages() }}</span>
              <button (click)="nextPage()" [disabled]="page() + 1 >= totalPages()"
                class="neo-btn-outline !py-2 !px-4 !text-[13px] disabled:opacity-40 disabled:cursor-not-allowed">
                Siguiente
                <ng-icon name="lucideChevronRight" size="13" />
              </button>
            </div>
          }
        }

      </div>
    </div>
  `,
})
export class AdminReviewsComponent implements OnInit {
  private adminService   = inject(AdminService);
  private productService = inject(ProductService);
  private fb             = inject(FormBuilder);

  reviews    = signal<Review[]>([]);
  loading    = signal(true);
  page       = signal(0);
  totalPages = signal(0);

  activeStatus  = signal<ReviewStatus>('PENDING');
  rejectingId   = signal<string | null>(null);
  rejectReason  = signal('');

  readonly statusTabs: { value: ReviewStatus; label: string; color: string }[] = [
    { value: 'PENDING',  label: 'Pendientes', color: '#F59E0B' },
    { value: 'APPROVED', label: 'Aprobadas',  color: 'var(--color-success)' },
    { value: 'REJECTED', label: 'Rechazadas', color: 'var(--color-error)' },
  ];

  showCreateForm    = signal(false);
  creating          = signal(false);
  createError       = signal<string | null>(null);
  createHoverRating = signal(0);

  // ── product search ────────────────────────────────────────────────────────
  productQuery       = signal('');
  productResults     = signal<ProductSummary[]>([]);
  productSearching   = signal(false);
  showProductDropdown = signal(false);
  selectedProduct    = signal<ProductSummary | null>(null);

  private productSearch$ = new Subject<string>();

  ngOnInit(): void {
    this.load();
    this.productSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.length < 2) { this.productResults.set([]); return of(null); }
        this.productSearching.set(true);
        return this.productService.search(q, { size: 8 });
      }),
    ).subscribe(res => {
      this.productSearching.set(false);
      if (res) {
        this.productResults.set(res.data.content);
        this.showProductDropdown.set(res.data.content.length > 0);
      }
    });
  }

  onProductSearch(event: Event): void {
    const q = (event.target as HTMLInputElement).value;
    this.productQuery.set(q);
    this.productSearch$.next(q);
  }

  selectProduct(p: ProductSummary): void {
    this.selectedProduct.set(p);
    this.createForm.patchValue({ productId: p.id });
    this.showProductDropdown.set(false);
    this.productQuery.set('');
    this.productResults.set([]);
  }

  clearProduct(): void {
    this.selectedProduct.set(null);
    this.createForm.patchValue({ productId: '' });
    this.productQuery.set('');
    this.productResults.set([]);
  }

  hideDropdownDelayed(): void {
    setTimeout(() => this.showProductDropdown.set(false), 150);
  }

  createForm = this.fb.nonNullable.group({
    productId: ['', [Validators.required,
      Validators.pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)]],
    buyerName: ['', [Validators.required, Validators.maxLength(150)]],
    rating:    [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    title:     [''],
    body:      [''],
  });

  ratingColor(r: number): string {
    if (r >= 4) return '#00C878';
    if (r === 3) return '#F59E0B';
    return '#EF4444';
  }

  ratingColorRgb(r: number): string {
    if (r >= 4) return '0, 200, 120';
    if (r === 3) return '245, 158, 11';
    return '239, 68, 68';
  }

  avatarBg(name: string): string {
    const h = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const hues = [210, 260, 180, 30, 330];
    return `hsla(${hues[h % hues.length]}, 65%, 22%, 1)`;
  }

  avatarBorderColor(name: string): string {
    const h = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const hues = [210, 260, 180, 30, 330];
    return `hsla(${hues[h % hues.length]}, 60%, 50%, 0.4)`;
  }

  toggleCreateForm(): void {
    this.showCreateForm.update(v => !v);
    if (!this.showCreateForm()) {
      this.createForm.reset({ rating: 5, productId: '', buyerName: '', title: '', body: '' });
      this.createError.set(null);
      this.createHoverRating.set(0);
      this.clearProduct();
    }
  }

  setCreateRating(value: number): void { this.createForm.patchValue({ rating: value }); }

  submitCreate(): void {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    this.creating.set(true);
    this.createError.set(null);

    const raw = this.createForm.getRawValue();
    this.adminService.createAdminReview({
      productId: raw.productId,
      buyerName: raw.buyerName,
      rating:    raw.rating,
      title:     raw.title  || undefined,
      body:      raw.body   || undefined,
    }).subscribe({
      next: () => {
        this.creating.set(false);
        this.showCreateForm.set(false);
        this.createForm.reset({ rating: 5, productId: '', buyerName: '', title: '', body: '' });
        this.createHoverRating.set(0);
        this.clearProduct();
        this.load();
      },
      error: (err) => {
        this.createError.set(err.error?.message ?? 'Error al publicar la reseña');
        this.creating.set(false);
      },
    });
  }


  private load(): void {
    this.loading.set(true);
    this.adminService.getAdminReviews(this.page(), 20, this.activeStatus()).subscribe({
      next: (res) => {
        this.reviews.set(res.data.content);
        this.totalPages.set(res.data.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setStatus(status: ReviewStatus): void {
    this.activeStatus.set(status);
    this.page.set(0);
    this.rejectingId.set(null);
    this.load();
  }

  approve(id: string): void {
    this.adminService.moderateReview(id, 'APPROVED').subscribe({ next: () => this.load() });
  }

  startReject(id: string): void   { this.rejectingId.set(id); this.rejectReason.set(''); }
  cancelReject(): void            { this.rejectingId.set(null); this.rejectReason.set(''); }
  confirmReject(id: string): void {
    this.adminService.moderateReview(id, 'REJECTED', this.rejectReason() || undefined).subscribe({
      next: () => { this.cancelReject(); this.load(); },
    });
  }

  statusLabel(s: ReviewStatus): string {
    return s === 'PENDING' ? 'Pendiente' : s === 'APPROVED' ? 'Aprobada' : 'Rechazada';
  }
  statusColor(s: ReviewStatus): string {
    return s === 'PENDING' ? '#F59E0B' : s === 'APPROVED' ? 'var(--color-success)' : 'var(--color-error)';
  }
  statusBg(s: ReviewStatus): string {
    return s === 'PENDING' ? 'rgba(245,158,11,0.1)' : s === 'APPROVED' ? 'rgba(0,200,120,0.1)' : 'rgba(239,68,68,0.08)';
  }
  statusBorder(s: ReviewStatus): string {
    return s === 'PENDING' ? 'rgba(245,158,11,0.35)' : s === 'APPROVED' ? 'rgba(0,200,120,0.3)' : 'rgba(239,68,68,0.25)';
  }

  prevPage(): void { if (this.page() > 0) { this.page.update(p => p - 1); this.load(); } }
  nextPage(): void { if (this.page() + 1 < this.totalPages()) { this.page.update(p => p + 1); this.load(); } }
}
