import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import * as AuthActions from '../../../core/auth/store/auth.actions';
import { selectAuthLoading, selectAuthError } from '../../../core/auth/store/auth.selectors';
import { FloatingInputComponent } from '../../../shared/components/floating-input/floating-input';
import { PasswordInputComponent } from '../../../shared/components/password-input/password-input';

function phoneValidator(control: AbstractControl): ValidationErrors | null {
  const val: string = control.value ?? '';
  if (!val) return null;
  return /^\+?[0-9]{7,15}$/.test(val.replace(/\s/g, '')) ? null : { phone: true };
}

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pw      = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw === confirm ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, NgIcon, FloatingInputComponent, PasswordInputComponent],
  template: `
    <div class="relative overflow-hidden flex items-center justify-center p-6"
         style="min-height: calc(100vh - 72px);">

      <!-- Ambient backdrop -->
      <div class="absolute inset-0 pointer-events-none">
        <div class="neo-grid-bg absolute inset-0"></div>
        <span class="neo-orb red"  style="width:420px;height:420px;top:-10%;left:5%;"></span>
        <span class="neo-orb cyan" style="width:360px;height:360px;bottom:-5%;right:6%;animation-delay:1.8s;"></span>
      </div>

      <div class="relative w-full max-w-[540px]">

        <!-- Header -->
        <div class="neo-reveal text-center mb-7">
          <img src="neogaming-mark.png" alt="" class="w-11 h-11 mx-auto mb-3.5" />
          <h1 class="font-display text-[28px] font-bold tracking-[-0.01em]">Crear cuenta gratis</h1>
          <p class="mt-1.5 text-sm text-text-secondary">
            Únete a la comunidad gamer de Colombia. Tarda menos de un minuto.
          </p>
        </div>

        <div class="neo-card-premium neo-reveal p-7">

          <!-- Error banner -->
          @if (error$ | async; as err) {
            <div class="mb-5 flex items-center gap-2 rounded-[10px] bg-error/10 border border-error/30
                        px-3.5 py-2.5 text-sm text-error">
              <ng-icon name="lucideTriangleAlert" size="16" />
              <span>{{ err }}</span>
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="flex flex-col gap-3.5">

            <!-- Nombre + Apellido -->
            <div class="grid grid-cols-2 gap-3">
              <app-floating-input
                formControlName="firstName"
                label="Nombre"
                icon="lucideUser"
                autoComplete="given-name"
                [error]="isInvalid('firstName') ? 'Requerido' : null"
              />
              <app-floating-input
                formControlName="lastName"
                label="Apellido"
                autoComplete="family-name"
                [error]="isInvalid('lastName') ? 'Requerido' : null"
              />
            </div>

            <!-- Email -->
            <app-floating-input
              formControlName="email"
              label="Correo electrónico"
              icon="lucideMail"
              type="email"
              autoComplete="email"
              hint="Lo usaremos para tus pedidos y recuperación de cuenta."
              [error]="isInvalid('email') ? 'Ingresa un correo válido' : null"
            />

            <!-- Teléfono -->
            <app-floating-input
              formControlName="phone"
              label="Celular"
              icon="lucidePhone"
              type="tel"
              autoComplete="tel-national"
              hint="Opcional · te avisamos del despacho por SMS."
              [error]="isInvalid('phone') ? 'Ingresa un teléfono válido (7–15 dígitos)' : null"
            />

            <!-- Contraseña -->
            <app-password-input
              formControlName="password"
              label="Contraseña"
              autoComplete="new-password"
              [showStrength]="true"
              [error]="isInvalid('password') ? 'Mínimo 8 caracteres' : null"
            />

            <!-- Confirmar contraseña -->
            <app-password-input
              formControlName="confirmPassword"
              label="Confirmar contraseña"
              autoComplete="new-password"
              [error]="confirmInvalid ? 'Las contraseñas no coinciden' : null"
            />

            <!-- Divider -->
            <div class="border-t border-border my-1 pt-2 flex flex-col gap-3">

              <!-- Términos -->
              <label class="flex items-start gap-2.5 cursor-pointer select-none group">
                <input type="checkbox" formControlName="terms"
                       class="mt-0.5 w-[18px] h-[18px] shrink-0 rounded-[5px] bg-bg-elevated
                              border-[1.5px] border-border-strong accent-accent cursor-pointer" />
                <div>
                  <span class="text-sm text-text-primary">
                    Acepto los
                    <a class="text-accent hover:underline">Términos</a>
                    y la
                    <a class="text-accent hover:underline">Política de Privacidad</a>.
                  </span>
                  @if (termsInvalid) {
                    <p class="mt-0.5 text-xs text-error">Debes aceptar los términos para continuar</p>
                  }
                </div>
              </label>

              <!-- Marketing -->
              <label class="flex items-start gap-2.5 cursor-pointer select-none">
                <input type="checkbox" formControlName="marketing"
                       class="mt-0.5 w-[18px] h-[18px] shrink-0 rounded-[5px] bg-bg-elevated
                              border-[1.5px] border-border-strong accent-accent cursor-pointer" />
                <div>
                  <span class="text-sm text-text-secondary">Quiero recibir ofertas y novedades gamer.</span>
                  <p class="text-xs text-text-muted mt-0.5">Puedes darte de baja cuando quieras desde la cuenta.</p>
                </div>
              </label>

            </div>

            <!-- Submit -->
            <button type="submit" [disabled]="loading$ | async"
                    class="neo-btn-primary w-full justify-center !py-3.5 mt-1
                           disabled:opacity-50 disabled:cursor-not-allowed">
              @if (loading$ | async) {
                <ng-icon name="lucideRefreshCw" size="14" class="neo-spin" />
                Creando cuenta…
              } @else {
                Crear cuenta
                <ng-icon name="lucideArrowRight" size="14" />
              }
            </button>

          </form>

          <div class="mt-5 text-center text-sm text-text-secondary">
            ¿Ya tienes cuenta?
            <a routerLink="/login" class="text-accent font-semibold ml-1.5 hover:underline">Inicia sesión</a>
          </div>
        </div>

        <p class="mt-4 text-center text-[11px] text-text-muted font-mono tracking-[0.04em]">
          PROTEGIDO POR ENCRIPTACIÓN E2E · CUMPLE LEY 1581 / 2012
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private fb    = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  loading$ = this.store.select(selectAuthLoading);
  error$   = this.store.select(selectAuthError);

  form = this.fb.nonNullable.group(
    {
      firstName:       ['', Validators.required],
      lastName:        ['', Validators.required],
      email:           ['', [Validators.required, Validators.email]],
      phone:           ['', phoneValidator],
      password:        ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      terms:           [false, Validators.requiredTrue],
      marketing:       [true],
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

  get termsInvalid(): boolean {
    const c = this.form.get('terms')!;
    return c.invalid && c.touched;
  }

  ngOnInit(): void  { this.store.dispatch(AuthActions.clearError()); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { confirmPassword: _, terms: __, marketing: ___, ...data } = this.form.getRawValue();
    this.store.dispatch(AuthActions.register({ data }));
  }
}
