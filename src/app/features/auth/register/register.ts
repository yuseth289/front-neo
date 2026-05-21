import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import * as AuthActions from '../../../core/auth/store/auth.actions';
import { selectAuthLoading, selectAuthError } from '../../../core/auth/store/auth.selectors';

function phoneValidator(control: AbstractControl): ValidationErrors | null {
  const val: string = control.value ?? '';
  return /^\+?[0-9]{7,15}$/.test(val.replace(/\s/g, '')) ? null : { phone: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, NgIcon],
  template: `
    <div class="min-h-screen bg-bg-base flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-md">

        <!-- Logo -->
        <div class="text-center mb-8">
          <a routerLink="/" class="inline-block">
            <span class="text-2xl font-black tracking-tight text-text-primary">
              NEO<span class="text-accent">GAMING</span>
            </span>
          </a>
          <p class="mt-2 text-text-secondary text-sm">Crea tu cuenta y empieza a jugar</p>
        </div>

        <!-- Card -->
        <div class="bg-bg-surface border border-border rounded-xl p-8">

          <!-- Error global -->
          @if (error$ | async; as error) {
            <div class="mb-5 flex items-center gap-2 rounded-lg bg-error/10 border border-error/30 px-4 py-3 text-sm text-error">
              <ng-icon name="lucideTriangleAlert" size="16" />
              <span>{{ error }}</span>
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>

            <!-- Nombre y Apellido -->
            <div class="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1.5">Nombre</label>
                <input
                  type="text"
                  formControlName="firstName"
                  placeholder="Juan"
                  autocomplete="given-name"
                  class="w-full rounded-lg bg-bg-elevated border border-border px-4 py-2.5 text-text-primary placeholder-text-muted text-sm
                         focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  [class.border-error]="isInvalid('firstName')"
                />
                @if (isInvalid('firstName')) {
                  <p class="mt-1 text-xs text-error">Requerido</p>
                }
              </div>
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1.5">Apellido</label>
                <input
                  type="text"
                  formControlName="lastName"
                  placeholder="Pérez"
                  autocomplete="family-name"
                  class="w-full rounded-lg bg-bg-elevated border border-border px-4 py-2.5 text-text-primary placeholder-text-muted text-sm
                         focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  [class.border-error]="isInvalid('lastName')"
                />
                @if (isInvalid('lastName')) {
                  <p class="mt-1 text-xs text-error">Requerido</p>
                }
              </div>
            </div>

            <!-- Email -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-text-secondary mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                formControlName="email"
                placeholder="tu@correo.com"
                autocomplete="email"
                class="w-full rounded-lg bg-bg-elevated border border-border px-4 py-2.5 text-text-primary placeholder-text-muted text-sm
                       focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                [class.border-error]="isInvalid('email')"
              />
              @if (isInvalid('email')) {
                <p class="mt-1 text-xs text-error">Ingresa un correo válido</p>
              }
            </div>

            <!-- Teléfono -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-text-secondary mb-1.5">
                Teléfono
              </label>
              <input
                type="tel"
                formControlName="phone"
                placeholder="3001234567"
                autocomplete="tel"
                class="w-full rounded-lg bg-bg-elevated border border-border px-4 py-2.5 text-text-primary placeholder-text-muted text-sm
                       focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                [class.border-error]="isInvalid('phone')"
              />
              @if (isInvalid('phone')) {
                <p class="mt-1 text-xs text-error">Ingresa un teléfono válido (7-15 dígitos)</p>
              }
            </div>

            <!-- Password -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-text-secondary mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                formControlName="password"
                placeholder="Mínimo 8 caracteres"
                autocomplete="new-password"
                class="w-full rounded-lg bg-bg-elevated border border-border px-4 py-2.5 text-text-primary placeholder-text-muted text-sm
                       focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                [class.border-error]="isInvalid('password')"
              />
              @if (isInvalid('password')) {
                <p class="mt-1 text-xs text-error">Mínimo 8 caracteres</p>
              }
            </div>

            <!-- Confirm password -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-text-secondary mb-1.5">
                Confirmar contraseña
              </label>
              <input
                type="password"
                formControlName="confirmPassword"
                placeholder="Repite tu contraseña"
                autocomplete="new-password"
                class="w-full rounded-lg bg-bg-elevated border border-border px-4 py-2.5 text-text-primary placeholder-text-muted text-sm
                       focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                [class.border-error]="confirmInvalid"
              />
              @if (confirmInvalid) {
                <p class="mt-1 text-xs text-error">Las contraseñas no coinciden</p>
              }
            </div>

            <!-- Submit -->
            <button
              type="submit"
              [disabled]="loading$ | async"
              class="w-full rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed
                     px-4 py-2.5 text-sm font-semibold text-white transition-colors
                     shadow-[0_0_16px_theme(colors.accent-glow)]"
            >
              @if (loading$ | async) {
                <span class="flex items-center justify-center gap-2">
                  <ng-icon name="lucideRefreshCw" size="14" class="animate-spin" />
                  Creando cuenta...
                </span>
              } @else {
                Crear cuenta
              }
            </button>

          </form>

          <!-- Footer links -->
          <div class="mt-6 text-center text-sm text-text-secondary">
            ¿Ya tienes cuenta?
            <a routerLink="/login" class="text-accent hover:text-accent-hover font-medium ml-1">
              Ingresar
            </a>
          </div>

        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  loading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);

  form = this.fb.nonNullable.group(
    {
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, phoneValidator]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

  isInvalid(field: string): boolean {
    const c = this.form.get(field)!;
    return c.invalid && c.touched;
  }

  get confirmInvalid(): boolean {
    const c = this.form.get('confirmPassword')!;
    return (c.touched || this.form.touched) && this.form.hasError('passwordsMismatch');
  }

  ngOnInit(): void {
    this.store.dispatch(AuthActions.clearError());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { confirmPassword, ...data } = this.form.getRawValue();
    this.store.dispatch(AuthActions.register({ data }));
  }
}

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw === confirm ? null : { passwordsMismatch: true };
}
