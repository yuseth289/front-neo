import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { SellerService } from '../../core/seller/seller.service';
import { SellerResponse } from '../../shared/models/seller.models';

@Component({
  selector: 'app-seller-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  template: `
    <div class="max-w-2xl">
      <h1 class="text-xl font-bold text-text-primary mb-6">Mi tienda</h1>

      <!-- Datos de la tienda -->
      <section class="bg-bg-surface border border-border rounded-xl p-6 mb-5">
        <h2 class="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">Datos de la tienda</h2>

        @if (storeSuccess()) {
          <div class="mb-4 flex items-center gap-2 rounded-lg bg-success/10 border border-success/30 px-4 py-2.5 text-sm text-success">
            <ng-icon name="lucideCircleCheck" size="14" />Cambios guardados
          </div>
        }
        @if (storeError()) {
          <div class="mb-4 flex items-center gap-2 rounded-lg bg-error/10 border border-error/30 px-4 py-2.5 text-sm text-error">
            <ng-icon name="lucideTriangleAlert" size="14" />{{ storeError() }}
          </div>
        }

        @if (loading()) {
          <div class="space-y-3">
            @for (_ of [1,2,3]; track $index) {
              <div class="h-10 rounded-lg bg-bg-elevated animate-pulse"></div>
            }
          </div>
        } @else {
          <form [formGroup]="storeForm" (ngSubmit)="saveStore()" novalidate class="flex flex-col gap-4">
            <div>
              <label class="block text-sm text-text-secondary mb-1.5">Nombre de la tienda</label>
              <input type="text" formControlName="storeName"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors"
                [class.border-error]="isInvalid('storeName')" />
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-1.5">Descripción (opcional)</label>
              <textarea formControlName="storeDescription" rows="3"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors resize-none"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm text-text-secondary mb-1.5">Ciudad</label>
                <input type="text" formControlName="city"
                  class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                         focus:outline-none focus:border-accent transition-colors"
                  [class.border-error]="isInvalid('city')" />
              </div>
              <div>
                <label class="block text-sm text-text-secondary mb-1.5">Departamento</label>
                <input type="text" formControlName="department"
                  class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                         focus:outline-none focus:border-accent transition-colors"
                  [class.border-error]="isInvalid('department')" />
              </div>
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-1.5">Teléfono de contacto</label>
              <input type="tel" formControlName="phone"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors"
                [class.border-error]="isInvalid('phone')" />
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-1.5">Dirección</label>
              <input type="text" formControlName="address"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors"
                [class.border-error]="isInvalid('address')" />
            </div>
            <button type="submit" [disabled]="savingStore()"
              class="self-start px-5 py-2 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center gap-2">
              @if (savingStore()) { <ng-icon name="lucideRefreshCw" size="14" class="animate-spin" /> }
              Guardar cambios
            </button>
          </form>
        }
      </section>

      <!-- Info de solo lectura -->
      @if (seller()) {
        <section class="bg-bg-surface border border-border rounded-xl p-6">
          <h2 class="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">Datos fiscales</h2>
          <dl class="space-y-2 text-sm">
            <div class="flex gap-3">
              <dt class="text-text-muted w-36 shrink-0">Tipo documento</dt>
              <dd class="text-text-primary">{{ seller()!.tipoDocumento }}</dd>
            </div>
            <div class="flex gap-3">
              <dt class="text-text-muted w-36 shrink-0">Número</dt>
              <dd class="text-text-primary font-mono">{{ seller()!.numeroDocumento }}</dd>
            </div>
            <div class="flex gap-3">
              <dt class="text-text-muted w-36 shrink-0">Razón social</dt>
              <dd class="text-text-primary">{{ seller()!.razonSocial }}</dd>
            </div>
            <div class="flex gap-3">
              <dt class="text-text-muted w-36 shrink-0">Régimen fiscal</dt>
              <dd class="text-text-primary">
                {{ seller()!.tipoRegimen === 'RESPONSABLE_IVA' ? 'Responsable de IVA' : 'No responsable de IVA' }}
              </dd>
            </div>
          </dl>
          <p class="mt-4 text-xs text-text-muted">
            Para modificar los datos fiscales contacta al soporte de NeoGaming.
          </p>
        </section>
      }
    </div>
  `,
})
export class SellerProfileComponent implements OnInit {
  private sellerService = inject(SellerService);
  private fb = inject(FormBuilder);

  loading = signal(true);
  savingStore = signal(false);
  storeSuccess = signal(false);
  storeError = signal<string | null>(null);
  seller = signal<SellerResponse | null>(null);

  storeForm = this.fb.nonNullable.group({
    storeName: ['', Validators.required],
    storeDescription: [''],
    city: ['', Validators.required],
    department: ['', Validators.required],
    phone: ['', Validators.required],
    address: ['', Validators.required],
  });

  isInvalid(field: string): boolean {
    const c = this.storeForm.get(field);
    return !!(c?.invalid && c?.touched);
  }

  ngOnInit(): void {
    this.sellerService.getMe().subscribe({
      next: (res) => {
        const s = res.data;
        this.seller.set(s);
        this.storeForm.patchValue({
          storeName: s.storeName,
          storeDescription: s.storeDescription ?? '',
          city: s.city,
          department: s.department,
          phone: s.phone,
          address: s.address,
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  saveStore(): void {
    if (this.storeForm.invalid) { this.storeForm.markAllAsTouched(); return; }
    this.savingStore.set(true);
    this.storeSuccess.set(false);
    this.storeError.set(null);

    const raw = this.storeForm.getRawValue();
    this.sellerService.update({
      storeName: raw.storeName,
      storeDescription: raw.storeDescription || undefined,
      city: raw.city,
      department: raw.department,
      phone: raw.phone,
      address: raw.address,
    }).subscribe({
      next: () => {
        this.savingStore.set(false);
        this.storeSuccess.set(true);
        setTimeout(() => this.storeSuccess.set(false), 3000);
      },
      error: (err) => {
        this.storeError.set(err.error?.message ?? 'Error al guardar');
        this.savingStore.set(false);
      },
    });
  }
}
