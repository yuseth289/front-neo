import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { SellerProductService } from '../../core/seller/seller-product.service';
import { OfferResponse } from '../../shared/models/product.models';

@Component({
  selector: 'app-seller-offers',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, NgIcon],
  template: `
    <div class="max-w-xl">
      <div class="flex items-center gap-3 mb-6">
        <a [routerLink]="['/seller/products', productId()]"
          class="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
          <ng-icon name="lucideChevronLeft" size="14" />
          Editar producto
        </a>
      </div>

      <div class="flex items-center justify-between mb-6">
        <h1 class="text-xl font-bold text-text-primary">Ofertas</h1>
        <button (click)="toggleForm()"
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors">
          <ng-icon name="lucidePlus" size="14" />
          Nueva oferta
        </button>
      </div>

      @if (showForm()) {
        <div class="bg-bg-surface border border-border rounded-xl p-5 mb-5">
          <h2 class="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">Nueva oferta</h2>

          @if (formError()) {
            <p class="mb-3 text-sm text-error flex items-center gap-1.5">
              <ng-icon name="lucideTriangleAlert" size="13" />{{ formError() }}
            </p>
          }

          <form [formGroup]="form" (ngSubmit)="create()" novalidate class="flex flex-col gap-4">
            <div>
              <label class="block text-sm text-text-secondary mb-1.5">Descuento (%)</label>
              <input type="number" formControlName="discountPercent" min="1" max="90"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm text-text-secondary mb-1.5">Fecha inicio</label>
                <input type="date" formControlName="startDate"
                  class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                         focus:outline-none focus:border-accent transition-colors" />
              </div>
              <div>
                <label class="block text-sm text-text-secondary mb-1.5">Fecha fin</label>
                <input type="date" formControlName="endDate"
                  class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                         focus:outline-none focus:border-accent transition-colors" />
              </div>
            </div>
            <div class="flex gap-3">
              <button type="submit" [disabled]="creating()"
                class="px-5 py-2 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center gap-2">
                @if (creating()) { <ng-icon name="lucideRefreshCw" size="14" class="animate-spin" /> }
                Crear oferta
              </button>
              <button type="button" (click)="toggleForm()"
                class="px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary text-sm transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      }

      @if (loading()) {
        <div class="space-y-3">
          @for (_ of [1,2]; track $index) {
            <div class="h-16 rounded-xl bg-bg-surface border border-border animate-pulse"></div>
          }
        </div>
      } @else if (offers().length === 0 && !showForm()) {
        <div class="flex flex-col items-center gap-3 py-12 text-text-muted">
          <ng-icon name="lucideTag" size="36" />
          <p class="text-sm">No hay ofertas activas para este producto.</p>
        </div>
      } @else {
        <div class="flex flex-col gap-3">
          @for (offer of offers(); track offer.id) {
            <div class="bg-bg-surface border border-border rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <div class="flex items-center gap-2 mb-0.5">
                  <span class="text-lg font-bold text-accent">-{{ offer.discountPercent }}%</span>
                  @if (offer.active) {
                    <span class="text-[10px] font-bold uppercase tracking-wide bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded">
                      Activa
                    </span>
                  } @else {
                    <span class="text-[10px] font-bold uppercase tracking-wide bg-bg-elevated text-text-muted px-1.5 py-0.5 rounded">
                      Inactiva
                    </span>
                  }
                </div>
                <p class="text-xs text-text-muted">
                  {{ offer.startDate | date:'d MMM yyyy':'':'es' }} — {{ offer.endDate | date:'d MMM yyyy':'':'es' }}
                </p>
              </div>
              <button (click)="delete(offer.id)"
                class="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-bg-elevated transition-colors shrink-0">
                <ng-icon name="lucideTrash2" size="15" />
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class SellerOffersComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(SellerProductService);
  private fb = inject(FormBuilder);

  productId = signal('');
  offers = signal<OfferResponse[]>([]);
  loading = signal(true);
  showForm = signal(false);
  creating = signal(false);
  formError = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    discountPercent: [10, [Validators.required, Validators.min(1), Validators.max(90)]],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.productId.set(id);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.productService.getOffers(this.productId()).subscribe({
      next: (res) => { this.offers.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleForm(): void {
    this.showForm.update(v => !v);
    this.formError.set(null);
    this.form.reset({ discountPercent: 10, startDate: '', endDate: '' });
  }

  create(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.creating.set(true);
    this.formError.set(null);
    const raw = this.form.getRawValue();
    this.productService.createOffer(this.productId(), raw).subscribe({
      next: (res) => {
        this.offers.update(list => [...list, res.data]);
        this.showForm.set(false);
        this.creating.set(false);
      },
      error: (err) => { this.formError.set(err.error?.message ?? 'Error al crear'); this.creating.set(false); },
    });
  }

  delete(offerId: string): void {
    this.productService.deleteOffer(this.productId(), offerId).subscribe({
      next: () => this.offers.update(list => list.filter(o => o.id !== offerId)),
    });
  }
}
