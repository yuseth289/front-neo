import { Component, inject, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import * as AuthActions from '../../../core/auth/store/auth.actions';
import { selectAuthLoading, selectAuthError } from '../../../core/auth/store/auth.selectors';
import { FloatingInputComponent } from '../../../shared/components/floating-input/floating-input';
import { PasswordInputComponent } from '../../../shared/components/password-input/password-input';
import { environment } from '../../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, NgIcon, FloatingInputComponent, PasswordInputComponent],
  template: `
    <div class="relative overflow-hidden flex items-center justify-center p-6"
         style="min-height: calc(100vh - 72px);">

      <!-- Ambient backdrop -->
      <div class="absolute inset-0 pointer-events-none">
        <div class="neo-grid-bg absolute inset-0"></div>
        <span class="neo-orb red"  style="width:380px;height:380px;top:-8%;left:10%;"></span>
        <span class="neo-orb cyan" style="width:320px;height:320px;top:20%;right:8%;animation-delay:1.6s;"></span>
      </div>

      <div class="relative w-full max-w-md">

        <div class="neo-reveal text-center mb-7">
          <img src="neogaming-mark.png" alt="" class="w-11 h-11 mx-auto mb-3.5" />
          <h1 class="font-display text-3xl font-bold tracking-[-0.01em]">Bienvenido de vuelta</h1>
          <p class="mt-1.5 text-sm text-text-secondary">Inicia sesión para continuar comprando.</p>
        </div>

        <div class="neo-card-premium neo-reveal p-7">

          @if (error$ | async; as err) {
            <div class="mb-5 flex items-center gap-2 rounded-[10px] bg-error/10 border border-error/30
                        px-3.5 py-2.5 text-sm text-error">
              <ng-icon name="lucideTriangleAlert" size="16" />
              <span>{{ err }}</span>
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="flex flex-col gap-3.5">

            <app-floating-input
              formControlName="email"
              label="Correo electrónico"
              icon="lucideMail"
              type="email"
              autoComplete="email"
              [error]="emailInvalid ? 'Ingresa un correo válido' : null"
            />

            <app-password-input
              formControlName="password"
              label="Contraseña"
              autoComplete="current-password"
              [error]="passwordInvalid ? 'La contraseña es requerida' : null"
            />

            <div class="flex justify-between items-center mt-1">
              <label class="inline-flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" formControlName="remember" class="sr-only" />
                <span class="w-[18px] h-[18px] rounded-[5px] border-[1.5px] flex items-center justify-center transition-all shrink-0"
                      [class]="form.get('remember')!.value
                               ? 'bg-accent border-accent shadow-[0_0_12px_var(--color-accent-glow)]'
                               : 'bg-bg-elevated border-border-strong'">
                  <ng-icon name="lucideCheck" size="11"
                           [class]="form.get('remember')!.value ? 'text-white' : 'text-transparent'" />
                </span>
                <span class="text-sm text-text-primary">Mantener sesión iniciada</span>
              </label>
              <a class="text-sm text-accent hover:underline cursor-pointer">¿Olvidaste tu contraseña?</a>
            </div>

            <button type="submit" [disabled]="loading$ | async"
                    class="neo-btn-primary w-full justify-center !py-3.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
              @if (loading$ | async) {
                <ng-icon name="lucideRefreshCw" size="14" class="neo-spin" />
                Ingresando…
              } @else {
                Ingresar
              }
            </button>

            <!-- Divider -->
            <div class="relative my-1 flex items-center gap-3">
              <span class="flex-1 h-px bg-border"></span>
              <span class="text-[11px] text-text-muted font-mono uppercase tracking-[0.06em]">o continuar con</span>
              <span class="flex-1 h-px bg-border"></span>
            </div>

            <!-- Google button -->
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
                Google
              }
            </button>

            <!-- Contenedor oculto donde se renderiza el botón real de Google -->
            <div #googleBtnRef
                 aria-hidden="true"
                 style="opacity:0;width:0;height:0;overflow:hidden;position:absolute;pointer-events:none;"></div>

            @if (googleError) {
              <p class="text-xs text-error text-center -mt-1">{{ googleError }}</p>
            }

          </form>

          <div class="mt-5 text-center text-sm text-text-secondary">
            ¿Aún no tienes cuenta?
            <a routerLink="/register" class="text-accent font-semibold ml-1.5 hover:underline">Crear cuenta gratis</a>
          </div>
        </div>

        <p class="mt-4 text-center text-[11px] text-text-muted font-mono tracking-[0.04em]">
          PROTEGIDO POR ENCRIPTACIÓN E2E · CUMPLE LEY 1581 / 2012
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  private store = inject(Store);
  private fb    = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  @ViewChild('googleBtnRef') private googleBtnRef!: ElementRef<HTMLDivElement>;

  loading$ = this.store.select(selectAuthLoading);
  error$   = this.store.select(selectAuthError);
  googleError   = '';
  googleLoading = false;

  form = this.fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    remember: [true],
  });

  get emailInvalid()    { const c = this.form.get('email')!;    return c.invalid && c.touched; }
  get passwordInvalid() { const c = this.form.get('password')!; return c.invalid && c.touched; }

  ngOnInit(): void { this.store.dispatch(AuthActions.clearError()); }

  ngAfterViewInit(): void {
    if (typeof google === 'undefined' || !environment.googleClientId) return;
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (res: { credential: string }) => this.handleGoogleCredential(res.credential),
    });
    google.accounts.id.renderButton(this.googleBtnRef.nativeElement, {
      type: 'icon',
      size: 'medium',
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

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
        callback: (res: { credential: string }) => this.handleGoogleCredential(res.credential),
      });
      google.accounts.id.renderButton(this.googleBtnRef.nativeElement, { type: 'icon', size: 'medium' });
      setTimeout(tryClick, 300);
    }
  }

  handleGoogleCredential(idToken: string): void {
    this.googleLoading = false;
    this.googleError   = '';
    this.store.dispatch(AuthActions.googleLogin({ idToken }));
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { email, password } = this.form.getRawValue();
    this.store.dispatch(AuthActions.login({ credentials: { email, password } }));
  }
}
