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

      <!-- Header -->
      <div class="mb-6">
        <p class="neo-stat-label">Seller</p>
        <h1 class="font-display text-[26px] font-bold tracking-[-0.02em] text-text-primary mt-0.5">Mi tienda</h1>
      </div>

      <!-- ── Logo de la tienda ───────────────────────────── -->
      <div class="neo-card-premium p-5 mb-4">
        <div class="flex items-start gap-3 mb-5">
          <div class="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
            <ng-icon name="lucideImage" size="15" class="text-accent" />
          </div>
          <div>
            <h2 class="text-sm font-semibold text-text-primary">Logo de la tienda</h2>
            <p class="text-[12px] text-text-muted mt-0.5">JPG o PNG · máx. 2 MB · se recortará a 256 × 256 px.</p>
          </div>
        </div>

        <div class="flex items-center gap-5">
          <div class="relative shrink-0 group cursor-pointer" (click)="logoInput.click()">
            <div class="w-20 h-20 rounded-[14px] border-2 overflow-hidden
                        border-border group-hover:border-accent transition-colors duration-200
                        bg-bg-elevated flex items-center justify-center">
              @if (logoPreview()) {
                <img [src]="logoPreview()" alt="Logo" class="w-full h-full object-cover" />
              } @else {
                <ng-icon name="lucideStore" size="28" class="text-text-muted" />
              }
            </div>
            <div class="absolute inset-0 rounded-[14px] bg-black/50 flex items-center justify-center
                        opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ng-icon name="lucideUploadCloud" size="20" class="text-white" />
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <button type="button" (click)="logoInput.click()"
              class="neo-btn-outline !py-2 !px-4 !text-[13px]">
              <ng-icon name="lucideUploadCloud" size="14" />
              {{ logoPreview() ? 'Cambiar logo' : 'Subir logo' }}
            </button>
            @if (logoPreview()) {
              <button type="button" (click)="removeLogo()"
                class="text-[12px] text-text-muted hover:text-error transition-colors flex items-center gap-1.5">
                <ng-icon name="lucideTrash2" size="12" />
                Eliminar logo
              </button>
            }
          </div>
        </div>

        <input #logoInput type="file" accept="image/jpeg,image/png,image/webp"
               class="hidden" (change)="onLogoSelected($event)" />

        @if (logoError()) {
          <div class="mt-3 flex items-center gap-2 rounded-[10px] bg-error/10 border border-error/30 px-3 py-2 text-[12px] text-error">
            <ng-icon name="lucideTriangleAlert" size="13" />{{ logoError() }}
          </div>
        }
        @if (logoDirty()) {
          <div class="mt-4 pt-4 border-t border-border flex items-center gap-3">
            <button type="button" (click)="saveLogo()" [disabled]="savingLogo()"
              class="neo-btn-primary !py-2 !px-4 !text-[13px] disabled:opacity-50">
              @if (savingLogo()) {
                <ng-icon name="lucideRefreshCw" size="13" class="neo-spin" /> Guardando…
              } @else {
                <ng-icon name="lucideCheck" size="13" /> Guardar logo
              }
            </button>
            @if (logoSuccess()) {
              <span class="text-[12px] text-success flex items-center gap-1">
                <ng-icon name="lucideCircleCheck" size="13" /> Logo actualizado
              </span>
            }
          </div>
        }
      </div>

      <!-- Datos de la tienda -->
      <div class="neo-card-premium p-5 mb-4">
        <div class="flex items-start gap-3 mb-5">
          <div class="w-8 h-8 rounded-lg bg-bg-elevated border border-border flex items-center justify-center shrink-0">
            <ng-icon name="lucideStore" size="15" class="text-text-secondary" />
          </div>
          <div>
            <h2 class="text-sm font-semibold text-text-primary">Datos de la tienda</h2>
            <p class="text-[12px] text-text-muted mt-0.5">Nombre, descripción y datos de contacto.</p>
          </div>
        </div>

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
              class="neo-btn-primary !py-2.5 !px-5 disabled:opacity-50 disabled:cursor-not-allowed">
              @if (savingStore()) {
                <ng-icon name="lucideRefreshCw" size="14" class="neo-spin" /> Guardando…
              } @else {
                <ng-icon name="lucideCheck" size="14" /> Guardar cambios
              }
            </button>
          </form>
        }
      </div>

      <!-- Info de solo lectura -->
      @if (seller()) {
        <div class="neo-card-premium p-5">
          <div class="flex items-start gap-3 mb-4">
            <div class="w-8 h-8 rounded-lg bg-bg-elevated border border-border flex items-center justify-center shrink-0">
              <ng-icon name="lucideFileText" size="15" class="text-text-secondary" />
            </div>
            <div>
              <h2 class="text-sm font-semibold text-text-primary">Datos fiscales</h2>
              <p class="text-[12px] text-text-muted mt-0.5">Solo lectura — contacta a soporte para cambios.</p>
            </div>
          </div>
          <dl class="flex flex-col gap-2.5 text-sm">
            <div class="flex gap-3">
              <dt class="text-text-muted w-36 shrink-0 text-[13px]">Tipo documento</dt>
              <dd class="text-text-primary text-[13px]">{{ seller()!.tipoDocumento }}</dd>
            </div>
            <div class="flex gap-3">
              <dt class="text-text-muted w-36 shrink-0 text-[13px]">Número</dt>
              <dd class="text-text-primary font-mono text-[13px]">{{ seller()!.numeroDocumento }}</dd>
            </div>
            <div class="flex gap-3">
              <dt class="text-text-muted w-36 shrink-0 text-[13px]">Razón social</dt>
              <dd class="text-text-primary text-[13px]">{{ seller()!.razonSocial }}</dd>
            </div>
            <div class="flex gap-3">
              <dt class="text-text-muted w-36 shrink-0 text-[13px]">Régimen fiscal</dt>
              <dd class="text-text-primary text-[13px]">
                {{ seller()!.tipoRegimen === 'RESPONSABLE_IVA' ? 'Responsable de IVA' : 'No responsable de IVA' }}
              </dd>
            </div>
          </dl>
        </div>
      }
    </div>
  `,
})
export class SellerProfileComponent implements OnInit {
  private sellerService = inject(SellerService);
  private fb = inject(FormBuilder);

  loading     = signal(true);
  savingStore = signal(false);
  storeSuccess = signal(false);
  storeError  = signal<string | null>(null);
  seller      = signal<SellerResponse | null>(null);

  logoPreview = signal<string | null>(null);
  logoDirty   = signal(false);
  savingLogo  = signal(false);
  logoSuccess = signal(false);
  logoError   = signal<string | null>(null);

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
        if (s.storeLogoUrl && !this.logoDirty()) {
          this.logoPreview.set(s.storeLogoUrl);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const side = Math.min(img.width, img.height);
        const ox = (img.width - side) / 2;
        const oy = (img.height - side) / 2;
        ctx.drawImage(img, ox, oy, side, side, 0, 0, size, size);
        this.logoPreview.set(canvas.toDataURL('image/jpeg', 0.75));
        this.logoDirty.set(true);
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
    (event.target as HTMLInputElement).value = '';
  }

  removeLogo(): void {
    this.logoPreview.set(null);
    this.logoDirty.set(true);
  }

  saveLogo(): void {
    this.savingLogo.set(true);
    this.logoError.set(null);
    this.sellerService.update({ storeLogoUrl: this.logoPreview() ?? '' }).subscribe({
      next: (res) => {
        this.seller.set(res.data);
        this.savingLogo.set(false);
        this.logoDirty.set(false);
        this.logoSuccess.set(true);
        setTimeout(() => this.logoSuccess.set(false), 3000);
      },
      error: (err) => {
        this.savingLogo.set(false);
        this.logoError.set(err?.error?.message ?? 'Error al guardar el logo');
      },
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
