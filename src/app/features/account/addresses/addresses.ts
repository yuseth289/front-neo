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
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-xl font-bold text-text-primary">Mis direcciones</h1>
        <button (click)="openForm()"
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors">
          <ng-icon name="lucideMapPin" size="14" />
          Agregar
        </button>
      </div>

      @if (loading()) {
        <div class="space-y-3">
          @for (_ of [1,2]; track $index) {
            <div class="h-24 rounded-xl bg-bg-surface border border-border animate-pulse"></div>
          }
        </div>
      } @else if (addresses().length === 0 && !showForm()) {
        <div class="flex flex-col items-center gap-3 py-16 text-text-muted">
          <ng-icon name="lucideMapPin" size="40" />
          <p>No tienes direcciones guardadas.</p>
        </div>
      }

      <!-- Lista -->
      <div class="flex flex-col gap-3 mb-5">
        @for (addr of addresses(); track addr.id) {
          <div class="bg-bg-surface border rounded-xl p-4 transition-colors"
               [class.border-accent]="addr.primary"
               [class.border-border]="!addr.primary">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <p class="text-sm font-medium text-text-primary">{{ addr.label }}</p>
                  @if (addr.primary) {
                    <span class="text-[10px] font-bold uppercase tracking-wide bg-accent/15 text-accent px-1.5 py-0.5 rounded">
                      Principal
                    </span>
                  }
                </div>
                <p class="text-sm text-text-secondary">
                  {{ addr.street }} {{ addr.number }}
                  @if (addr.apartment) { , Apto {{ addr.apartment }} }
                </p>
                <p class="text-xs text-text-muted mt-0.5">
                  {{ addr.city }}, {{ addr.department }}, {{ addr.country }}
                  @if (addr.postalCode) { – CP {{ addr.postalCode }} }
                </p>
              </div>
              <div class="flex gap-1 shrink-0">
                @if (!addr.primary) {
                  <button (click)="setPrimary(addr.id)"
                    class="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-bg-elevated transition-colors"
                    title="Marcar como principal">
                    <ng-icon name="lucideCircleCheck" size="16" />
                  </button>
                }
                <button (click)="openForm(addr)"
                  class="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors">
                  <ng-icon name="lucideSettings" size="16" />
                </button>
                <button (click)="delete(addr.id)"
                  class="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-bg-elevated transition-colors">
                  <ng-icon name="lucideX" size="16" />
                </button>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Formulario -->
      @if (showForm()) {
        <div class="bg-bg-surface border border-border rounded-xl p-5">
          <h2 class="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
            {{ editingId() ? 'Editar dirección' : 'Nueva dirección' }}
          </h2>

          @if (formError()) {
            <div class="mb-4 text-sm text-error flex items-center gap-2">
              <ng-icon name="lucideTriangleAlert" size="14" />{{ formError() }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="save()" novalidate class="flex flex-col gap-4">
            <div>
              <label class="block text-sm text-text-secondary mb-1.5">Etiqueta (ej: Casa, Trabajo)</label>
              <input type="text" formControlName="label" placeholder="Casa"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm text-text-secondary mb-1.5">Calle / Avenida</label>
                <input type="text" formControlName="street" placeholder="Cra 7"
                  class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                         focus:outline-none focus:border-accent transition-colors" />
              </div>
              <div>
                <label class="block text-sm text-text-secondary mb-1.5">Número</label>
                <input type="text" formControlName="number" placeholder="# 32-15"
                  class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                         focus:outline-none focus:border-accent transition-colors" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm text-text-secondary mb-1.5">Piso (opcional)</label>
                <input type="text" formControlName="floor" placeholder="3"
                  class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                         focus:outline-none focus:border-accent transition-colors" />
              </div>
              <div>
                <label class="block text-sm text-text-secondary mb-1.5">Apartamento (opcional)</label>
                <input type="text" formControlName="apartment" placeholder="301"
                  class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                         focus:outline-none focus:border-accent transition-colors" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm text-text-secondary mb-1.5">Ciudad</label>
                <input type="text" formControlName="city" placeholder="Bogotá"
                  class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                         focus:outline-none focus:border-accent transition-colors" />
              </div>
              <div>
                <label class="block text-sm text-text-secondary mb-1.5">Departamento</label>
                <input type="text" formControlName="department" placeholder="Cundinamarca"
                  class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                         focus:outline-none focus:border-accent transition-colors" />
              </div>
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-1.5">Código postal (opcional)</label>
              <input type="text" formControlName="postalCode" placeholder="110311"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors" />
            </div>
            <div class="flex gap-3 pt-1">
              <button type="submit" [disabled]="saving()"
                class="px-5 py-2 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center gap-2">
                @if (saving()) { <ng-icon name="lucideRefreshCw" size="14" class="animate-spin" /> }
                {{ editingId() ? 'Guardar cambios' : 'Agregar dirección' }}
              </button>
              <button type="button" (click)="closeForm()"
                class="px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary text-sm transition-colors">
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

  addresses = signal<AddressResponse[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  saving = signal(false);
  formError = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    label: ['', Validators.required],
    street: ['', Validators.required],
    number: ['', Validators.required],
    floor: [''],
    apartment: [''],
    city: ['', Validators.required],
    department: ['', Validators.required],
    postalCode: [''],
  });

  ngOnInit(): void {
    this.load();
  }

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
        label: addr.label,
        street: addr.street,
        number: addr.number,
        floor: addr.floor ?? '',
        apartment: addr.apartment ?? '',
        city: addr.city,
        department: addr.department,
        postalCode: addr.postalCode ?? '',
      });
    } else {
      this.editingId.set(null);
    }
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.formError.set(null);

    const raw = this.form.getRawValue();
    const request: AddressRequest = {
      label: raw.label,
      street: raw.street,
      number: raw.number,
      floor: raw.floor || undefined,
      apartment: raw.apartment || undefined,
      city: raw.city,
      department: raw.department,
      postalCode: raw.postalCode || undefined,
    };

    const op$ = this.editingId()
      ? this.addressService.update(this.editingId()!, request)
      : this.addressService.create(request);

    op$.subscribe({
      next: () => { this.closeForm(); this.saving.set(false); this.load(); },
      error: (err) => { this.formError.set(err.error?.message ?? 'Error al guardar'); this.saving.set(false); },
    });
  }

  setPrimary(id: string): void {
    this.addressService.setPrimary(id).subscribe({ next: () => this.load() });
  }

  delete(id: string): void {
    this.addressService.delete(id).subscribe({ next: () => this.load() });
  }
}
