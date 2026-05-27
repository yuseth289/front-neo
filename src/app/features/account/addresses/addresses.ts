import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { AddressService } from '../../../core/account/address.service';
import { AddressResponse, AddressRequest } from '../../../shared/models/auth.models';

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  template: `
    <div class="max-w-2xl">

      <!-- Header -->
      <div class="flex items-end justify-between mb-6">
        <div>
          <p class="neo-stat-label">Cuenta</p>
          <h1 class="font-display text-[26px] font-bold tracking-[-0.02em] text-text-primary mt-0.5">
            Mis direcciones
          </h1>
        </div>
        @if (!showForm()) {
          <button (click)="openForm()"
            class="neo-btn-primary !text-[13px] !py-2 !px-4">
            <ng-icon name="lucidePlus" size="13" />
            Agregar
          </button>
        }
      </div>

      <!-- Skeleton -->
      @if (loading()) {
        <div class="flex flex-col gap-3">
          @for (_ of [1,2]; track $index) {
            <div class="h-24 rounded-2xl bg-bg-surface border border-border animate-pulse"></div>
          }
        </div>

      <!-- Empty -->
      } @else if (addresses().length === 0 && !showForm()) {
        <div class="neo-card-premium p-14 flex flex-col items-center gap-4 text-center">
          <div class="w-14 h-14 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center">
            <ng-icon name="lucideMapPin" size="26" class="text-text-muted" />
          </div>
          <div>
            <p class="text-base font-semibold text-text-primary">Sin direcciones</p>
            <p class="text-sm text-text-muted mt-1">Agrega una dirección para agilizar tus compras.</p>
          </div>
          <button (click)="openForm()" class="neo-btn-primary !text-[13px] !py-2.5 !px-5 mt-1">
            <ng-icon name="lucidePlus" size="14" />
            Agregar dirección
          </button>
        </div>
      }

      <!-- Lista -->
      @if (addresses().length > 0) {
        <div class="flex flex-col gap-3 mb-5">
          @for (addr of addresses(); track addr.id) {
            <div class="neo-card-premium p-4 transition-all"
              [style.border-color]="addr.primary ? 'var(--color-accent)' : 'var(--color-border)'"
              [style.box-shadow]="addr.primary ? '0 0 16px var(--color-accent-glow)' : 'none'">
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-3 flex-1 min-w-0">
                  <div class="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5"
                    [style.background]="addr.primary ? 'var(--color-accent-soft)' : 'var(--color-bg-elevated)'"
                    [style.border]="addr.primary ? '1px solid var(--color-accent-ring)' : '1px solid var(--color-border)'">
                    <ng-icon name="lucideMapPin" size="14"
                      [style.color]="addr.primary ? 'var(--color-accent)' : 'var(--color-text-muted)'" />
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p class="text-sm font-semibold text-text-primary">{{ addr.label }}</p>
                      @if (addr.primary) {
                        <span class="text-[10px] font-bold uppercase tracking-wide font-mono
                                     text-accent bg-accent/10 border border-accent/30 px-1.5 py-0.5 rounded-full">
                          Principal
                        </span>
                      }
                    </div>
                    <p class="text-[13px] text-text-secondary leading-snug">
                      {{ addr.street }} {{ addr.number }}
                      @if (addr.apartment) { , Apto {{ addr.apartment }} }
                    </p>
                    <p class="text-[12px] text-text-muted mt-0.5">
                      {{ addr.city }}, {{ addr.department }}
                      @if (addr.postalCode) { · CP {{ addr.postalCode }} }
                    </p>
                  </div>
                </div>

                <div class="flex gap-1 shrink-0">
                  @if (!addr.primary) {
                    <button (click)="setPrimary(addr.id)"
                      class="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                      title="Marcar como principal">
                      <ng-icon name="lucideCircleCheck" size="15" />
                    </button>
                  }
                  <button (click)="openForm(addr)"
                    class="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors">
                    <ng-icon name="lucideSettings" size="15" />
                  </button>
                  <button (click)="delete(addr.id)"
                    class="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors">
                    <ng-icon name="lucideX" size="15" />
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Formulario -->
      @if (showForm()) {
        <div class="neo-card-premium p-5">
          <div class="flex items-start gap-3 mb-5">
            <div class="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
              <ng-icon name="lucideMapPin" size="15" class="text-accent" />
            </div>
            <div>
              <h2 class="text-sm font-semibold text-text-primary">
                {{ editingId() ? 'Editar dirección' : 'Nueva dirección' }}
              </h2>
              <p class="text-[12px] text-text-muted mt-0.5">Completa todos los campos obligatorios.</p>
            </div>
          </div>

          @if (formError()) {
            <div class="mb-4 flex items-center gap-2 rounded-[10px] bg-error/10 border border-error/30 px-3.5 py-2.5 text-sm text-error">
              <ng-icon name="lucideTriangleAlert" size="14" />
              {{ formError() }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="save()" novalidate class="flex flex-col gap-4">
            <div>
              <label class="block text-[12px] font-medium text-text-secondary mb-1.5">
                Etiqueta <span class="text-error">*</span>
                <span class="text-text-muted font-normal ml-1">Ej: Casa, Trabajo</span>
              </label>
              <input type="text" formControlName="label" placeholder="Casa"
                class="w-full rounded-[10px] bg-bg-elevated border border-border px-3.5 py-2.5 text-sm text-text-primary
                       placeholder:text-text-muted outline-none transition-all focus:ring-2 focus:ring-accent/8 focus:border-accent" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[12px] font-medium text-text-secondary mb-1.5">
                  Calle / Avenida <span class="text-error">*</span>
                </label>
                <input type="text" formControlName="street" placeholder="Cra 7"
                  class="w-full rounded-[10px] bg-bg-elevated border border-border px-3.5 py-2.5 text-sm text-text-primary
                         placeholder:text-text-muted outline-none transition-all focus:ring-2 focus:ring-accent/8 focus:border-accent" />
              </div>
              <div>
                <label class="block text-[12px] font-medium text-text-secondary mb-1.5">
                  Número <span class="text-error">*</span>
                </label>
                <input type="text" formControlName="number" placeholder="# 32-15"
                  class="w-full rounded-[10px] bg-bg-elevated border border-border px-3.5 py-2.5 text-sm text-text-primary
                         placeholder:text-text-muted outline-none transition-all focus:ring-2 focus:ring-accent/8 focus:border-accent" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[12px] font-medium text-text-secondary mb-1.5">
                  Piso <span class="text-text-muted font-normal">(opcional)</span>
                </label>
                <input type="text" formControlName="floor" placeholder="3"
                  class="w-full rounded-[10px] bg-bg-elevated border border-border px-3.5 py-2.5 text-sm text-text-primary
                         placeholder:text-text-muted outline-none transition-all focus:ring-2 focus:ring-accent/8 focus:border-accent" />
              </div>
              <div>
                <label class="block text-[12px] font-medium text-text-secondary mb-1.5">
                  Apartamento <span class="text-text-muted font-normal">(opcional)</span>
                </label>
                <input type="text" formControlName="apartment" placeholder="301"
                  class="w-full rounded-[10px] bg-bg-elevated border border-border px-3.5 py-2.5 text-sm text-text-primary
                         placeholder:text-text-muted outline-none transition-all focus:ring-2 focus:ring-accent/8 focus:border-accent" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[12px] font-medium text-text-secondary mb-1.5">
                  Ciudad <span class="text-error">*</span>
                </label>
                <input type="text" formControlName="city" placeholder="Bogotá"
                  class="w-full rounded-[10px] bg-bg-elevated border border-border px-3.5 py-2.5 text-sm text-text-primary
                         placeholder:text-text-muted outline-none transition-all focus:ring-2 focus:ring-accent/8 focus:border-accent" />
              </div>
              <div>
                <label class="block text-[12px] font-medium text-text-secondary mb-1.5">
                  Departamento <span class="text-error">*</span>
                </label>
                <input type="text" formControlName="department" placeholder="Cundinamarca"
                  class="w-full rounded-[10px] bg-bg-elevated border border-border px-3.5 py-2.5 text-sm text-text-primary
                         placeholder:text-text-muted outline-none transition-all focus:ring-2 focus:ring-accent/8 focus:border-accent" />
              </div>
            </div>

            <div>
              <label class="block text-[12px] font-medium text-text-secondary mb-1.5">
                Código postal <span class="text-text-muted font-normal">(opcional)</span>
              </label>
              <input type="text" formControlName="postalCode" placeholder="110311"
                class="w-full rounded-[10px] bg-bg-elevated border border-border px-3.5 py-2.5 text-sm text-text-primary
                       placeholder:text-text-muted outline-none transition-all focus:ring-2 focus:ring-accent/8 focus:border-accent" />
            </div>

            <div class="flex gap-3 pt-1">
              <button type="submit" [disabled]="saving()"
                class="neo-btn-primary !py-2.5 !px-5 disabled:opacity-50 disabled:cursor-not-allowed">
                @if (saving()) {
                  <ng-icon name="lucideRefreshCw" size="14" class="neo-spin" />
                  Guardando…
                } @else {
                  <ng-icon name="lucideCheck" size="14" />
                  {{ editingId() ? 'Guardar cambios' : 'Agregar dirección' }}
                }
              </button>
              <button type="button" (click)="closeForm()" class="neo-btn-outline !py-2.5 !px-4">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      }

    </div>
  `,
})
export class AddressesComponent implements OnInit {
  private addressService = inject(AddressService);
  private fb = inject(FormBuilder);

  addresses  = signal<AddressResponse[]>([]);
  loading    = signal(true);
  showForm   = signal(false);
  editingId  = signal<string | null>(null);
  saving     = signal(false);
  formError  = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    label:      ['', Validators.required],
    street:     ['', Validators.required],
    number:     ['', Validators.required],
    floor:      [''],
    apartment:  [''],
    city:       ['', Validators.required],
    department: ['', Validators.required],
    postalCode: [''],
  });

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.addressService.getAll().subscribe({
      next: (res) => { this.addresses.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm(addr?: AddressResponse): void {
    this.form.reset();
    this.formError.set(null);
    if (addr) {
      this.editingId.set(addr.id);
      this.form.patchValue({
        label:      addr.label,
        street:     addr.street,
        number:     addr.number,
        floor:      addr.floor ?? '',
        apartment:  addr.apartment ?? '',
        city:       addr.city,
        department: addr.department,
        postalCode: addr.postalCode ?? '',
      });
    } else {
      this.editingId.set(null);
    }
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); this.editingId.set(null); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.formError.set(null);

    const raw = this.form.getRawValue();
    const request: AddressRequest = {
      label:      raw.label,
      street:     raw.street,
      number:     raw.number,
      floor:      raw.floor || undefined,
      apartment:  raw.apartment || undefined,
      city:       raw.city,
      department: raw.department,
      postalCode: raw.postalCode || undefined,
    };

    const op$ = this.editingId()
      ? this.addressService.update(this.editingId()!, request)
      : this.addressService.create(request);

    op$.subscribe({
      next:  () => { this.closeForm(); this.saving.set(false); this.load(); },
      error: (err) => { this.formError.set(err.error?.message ?? 'Error al guardar'); this.saving.set(false); },
    });
  }

  setPrimary(id: string): void { this.addressService.setPrimary(id).subscribe({ next: () => this.load() }); }
  delete(id: string):     void { this.addressService.delete(id).subscribe({ next: () => this.load() }); }
}
