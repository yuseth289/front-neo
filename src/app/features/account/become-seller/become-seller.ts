import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { SellerService } from '../../../core/seller/seller.service';
import { TipoDocumento, TipoRegimen } from '../../../shared/models/enums';

const COLOMBIA_DEPARTMENTS = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá',
  'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba',
  'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena',
  'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
  'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca',
  'Vaupés', 'Vichada',
];

@Component({
  selector: 'app-become-seller',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgIcon],
  template: `
    <div class="max-w-xl">
      @if (submitted()) {
        <!-- Success state -->
        <div class="bg-bg-surface border border-border rounded-2xl p-8 text-center">
          <div class="w-16 h-16 rounded-full bg-yellow-500/15 flex items-center justify-center mx-auto mb-4">
            <ng-icon name="lucideStore" size="28" class="text-yellow-400" />
          </div>
          <h1 class="text-xl font-bold text-text-primary mb-2">Solicitud enviada</h1>
          <p class="text-text-secondary text-sm leading-relaxed mb-6">
            Tu solicitud para ser vendedor está en revisión. Te notificaremos cuando sea aprobada.
            Este proceso puede tomar 1-2 días hábiles.
          </p>
          <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 mb-6">
            <div class="flex items-center gap-2 text-yellow-400 text-sm font-medium">
              <ng-icon name="lucideTriangleAlert" size="14" />
              Estado: Pendiente de aprobación
            </div>
          </div>
          <a routerLink="/account"
            class="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors">
            Ir a mi perfil
          </a>
        </div>
      } @else {
        <div class="mb-6">
          <h1 class="text-xl font-bold text-text-primary">Convertirme en vendedor</h1>
          <p class="text-sm text-text-secondary mt-1">Completa el formulario para solicitar tu cuenta de vendedor en NeoGaming.</p>
        </div>

        @if (error()) {
          <div class="mb-4 flex items-center gap-2 text-sm text-error bg-error/10 border border-error/20 rounded-xl px-4 py-3">
            <ng-icon name="lucideTriangleAlert" size="14" />
            {{ error() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="flex flex-col gap-5">
          <!-- Información de la tienda -->
          <fieldset class="bg-bg-surface border border-border rounded-xl p-5 flex flex-col gap-4">
            <legend class="text-xs font-semibold text-text-secondary uppercase tracking-wide px-1">Tienda</legend>

            <div>
              <label class="block text-sm text-text-secondary mb-1.5">Nombre de la tienda *</label>
              <input type="text" formControlName="storeName" placeholder="Gaming Shop Colombia"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors"
                [class.border-error]="isInvalid('storeName')" />
            </div>

            <div>
              <label class="block text-sm text-text-secondary mb-1.5">Descripción (opcional)</label>
              <textarea formControlName="storeDescription" rows="3" placeholder="Cuéntanos sobre tu tienda..."
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors resize-none"></textarea>
            </div>
          </fieldset>

          <!-- Información fiscal -->
          <fieldset class="bg-bg-surface border border-border rounded-xl p-5 flex flex-col gap-4">
            <legend class="text-xs font-semibold text-text-secondary uppercase tracking-wide px-1">Información fiscal</legend>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-text-secondary mb-1.5">Tipo documento *</label>
                <select formControlName="tipoDocumento"
                  class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                         focus:outline-none focus:border-accent transition-colors"
                  [class.border-error]="isInvalid('tipoDocumento')">
                  <option value="CC">Cédula (CC)</option>
                  <option value="NIT">NIT</option>
                  <option value="CE">Cédula extranjería (CE)</option>
                  <option value="PASSPORT">Pasaporte</option>
                  <option value="TI">Tarjeta identidad (TI)</option>
                </select>
              </div>
              <div>
                <label class="block text-sm text-text-secondary mb-1.5">Número documento *</label>
                <input type="text" formControlName="numeroDocumento" placeholder="900123456-7"
                  class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                         focus:outline-none focus:border-accent transition-colors"
                  [class.border-error]="isInvalid('numeroDocumento')" />
              </div>
            </div>

            <div>
              <label class="block text-sm text-text-secondary mb-1.5">Razón social *</label>
              <input type="text" formControlName="razonSocial" placeholder="Gaming Shop SAS"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors"
                [class.border-error]="isInvalid('razonSocial')" />
            </div>

            <div>
              <label class="block text-sm text-text-secondary mb-1.5">Régimen tributario *</label>
              <select formControlName="tipoRegimen"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors">
                <option value="RESPONSABLE_IVA">Responsable de IVA</option>
                <option value="NO_RESPONSABLE_IVA">No responsable de IVA</option>
              </select>
            </div>
          </fieldset>

          <!-- Ubicación y contacto -->
          <fieldset class="bg-bg-surface border border-border rounded-xl p-5 flex flex-col gap-4">
            <legend class="text-xs font-semibold text-text-secondary uppercase tracking-wide px-1">Contacto y ubicación</legend>

            <div>
              <label class="block text-sm text-text-secondary mb-1.5">Teléfono *</label>
              <input type="tel" formControlName="phone" placeholder="3001234567"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors"
                [class.border-error]="isInvalid('phone')" />
            </div>

            <div>
              <label class="block text-sm text-text-secondary mb-1.5">Dirección *</label>
              <input type="text" formControlName="address" placeholder="Cra 10 # 20-30"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors"
                [class.border-error]="isInvalid('address')" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-text-secondary mb-1.5">Ciudad *</label>
                <input type="text" formControlName="city" placeholder="Bogotá"
                  class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                         focus:outline-none focus:border-accent transition-colors"
                  [class.border-error]="isInvalid('city')" />
              </div>
              <div>
                <label class="block text-sm text-text-secondary mb-1.5">Departamento *</label>
                <select formControlName="department"
                  class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                         focus:outline-none focus:border-accent transition-colors"
                  [class.border-error]="isInvalid('department')">
                  <option value="">Seleccionar</option>
                  @for (dep of departments; track dep) {
                    <option [value]="dep">{{ dep }}</option>
                  }
                </select>
              </div>
            </div>
          </fieldset>

          <button type="submit" [disabled]="saving()"
            class="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold
                   transition-colors flex items-center justify-center gap-2">
            @if (saving()) { <ng-icon name="lucideRefreshCw" size="16" class="animate-spin" /> }
            Enviar solicitud
          </button>
        </form>
      }
    </div>
  `,
})
export class BecomeSellerComponent {
  private sellerService = inject(SellerService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  readonly departments = COLOMBIA_DEPARTMENTS;

  saving = signal(false);
  submitted = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    storeName: ['', Validators.required],
    storeDescription: [''],
    tipoDocumento: ['CC' as TipoDocumento, Validators.required],
    numeroDocumento: ['', Validators.required],
    razonSocial: ['', Validators.required],
    tipoRegimen: ['RESPONSABLE_IVA' as TipoRegimen, Validators.required],
    phone: ['', Validators.required],
    address: ['', Validators.required],
    city: ['', Validators.required],
    department: ['', Validators.required],
  });

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.error.set(null);

    const raw = this.form.getRawValue();
    this.sellerService.register({
      storeName: raw.storeName,
      storeDescription: raw.storeDescription || undefined,
      tipoDocumento: raw.tipoDocumento,
      numeroDocumento: raw.numeroDocumento,
      razonSocial: raw.razonSocial,
      tipoRegimen: raw.tipoRegimen,
      phone: raw.phone,
      address: raw.address,
      city: raw.city,
      department: raw.department,
    }).subscribe({
      next: () => { this.saving.set(false); this.submitted.set(true); },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message ?? 'Error al enviar la solicitud');
      },
    });
  }
}
