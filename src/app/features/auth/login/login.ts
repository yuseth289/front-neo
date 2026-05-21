import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import * as AuthActions from '../../../core/auth/store/auth.actions';
import { selectAuthLoading, selectAuthError } from '../../../core/auth/store/auth.selectors';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, NgIcon],
  template: `
    <div class="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div class="w-full max-w-md">

        <!-- Logo -->
        <div class="text-center mb-8">
          <a routerLink="/" class="inline-block">
            <span class="text-2xl font-black tracking-tight text-text-primary">
              NEO<span class="text-accent">GAMING</span>
            </span>
          </a>
          <p class="mt-2 text-text-secondary text-sm">Inicia sesión en tu cuenta</p>
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
                [class.border-error]="emailInvalid"
              />
              @if (emailInvalid) {
                <p class="mt-1 text-xs text-error">Ingresa un correo válido</p>
              }
            </div>

            <!-- Password -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-text-secondary mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                formControlName="password"
                placeholder="••••••••"
                autocomplete="current-password"
                class="w-full rounded-lg bg-bg-elevated border border-border px-4 py-2.5 text-text-primary placeholder-text-muted text-sm
                       focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                [class.border-error]="passwordInvalid"
              />
              @if (passwordInvalid) {
                <p class="mt-1 text-xs text-error">La contraseña es requerida</p>
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
                  Ingresando...
                </span>
              } @else {
                Ingresar
              }
            </button>

          </form>

          <!-- Footer links -->
          <div class="mt-6 text-center text-sm text-text-secondary">
            ¿No tienes cuenta?
            <a routerLink="/register" class="text-accent hover:text-accent-hover font-medium ml-1">
              Crear cuenta
            </a>
          </div>

        </div>
      </div>
    </div>
  `,
})
export class LoginComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  loading$ = this.store.select(selectAuthLoading);
  error$ = this.store.select(selectAuthError);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  get emailInvalid(): boolean {
    const c = this.form.get('email')!;
    return c.invalid && c.touched;
  }

  get passwordInvalid(): boolean {
    const c = this.form.get('password')!;
    return c.invalid && c.touched;
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
    this.store.dispatch(AuthActions.login({ credentials: this.form.getRawValue() }));
  }
}
