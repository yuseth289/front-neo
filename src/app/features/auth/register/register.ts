import { Component, inject, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
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
import { environment } from '../../../../environments/environment';

declare const google: any;

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
                    <a routerLink="/terms" target="_blank" rel="noopener"
                       class="text-accent hover:underline">Términos y Condiciones</a>
                    y la
                    <a routerLink="/terms" target="_blank" rel="noopener"
                       class="text-accent hover:underline">Política de Privacidad</a>.
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

            <!-- Divider -->
            <div class="flex items-center gap-3 my-1">
              <div class="flex-1 h-px bg-border"></div>
              <span class="text-[11px] text-text-muted font-mono">O</span>
              <div class="flex-1 h-px bg-border"></div>
            </div>

            <!-- Google Sign-Up -->
            <button type="button" (click)="loginWithGoogle()"
                    [disabled]="googleLoading"
                    class="neo-btn-outline w-full justify-center !py-3
                           disabled:opacity-50 disabled:cursor-not-allowed">
              @if (googleLoading) {
                <ng-icon name="lucideRefreshCw" size="16" class="neo-spin" />
                Conectando…
              } @else {
                <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              }
            </button>
            <div #googleBtnRef aria-hidden="true"
                 style="opacity:0;width:0;height:0;overflow:hidden;position:absolute;pointer-events:none;"></div>
            @if (googleError) {
              <p class="text-xs text-error text-center -mt-1">{{ googleError }}</p>
            }

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
export class RegisterComponent implements OnInit, OnDestroy, AfterViewInit {
  private store = inject(Store);
  private fb    = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  @ViewChild('googleBtnRef') googleBtnRef!: ElementRef;

  loading$ = this.store.select(selectAuthLoading);
  error$   = this.store.select(selectAuthError);

  googleLoading = false;
  googleError   = '';

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

  ngAfterViewInit(): void {
    if (typeof google === 'undefined' || !environment.googleClientId) return;
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (res: { credential: string }) => {
        this.googleLoading = false;
        this.googleError   = '';
        this.store.dispatch(AuthActions.googleLogin({ idToken: res.credential }));
      },
    });
    google.accounts.id.renderButton(this.googleBtnRef.nativeElement, { type: 'icon', size: 'medium' });
  }

  loginWithGoogle(): void {
    if (typeof google === 'undefined' || !environment.googleClientId) {
      this.googleError = 'Google Sign-In no disponible. Recarga la página.';
      return;
    }
    this.googleLoading = true;
    this.googleError   = '';

    const tryClick = () => {
      const btn = this.googleBtnRef?.nativeElement?.querySelector('[role="button"]') as HTMLElement | null;
      if (btn) {
        btn.click();
      } else {
        this.googleLoading = false;
        this.googleError   = 'Google Sign-In no disponible. Recarga la página.';
      }
    };

    if (this.googleBtnRef?.nativeElement?.querySelector('[role="button"]')) {
      tryClick();
    } else {
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (res: { credential: string }) => {
          this.googleLoading = false;
          this.googleError   = '';
          this.store.dispatch(AuthActions.googleLogin({ idToken: res.credential }));
        },
      });
      google.accounts.id.renderButton(this.googleBtnRef.nativeElement, { type: 'icon', size: 'medium' });
      setTimeout(tryClick, 300);
    }
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { confirmPassword: _, terms: __, marketing: ___, ...data } = this.form.getRawValue();
    this.store.dispatch(AuthActions.register({ data }));
  }
}
