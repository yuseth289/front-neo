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

const BENEFITS = [
  { icon: 'lucideUsers',       title: '+ 84.000 gamers activos',  body: 'Usuarios verificados con poder de compra.' },
  { icon: 'lucideZap',         title: 'Activación en 24 horas',   body: 'Equipo dedicado revisando aplicaciones.' },
  { icon: 'lucideShieldCheck', title: 'Pagos protegidos',          body: 'Recibes tu dinero solo cuando se entrega.' },
  { icon: 'lucideSparkles',    title: 'Promoción con IA',          body: 'Tu producto aparece en recomendaciones inteligentes.' },
];

const STEPS = ['Tienda', 'Documentos', 'Ubicación'];

@Component({
  selector: 'app-become-seller',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgIcon],
  template: `
    <div class="relative">
      <!-- Ambient backdrop -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden -z-[1]">
        <div class="neo-grid-bg absolute inset-0 opacity-20"></div>
        <span class="neo-orb red"  style="width:380px;height:380px;top:-5%;right:-5%;opacity:0.1;"></span>
        <span class="neo-orb cyan" style="width:280px;height:280px;bottom:10%;left:-5%;opacity:0.07;animation-delay:2s;"></span>
      </div>

      <div class="relative max-w-[1100px] mx-auto px-4 py-8">

        @if (submitted()) {
          <!-- ── SUCCESS ──────────────────────────────────────────── -->
          <div class="flex justify-center neo-reveal">
            <div class="neo-card-premium p-10 max-w-[540px] w-full text-center">
              <div class="w-16 h-16 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto mb-5
                          shadow-[0_0_32px_var(--color-accent-glow)]">
                <ng-icon name="lucideRocket" size="28" class="text-accent" />
              </div>
              <h1 class="font-display text-[28px] font-bold text-text-primary">Solicitud enviada</h1>
              <p class="mt-3 text-sm text-text-secondary leading-relaxed max-w-[400px] mx-auto">
                Nuestro equipo revisará tu información en las próximas 24 horas.
                Te enviaremos un correo con la decisión.
              </p>
              <div class="mt-5 flex gap-3 justify-center">
                <a routerLink="/" class="neo-btn-outline !text-[13px] !py-2.5 !px-4">
                  Volver al inicio
                </a>
                <a routerLink="/seller/dashboard" class="neo-btn-primary !text-[13px] !py-2.5 !px-4">
                  <ng-icon name="lucideLayoutDashboard" size="14" />
                  Ir al panel
                </a>
              </div>
            </div>
          </div>

        } @else {
          <!-- ── HEADER ─────────────────────────────────────────── -->
          <div class="neo-reveal mb-6">
            <p class="neo-stat-label">Programa de vendedores</p>
            <h1 class="font-display text-[32px] font-bold tracking-[-0.02em] text-text-primary mt-1">
              Conviértete en vendedor NeoGaming
            </h1>
            <p class="text-sm text-text-secondary mt-2 max-w-[680px] leading-relaxed">
              Vende a miles de gamers colombianos con cero costos de mensualidad.
              Solo pagas una comisión por venta confirmada.
            </p>
          </div>

          <!-- ── STEP INDICATOR ─────────────────────────────────── -->
          <div class="neo-reveal mb-7">
            <div class="flex items-center gap-0 max-w-[480px]">
              @for (s of steps; track $index) {
                <div class="flex items-center" [class.flex-1]="$index < steps.length - 1">
                  <div class="flex items-center gap-2 shrink-0">
                    <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all"
                      [style.background]="$index < currentStep() ? 'var(--color-success)' :
                                          $index === currentStep() ? 'var(--color-accent)' : 'var(--color-bg-elevated)'"
                      [style.border-color]="$index < currentStep() ? 'var(--color-success)' :
                                            $index === currentStep() ? 'var(--color-accent)' : 'var(--color-border)'"
                      [style.box-shadow]="$index === currentStep() ? '0 0 12px var(--color-accent-glow)' : 'none'"
                      [style.color]="$index <= currentStep() ? 'white' : 'var(--color-text-muted)'">
                      @if ($index < currentStep()) {
                        <ng-icon name="lucideCheck" size="12" />
                      } @else {
                        {{ $index + 1 }}
                      }
                    </div>
                    <span class="text-[12px] font-medium hidden sm:block"
                      [style.color]="$index === currentStep() ? 'var(--color-text-primary)' : 'var(--color-text-muted)'">
                      {{ s }}
                    </span>
                  </div>
                  @if ($index < steps.length - 1) {
                    <div class="flex-1 h-px mx-3 transition-colors"
                      [style.background]="$index < currentStep() ? 'var(--color-success)' : 'var(--color-border)'">
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- ── ERROR ──────────────────────────────────────────── -->
          @if (error()) {
            <div class="mb-5 flex items-center gap-2 rounded-[10px] bg-error/10 border border-error/30
                        px-3.5 py-2.5 text-sm text-error neo-reveal">
              <ng-icon name="lucideTriangleAlert" size="16" /><span>{{ error() }}</span>
            </div>
          }

          <!-- ── LAYOUT GRID ─────────────────────────────────────── -->
          <div class="grid lg:grid-cols-[1fr_300px] gap-6 items-start">

            <!-- Left: steps -->
            <div class="flex flex-col gap-5 neo-reveal" [formGroup]="form">

              <!-- ── STEP 0: Tienda ── -->
              @if (currentStep() === 0) {
                <div class="neo-card-premium p-5">
                  <div class="flex items-start gap-3 mb-5">
                    <div class="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
                      <ng-icon name="lucideStore" size="15" class="text-accent" />
                    </div>
                    <div>
                      <h2 class="text-sm font-semibold text-text-primary">Información de la tienda</h2>
                      <p class="text-[12px] text-text-muted mt-0.5">Así te verán los compradores en NeoGaming.</p>
                    </div>
                  </div>

                  <div class="flex flex-col gap-4">
                    <div>
                      <label class="block text-[12px] font-medium text-text-secondary mb-1.5">
                        Nombre de la tienda <span class="text-error">*</span>
                      </label>
                      <input type="text" formControlName="storeName" placeholder="Ej: NeoTech Bogotá"
                        class="w-full rounded-[10px] bg-bg-elevated border px-3.5 py-2.5 text-sm text-text-primary
                               placeholder:text-text-muted transition-all duration-200 outline-none
                               focus:ring-2 focus:ring-accent/8 focus:border-accent"
                        [class.border-error]="isInvalid('storeName')"
                        [class.border-border]="!isInvalid('storeName')" />
                      @if (isInvalid('storeName')) {
                        <p class="mt-1 text-[11px] text-error">El nombre es obligatorio.</p>
                      }
                    </div>

                    <div>
                      <label class="block text-[12px] font-medium text-text-secondary mb-1.5">
                        Descripción de la tienda
                        <span class="text-text-muted font-normal">(opcional)</span>
                      </label>
                      <textarea formControlName="storeDescription" rows="4"
                        placeholder="¿Qué te diferencia? ¿Qué marcas trabajas?"
                        class="w-full rounded-[10px] bg-bg-elevated border border-border px-3.5 py-2.5 text-sm text-text-primary
                               placeholder:text-text-muted transition-all duration-200 outline-none resize-none
                               focus:ring-2 focus:ring-accent/8 focus:border-accent"></textarea>
                    </div>
                  </div>
                </div>
              }

              <!-- ── STEP 1: Documentos ── -->
              @if (currentStep() === 1) {
                <div class="neo-card-premium p-5">
                  <div class="flex items-start gap-3 mb-5">
                    <div class="w-8 h-8 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center shrink-0">
                      <ng-icon name="lucideShieldCheck" size="15" class="text-neon-cyan" />
                    </div>
                    <div>
                      <h2 class="text-sm font-semibold text-text-primary">Identidad y documentos</h2>
                      <p class="text-[12px] text-text-muted mt-0.5">Necesitamos verificar la identidad legal antes de habilitar pagos.</p>
                    </div>
                  </div>

                  <div class="flex flex-col gap-4">
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-[12px] font-medium text-text-secondary mb-1.5">
                          Tipo de persona <span class="text-error">*</span>
                        </label>
                        <select formControlName="tipoDocumento"
                          class="w-full rounded-[10px] bg-bg-elevated border border-border px-3.5 py-2.5 text-sm text-text-primary
                                 transition-all duration-200 outline-none focus:ring-2 focus:ring-accent/8 focus:border-accent">
                          <option value="NIT">Persona jurídica (NIT)</option>
                          <option value="CC">Persona natural (CC)</option>
                          <option value="CE">Cédula extranjería (CE)</option>
                          <option value="PASSPORT">Pasaporte</option>
                          <option value="TI">Tarjeta identidad (TI)</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-[12px] font-medium text-text-secondary mb-1.5">
                          {{ form.get('tipoDocumento')?.value === 'NIT' ? 'NIT' : 'Número de documento' }}
                          <span class="text-error">*</span>
                        </label>
                        <input type="text" formControlName="numeroDocumento" placeholder="900123456-7"
                          class="w-full rounded-[10px] bg-bg-elevated border px-3.5 py-2.5 text-sm text-text-primary
                                 placeholder:text-text-muted transition-all duration-200 outline-none
                                 focus:ring-2 focus:ring-accent/8 focus:border-accent"
                          [class.border-error]="isInvalid('numeroDocumento')"
                          [class.border-border]="!isInvalid('numeroDocumento')" />
                      </div>
                    </div>

                    <div>
                      <label class="block text-[12px] font-medium text-text-secondary mb-1.5">
                        {{ form.get('tipoDocumento')?.value === 'NIT' ? 'Razón social' : 'Nombre completo' }}
                        <span class="text-error">*</span>
                      </label>
                      <input type="text" formControlName="razonSocial" placeholder="Gaming Shop SAS"
                        class="w-full rounded-[10px] bg-bg-elevated border px-3.5 py-2.5 text-sm text-text-primary
                               placeholder:text-text-muted transition-all duration-200 outline-none
                               focus:ring-2 focus:ring-accent/8 focus:border-accent"
                        [class.border-error]="isInvalid('razonSocial')"
                        [class.border-border]="!isInvalid('razonSocial')" />
                    </div>

                    <div>
                      <label class="block text-[12px] font-medium text-text-secondary mb-1.5">
                        Régimen tributario <span class="text-error">*</span>
                      </label>
                      <select formControlName="tipoRegimen"
                        class="w-full rounded-[10px] bg-bg-elevated border border-border px-3.5 py-2.5 text-sm text-text-primary
                               transition-all duration-200 outline-none focus:ring-2 focus:ring-accent/8 focus:border-accent">
                        <option value="RESPONSABLE_IVA">Responsable de IVA</option>
                        <option value="NO_RESPONSABLE_IVA">No responsable de IVA</option>
                      </select>
                    </div>

                    <!-- Commission notice -->
                    <div class="flex gap-2.5 p-3.5 rounded-[10px] bg-bg-elevated border border-border">
                      <ng-icon name="lucideInfo" size="16" class="text-neon-cyan shrink-0 mt-0.5" />
                      <p class="text-[12px] text-text-secondary leading-relaxed">
                        Comisión por venta confirmada:
                        <span class="text-text-primary font-semibold">9%</span> + retenciones de ley.
                        Los pagos se transfieren cada lunes.
                      </p>
                    </div>
                  </div>
                </div>
              }

              <!-- ── STEP 2: Ubicación ── -->
              @if (currentStep() === 2) {
                <div class="neo-card-premium p-5">
                  <div class="flex items-start gap-3 mb-5">
                    <div class="w-8 h-8 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center shrink-0">
                      <ng-icon name="lucideMapPin" size="15" class="text-success" />
                    </div>
                    <div>
                      <h2 class="text-sm font-semibold text-text-primary">Contacto y ubicación</h2>
                      <p class="text-[12px] text-text-muted mt-0.5">¿Dónde opera tu negocio?</p>
                    </div>
                  </div>

                  <div class="flex flex-col gap-4">
                    <div>
                      <label class="block text-[12px] font-medium text-text-secondary mb-1.5">
                        Teléfono de contacto <span class="text-error">*</span>
                      </label>
                      <div class="relative">
                        <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-text-muted">+57</span>
                        <input type="tel" formControlName="phone" placeholder="3001234567"
                          class="w-full rounded-[10px] bg-bg-elevated border px-3.5 pl-12 py-2.5 text-sm text-text-primary
                                 placeholder:text-text-muted transition-all duration-200 outline-none
                                 focus:ring-2 focus:ring-accent/8 focus:border-accent"
                          [class.border-error]="isInvalid('phone')"
                          [class.border-border]="!isInvalid('phone')" />
                      </div>
                    </div>

                    <div>
                      <label class="block text-[12px] font-medium text-text-secondary mb-1.5">
                        Dirección <span class="text-error">*</span>
                      </label>
                      <input type="text" formControlName="address" placeholder="Cra 10 # 20-30"
                        class="w-full rounded-[10px] bg-bg-elevated border px-3.5 py-2.5 text-sm text-text-primary
                               placeholder:text-text-muted transition-all duration-200 outline-none
                               focus:ring-2 focus:ring-accent/8 focus:border-accent"
                        [class.border-error]="isInvalid('address')"
                        [class.border-border]="!isInvalid('address')" />
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-[12px] font-medium text-text-secondary mb-1.5">
                          Ciudad <span class="text-error">*</span>
                        </label>
                        <input type="text" formControlName="city" placeholder="Bogotá"
                          class="w-full rounded-[10px] bg-bg-elevated border px-3.5 py-2.5 text-sm text-text-primary
                                 placeholder:text-text-muted transition-all duration-200 outline-none
                                 focus:ring-2 focus:ring-accent/8 focus:border-accent"
                          [class.border-error]="isInvalid('city')"
                          [class.border-border]="!isInvalid('city')" />
                      </div>
                      <div>
                        <label class="block text-[12px] font-medium text-text-secondary mb-1.5">
                          Departamento <span class="text-error">*</span>
                        </label>
                        <select formControlName="department"
                          class="w-full rounded-[10px] bg-bg-elevated border px-3.5 py-2.5 text-sm text-text-primary
                                 transition-all duration-200 outline-none focus:ring-2 focus:ring-accent/8 focus:border-accent"
                          [class.border-error]="isInvalid('department')"
                          [class.border-border]="!isInvalid('department')">
                          <option value="">Seleccionar</option>
                          @for (dep of departments; track dep) {
                            <option [value]="dep">{{ dep }}</option>
                          }
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              }

              <!-- ── ACTIONS ── -->
              <div class="flex items-center gap-3">
                @if (currentStep() < 2) {
                  <button type="button" (click)="nextStep()"
                    class="neo-btn-primary !py-3 !px-6">
                    Continuar
                    <ng-icon name="lucideArrowRight" size="14" />
                  </button>
                } @else {
                  <button type="button" (click)="submit()" [disabled]="saving()"
                    class="neo-btn-primary !py-3 !px-6 disabled:opacity-50 disabled:cursor-not-allowed">
                    @if (saving()) {
                      <ng-icon name="lucideRefreshCw" size="15" class="neo-spin" />
                      Enviando…
                    } @else {
                      <ng-icon name="lucideRocket" size="15" />
                      Enviar solicitud
                      <ng-icon name="lucideArrowRight" size="14" />
                    }
                  </button>
                }

                <button type="button" (click)="prevStep()"
                  class="neo-btn-outline !py-3 !px-4">
                  <ng-icon name="lucideChevronLeft" size="14" />
                  {{ currentStep() === 0 ? 'Cancelar' : 'Atrás' }}
                </button>
              </div>

            </div><!-- /left -->

            <!-- ── RIGHT RAIL ─────────────────────────────────────── -->
            <aside style="position:sticky;top:92px;">
              <div class="neo-card-premium p-5 neo-reveal">
                <p class="font-display text-base font-bold text-text-primary mb-4">
                  Por qué vender en NeoGaming
                </p>
                <div class="flex flex-col">
                  @for (b of benefits; track $index) {
                    <div class="flex gap-3 py-3"
                         [class.border-t]="$index > 0"
                         [class.border-border]="$index > 0">
                      <div class="w-8 h-8 rounded-lg bg-bg-elevated border border-border flex items-center justify-center shrink-0">
                        <ng-icon [name]="b.icon" size="14" class="text-accent" />
                      </div>
                      <div>
                        <p class="text-[13px] font-semibold text-text-primary">{{ b.title }}</p>
                        <p class="text-[12px] text-text-secondary mt-0.5 leading-snug">{{ b.body }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Step progress hint -->
              <div class="mt-3 px-4 py-3 rounded-[10px] bg-bg-surface border border-border neo-reveal">
                <p class="text-[11px] text-text-muted font-mono uppercase tracking-wide mb-1">Progreso</p>
                <div class="flex gap-1">
                  @for (_ of steps; track $index) {
                    <div class="flex-1 h-1 rounded-full transition-all duration-300"
                      [style.background]="$index <= currentStep() ? 'var(--color-accent)' : 'var(--color-border)'">
                    </div>
                  }
                </div>
                <p class="text-[11px] text-text-secondary mt-2">
                  Paso {{ currentStep() + 1 }} de {{ steps.length }}
                </p>
              </div>
            </aside>

          </div>
        }

      </div>
    </div>
  `,
})
export class BecomeSellerComponent {
  private sellerService = inject(SellerService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  readonly departments = COLOMBIA_DEPARTMENTS;
  readonly steps = STEPS;
  readonly benefits = BENEFITS;

  saving      = signal(false);
  submitted   = signal(false);
  error       = signal<string | null>(null);
  currentStep = signal(0);

  form = this.fb.nonNullable.group({
    storeName:        ['', Validators.required],
    storeDescription: [''],
    tipoDocumento:    ['CC' as TipoDocumento, Validators.required],
    numeroDocumento:  ['', Validators.required],
    razonSocial:      ['', Validators.required],
    tipoRegimen:      ['RESPONSABLE_IVA' as TipoRegimen, Validators.required],
    phone:            ['', Validators.required],
    address:          ['', Validators.required],
    city:             ['', Validators.required],
    department:       ['', Validators.required],
  });

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  nextStep(): void {
    const stepFields: Record<number, string[]> = {
      0: ['storeName'],
      1: ['tipoDocumento', 'numeroDocumento', 'razonSocial', 'tipoRegimen'],
    };
    const fields = stepFields[this.currentStep()] ?? [];
    fields.forEach((f) => this.form.get(f)?.markAsTouched());
    const hasError = fields.some((f) => this.form.get(f)?.invalid);
    if (!hasError) this.currentStep.update((s) => s + 1);
  }

  prevStep(): void {
    if (this.currentStep() === 0) {
      this.router.navigate(['/account']);
    } else {
      this.currentStep.update((s) => s - 1);
    }
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set(null);

    const raw = this.form.getRawValue();
    this.sellerService.register({
      storeName:        raw.storeName,
      storeDescription: raw.storeDescription || undefined,
      tipoDocumento:    raw.tipoDocumento,
      numeroDocumento:  raw.numeroDocumento,
      razonSocial:      raw.razonSocial,
      tipoRegimen:      raw.tipoRegimen,
      phone:            raw.phone,
      address:          raw.address,
      city:             raw.city,
      department:       raw.department,
    }).subscribe({
      next:  () => { this.saving.set(false); this.submitted.set(true); },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message ?? 'Error al enviar la solicitud');
      },
    });
  }
}
