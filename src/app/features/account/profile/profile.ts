import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { NgIcon } from '@ng-icons/core';
import { UserService } from '../../../core/account/user.service';
import { selectUser } from '../../../core/auth/store/auth.selectors';
import * as AuthActions from '../../../core/auth/store/auth.actions';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  template: `
    <div class="max-w-2xl">
      <h1 class="text-xl font-bold text-text-primary mb-6">Mi perfil</h1>

      <!-- Datos personales -->
      <section class="bg-bg-surface border border-border rounded-xl p-6 mb-5">
        <h2 class="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">Datos personales</h2>

        @if (profileSuccess()) {
          <div class="mb-4 flex items-center gap-2 rounded-lg bg-success/10 border border-success/30 px-4 py-2.5 text-sm text-success">
            <ng-icon name="lucideCircleCheck" size="14" />
            Perfil actualizado correctamente
          </div>
        }
        @if (profileError()) {
          <div class="mb-4 flex items-center gap-2 rounded-lg bg-error/10 border border-error/30 px-4 py-2.5 text-sm text-error">
            <ng-icon name="lucideTriangleAlert" size="14" />
            {{ profileError() }}
          </div>
        }

        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" novalidate>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm text-text-secondary mb-1.5">Nombre</label>
              <input type="text" formControlName="firstName"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors" />
            </div>
            <div>
              <label class="block text-sm text-text-secondary mb-1.5">Apellido</label>
              <input type="text" formControlName="lastName"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors" />
            </div>
          </div>
          <div class="mb-4">
            <label class="block text-sm text-text-secondary mb-1.5">Correo electrónico</label>
            <input type="email" [value]="(user$ | async)?.email ?? ''" disabled
              class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-muted text-sm cursor-not-allowed" />
            <p class="text-xs text-text-muted mt-1">El correo no se puede cambiar</p>
          </div>
          <div class="mb-5">
            <label class="block text-sm text-text-secondary mb-1.5">Teléfono</label>
            <input type="tel" formControlName="phone"
              class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                     focus:outline-none focus:border-accent transition-colors" />
          </div>
          <button type="submit" [disabled]="savingProfile()"
            class="px-5 py-2 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center gap-2">
            @if (savingProfile()) {
              <ng-icon name="lucideRefreshCw" size="14" class="animate-spin" />
            }
            Guardar cambios
          </button>
        </form>
      </section>

      <!-- Cambio de contraseña -->
      <section class="bg-bg-surface border border-border rounded-xl p-6">
        <h2 class="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">Cambiar contraseña</h2>

        @if (pwSuccess()) {
          <div class="mb-4 flex items-center gap-2 rounded-lg bg-success/10 border border-success/30 px-4 py-2.5 text-sm text-success">
            <ng-icon name="lucideCircleCheck" size="14" />
            Contraseña actualizada
          </div>
        }
        @if (pwError()) {
          <div class="mb-4 flex items-center gap-2 rounded-lg bg-error/10 border border-error/30 px-4 py-2.5 text-sm text-error">
            <ng-icon name="lucideTriangleAlert" size="14" />
            {{ pwError() }}
          </div>
        }

        <form [formGroup]="pwForm" (ngSubmit)="changePassword()" novalidate>
          <div class="mb-4">
            <label class="block text-sm text-text-secondary mb-1.5">Contraseña actual</label>
            <input type="password" formControlName="currentPassword"
              class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                     focus:outline-none focus:border-accent transition-colors"
              [class.border-error]="pwForm.get('currentPassword')!.invalid && pwForm.get('currentPassword')!.touched" />
          </div>
          <div class="mb-4">
            <label class="block text-sm text-text-secondary mb-1.5">Nueva contraseña</label>
            <input type="password" formControlName="newPassword"
              class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                     focus:outline-none focus:border-accent transition-colors"
              [class.border-error]="pwForm.get('newPassword')!.invalid && pwForm.get('newPassword')!.touched" />
            @if (pwForm.get('newPassword')!.invalid && pwForm.get('newPassword')!.touched) {
              <p class="mt-1 text-xs text-error">Mínimo 8 caracteres</p>
            }
          </div>
          <button type="submit" [disabled]="savingPw()"
            class="px-5 py-2 rounded-lg bg-bg-elevated hover:bg-bg-subtle border border-border hover:border-accent/60
                   disabled:opacity-50 text-text-secondary hover:text-text-primary text-sm font-medium transition-colors flex items-center gap-2">
            @if (savingPw()) {
              <ng-icon name="lucideRefreshCw" size="14" class="animate-spin" />
            }
            Cambiar contraseña
          </button>
        </form>
      </section>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private store = inject(Store);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  user$ = this.store.select(selectUser);

  savingProfile = signal(false);
  profileSuccess = signal(false);
  profileError = signal<string | null>(null);
  savingPw = signal(false);
  pwSuccess = signal(false);
  pwError = signal<string | null>(null);

  profileForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: [''],
  });

  pwForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    this.user$.subscribe((user) => {
      if (user) {
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
        });
      }
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.savingProfile.set(true);
    this.profileSuccess.set(false);
    this.profileError.set(null);

    this.userService.updateProfile(this.profileForm.getRawValue()).subscribe({
      next: (res) => {
        this.store.dispatch(AuthActions.loadUserSuccess({ user: res.data }));
        this.savingProfile.set(false);
        this.profileSuccess.set(true);
        setTimeout(() => this.profileSuccess.set(false), 3000);
      },
      error: (err) => {
        this.profileError.set(err.error?.message ?? 'Error al guardar');
        this.savingProfile.set(false);
      },
    });
  }

  changePassword(): void {
    if (this.pwForm.invalid) { this.pwForm.markAllAsTouched(); return; }
    this.savingPw.set(true);
    this.pwSuccess.set(false);
    this.pwError.set(null);

    this.userService.changePassword(this.pwForm.getRawValue()).subscribe({
      next: () => {
        this.pwForm.reset();
        this.savingPw.set(false);
        this.pwSuccess.set(true);
        setTimeout(() => this.pwSuccess.set(false), 3000);
      },
      error: (err) => {
        this.pwError.set(err.error?.message ?? 'Contraseña actual incorrecta');
        this.savingPw.set(false);
      },
    });
  }
}
