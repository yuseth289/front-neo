import { Component, inject, NgZone, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { SellerProductService } from '../../core/seller/seller-product.service';
import { ProductSummaryResponse, OfferResponse } from '../../shared/models/product.models';
import { CopCurrencyPipe } from '../../shared/pipes/cop-currency.pipe';

@Component({
  selector: 'app-seller-discounts',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FormsModule, NgIcon, CopCurrencyPipe],
  template: `
    <div class="max-w-2xl mx-auto">

      <!-- Header -->
      <div class="mb-6">
        <p class="neo-stat-label">Gestión</p>
        <h1 class="font-display text-[26px] font-bold tracking-[-0.02em] text-text-primary mt-0.5">
          Descuentos
        </h1>
        <p class="text-[13px] text-text-muted mt-1">
          Busca un producto y crea una oferta de descuento con fechas de vigencia.
        </p>
      </div>

      <!-- Buscador -->
      <div class="relative mb-5">
        <ng-icon name="lucideSearch" size="15"
          class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input [(ngModel)]="searchQ" (ngModelChange)="onSearch($event)"
          placeholder="Buscar producto por nombre…"
          class="w-full h-[42px] pl-10 pr-4 rounded-[12px] bg-bg-elevated border border-border
                 text-[14px] text-text-primary placeholder:text-text-muted outline-none
                 focus:border-accent/60 focus:ring-2 focus:ring-accent/10 transition-all" />
        @if (searchQ) {
          <button (click)="clearSearch()"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
            <ng-icon name="lucideX" size="14" />
          </button>
        }
      </div>

      <!-- Skeletons -->
      @if (loading()) {
        <div class="flex flex-col gap-3">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="h-[68px] rounded-2xl bg-bg-surface border border-border animate-pulse"></div>
          }
        </div>

      <!-- Empty -->
      } @else if (products().length === 0) {
        <div class="neo-card-premium p-12 flex flex-col items-center gap-4 text-center">
          <ng-icon name="lucidePackage" size="28" class="text-text-muted" />
          <p class="text-[14px] text-text-secondary">
            {{ searchQ ? 'No se encontraron productos con ese nombre.' : 'No tienes productos todavía.' }}
          </p>
        </div>

      <!-- Lista de productos -->
      } @else {
        <div class="flex flex-col gap-3">
          @for (p of products(); track p.id) {
            <div class="neo-card-premium overflow-hidden">

              <!-- Fila del producto -->
              <div class="flex items-center gap-3 p-4">
                <div class="w-12 h-12 rounded-[10px] overflow-hidden bg-bg-elevated border border-border shrink-0">
                  @if (p.primaryImageUrl) {
                    <img [src]="p.primaryImageUrl" [alt]="p.name" class="w-full h-full object-cover" />
                  } @else {
                    <div class="w-full h-full flex items-center justify-center">
                      <ng-icon name="lucideImage" size="16" class="text-text-muted" />
                    </div>
                  }
                </div>

                <div class="flex-1 min-w-0">
                  <p class="text-[14px] font-semibold text-text-primary truncate">{{ p.name }}</p>
                  <p class="text-[12px] text-text-muted mt-0.5 font-mono">
                    {{ p.finalPrice | copCurrency }} · {{ p.brand || 'Sin marca' }}
                  </p>
                </div>

                <button
                  (click)="toggleExpand(p.id)"
                  class="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold transition-all"
                  [style.background]="expandedId() === p.id ? 'rgba(239,68,68,0.1)' : 'rgba(100,93,255,0.1)'"
                  [style.color]="expandedId() === p.id ? 'var(--color-error)' : 'var(--color-accent)'"
                  [style.border]="expandedId() === p.id ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(100,93,255,0.3)'">
                  @if (expandedId() === p.id) {
                    <ng-icon name="lucideX" size="13" /> Cancelar
                  } @else {
                    <ng-icon name="lucideTag" size="13" /> Añadir descuento
                  }
                </button>
              </div>

              <!-- Formulario inline expandido -->
              @if (expandedId() === p.id) {
                <div class="border-t border-border px-4 py-4 bg-bg-elevated/50">

                  <!-- Ofertas activas existentes -->
                  @if (activeOffers(p.id).length > 0) {
                    <div class="mb-4">
                      <p class="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                        Descuentos activos
                      </p>
                      <div class="flex flex-col gap-2">
                        @for (offer of activeOffers(p.id); track offer.id) {
                          <div class="flex items-center justify-between gap-3 px-3 py-2.5 rounded-[10px]"
                               style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.18)">
                            <div>
                              <span class="text-[14px] font-bold" style="color:var(--color-error)">
                                -{{ offer.discountPercent }}%
                              </span>
                              <span class="text-[11px] text-text-muted ml-2">
                                {{ offer.startDate | date:'d MMM yyyy' }} — {{ offer.endDate | date:'d MMM yyyy' }}
                              </span>
                            </div>
                            <button type="button" (click)="deleteActiveOffer(p.id, offer.id)"
                              [disabled]="deletingOffer() === offer.id"
                              class="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold
                                     transition-colors disabled:opacity-50 shrink-0"
                              style="background:rgba(239,68,68,0.12);color:var(--color-error);border:1px solid rgba(239,68,68,0.3)">
                              @if (deletingOffer() === offer.id) {
                                <ng-icon name="lucideRefreshCw" size="12" class="animate-spin" />
                              } @else {
                                <ng-icon name="lucideTrash2" size="12" />
                              }
                              Eliminar
                            </button>
                          </div>
                        }
                      </div>
                      <div class="border-t border-border mt-4 mb-4"></div>
                    </div>
                  }

                  @if (successId() === p.id) {
                    <div class="flex items-center gap-2 px-3 py-2.5 rounded-[10px] text-[13px] font-medium mb-3"
                         style="background:rgba(0,200,120,0.1);color:var(--color-success);border:1px solid rgba(0,200,120,0.25)">
                      <ng-icon name="lucideCircleCheck" size="14" />
                      ¡Descuento creado! Será visible en el catálogo durante las fechas indicadas.
                    </div>
                  }

                  @if (createError()) {
                    <div class="flex items-center gap-2 px-3 py-2.5 rounded-[10px] text-[13px] mb-3"
                         style="background:rgba(239,68,68,0.08);color:var(--color-error);border:1px solid rgba(239,68,68,0.2)">
                      <ng-icon name="lucideTriangleAlert" size="13" />
                      {{ createError() }}
                    </div>
                  }

                  <form [formGroup]="form" (ngSubmit)="createOffer(p.id)" novalidate>
                    <div class="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <label class="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                          Descuento (%)
                        </label>
                        <input type="number" formControlName="discountPercent" min="1" max="90"
                          class="w-full rounded-[10px] bg-bg-elevated border border-border px-3 py-2 text-[14px]
                                 text-text-primary focus:outline-none focus:border-accent/50 transition-colors" />
                      </div>
                      <div>
                        <label class="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                          Fecha inicio
                        </label>
                        <input type="date" formControlName="startDate"
                          class="w-full rounded-[10px] bg-bg-elevated border border-border px-3 py-2 text-[13px]
                                 text-text-primary focus:outline-none focus:border-accent/50 transition-colors" />
                      </div>
                      <div>
                        <label class="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                          Fecha fin
                        </label>
                        <input type="date" formControlName="endDate"
                          class="w-full rounded-[10px] bg-bg-elevated border border-border px-3 py-2 text-[13px]
                                 text-text-primary focus:outline-none focus:border-accent/50 transition-colors" />
                      </div>
                    </div>

                    <div class="flex items-center gap-3">
                      <button type="submit" [disabled]="creating() || form.invalid"
                        class="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-semibold
                               transition-colors disabled:opacity-50"
                        style="background:#EF4444;color:#fff">
                        @if (creating()) {
                          <ng-icon name="lucideRefreshCw" size="13" class="animate-spin" />
                          Creando…
                        } @else {
                          <ng-icon name="lucideTag" size="13" />
                          Crear descuento
                        }
                      </button>
                      <a [routerLink]="['/seller/products', p.id, 'offers']"
                         class="text-[12px] text-text-muted hover:text-accent transition-colors">
                        Ver todas las ofertas →
                      </a>
                    </div>
                  </form>
                </div>
              }

            </div>
          }
        </div>
      }

    </div>
  `,
})
export class SellerDiscountsComponent implements OnInit, OnDestroy {
  private productService = inject(SellerProductService);
  private fb             = inject(FormBuilder);
  private zone           = inject(NgZone);
  private destroy$       = new Subject<void>();
  private search$        = new Subject<string>();

  products      = signal<ProductSummaryResponse[]>([]);
  loading       = signal(true);
  expandedId    = signal<string | null>(null);
  creating      = signal(false);
  createError   = signal<string | null>(null);
  successId     = signal<string | null>(null);
  offersMap     = signal<Record<string, OfferResponse[]>>({});
  deletingOffer = signal<string | null>(null);

  searchQ = '';

  form = this.fb.nonNullable.group({
    discountPercent: [10, [Validators.required, Validators.min(1), Validators.max(90)]],
    startDate:       ['', Validators.required],
    endDate:         ['', Validators.required],
  });

  ngOnInit(): void {
    this.load();
    this.search$.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(q => this.load(q));
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  onSearch(q: string): void { this.search$.next(q.trim()); }

  clearSearch(): void {
    this.searchQ = '';
    this.load();
  }

  activeOffers(productId: string): OfferResponse[] {
    return (this.offersMap()[productId] ?? []).filter(o => o.active);
  }

  toggleExpand(productId: string): void {
    if (this.expandedId() === productId) {
      this.expandedId.set(null);
    } else {
      this.expandedId.set(productId);
      this.form.reset({ discountPercent: 10, startDate: '', endDate: '' });
      this.createError.set(null);
      this.successId.set(null);
      this.loadOffers(productId);
    }
  }

  private loadOffers(productId: string): void {
    this.productService.getOffers(productId).subscribe({
      next: (res) => this.zone.run(() =>
        this.offersMap.update(m => ({ ...m, [productId]: res.data }))),
      error: () => {},
    });
  }

  deleteActiveOffer(productId: string, offerId: string): void {
    this.deletingOffer.set(offerId);
    this.productService.deleteOffer(productId, offerId).subscribe({
      next: () => this.zone.run(() => {
        this.offersMap.update(m => ({
          ...m,
          [productId]: (m[productId] ?? []).filter(o => o.id !== offerId),
        }));
        this.deletingOffer.set(null);
      }),
      error: () => this.zone.run(() => this.deletingOffer.set(null)),
    });
  }

  createOffer(productId: string): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.creating.set(true);
    this.createError.set(null);
    const raw = this.form.getRawValue();
    this.productService.createOffer(productId, raw).subscribe({
      next: () => this.zone.run(() => {
        this.creating.set(false);
        this.successId.set(productId);
        this.form.reset({ discountPercent: 10, startDate: '', endDate: '' });
        this.loadOffers(productId);
        setTimeout(() => {
          this.successId.set(null);
          this.expandedId.set(null);
        }, 2500);
      }),
      error: (err) => this.zone.run(() => {
        this.createError.set(err.error?.message ?? 'Error al crear el descuento');
        this.creating.set(false);
      }),
    });
  }

  private load(q?: string): void {
    this.loading.set(true);
    this.productService.getMyProducts(0, 30, q).subscribe({
      next: (res) => this.zone.run(() => {
        this.products.set(res.data.content);
        this.loading.set(false);
      }),
      error: () => this.zone.run(() => this.loading.set(false)),
    });
  }
}
