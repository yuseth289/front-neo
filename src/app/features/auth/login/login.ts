import { Component, inject, OnInit, OnDestroy } from '@angular/core';
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
                <input type="checkbox" formControlName="remember"
                       class="w-[18px] h-[18px] rounded-[5px] bg-bg-elevated border-[1.5px] border-border-strong
                              accent-accent cursor-pointer" />
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
export class LoginComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private fb    = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  loading$ = this.store.select(selectAuthLoading);
  error$   = this.store.select(selectAuthError);

  form = this.fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    remember: [true],
  });

  get emailInvalid()    { const c = this.form.get('email')!;    return c.invalid && c.touched; }
  get passwordInvalid() { const c = this.form.get('password')!; return c.invalid && c.touched; }

  ngOnInit(): void { this.store.dispatch(AuthActions.clearError()); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { email, password } = this.form.getRawValue();
    this.store.dispatch(AuthActions.login({ credentials: { email, password } }));
  }
}
