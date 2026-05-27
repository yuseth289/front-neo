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

      <!-- Header -->
      <div class="mb-6">
        <p class="neo-stat-label">Cuenta</p>
        <h1 class="font-display text-[26px] font-bold tracking-[-0.02em] text-text-primary mt-0.5">
          Mi perfil
        </h1>
      </div>

      <!-- ── Foto de perfil ─────────────────────────────── -->
      <div class="neo-card-premium p-6 mb-4">

        <div class="flex items-center gap-5">
          <!-- Avatar con overlay hover -->
          <div class="relative shrink-0 group cursor-pointer" (click)="fileInput.click()">
            <div class="w-[72px] h-[72px] rounded-full border-2 overflow-hidden
                        border-border group-hover:border-accent transition-colors duration-200
                        bg-bg-elevated flex items-center justify-center">
              @if (avatarPreview()) {
                <img [src]="avatarPreview()" alt="Avatar" class="w-full h-full object-cover" />
              } @else {
                <span class="font-display text-2xl font-bold text-accent select-none">
                  {{ initials() }}
                </span>
              }
            </div>
            <div class="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center
                        opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ng-icon name="lucideUploadCloud" size="18" class="text-white" />
            </div>
          </div>

          <!-- Info + acciones -->
          <div class="flex-1 min-w-0">
            <h2 class="text-sm font-semibold text-text-primary leading-tight">Foto de perfil</h2>
            <p class="text-[12px] text-text-muted mt-0.5 mb-3">JPG o PNG · máx. 2 MB · recortada a 256 × 256 px.</p>
            <div class="flex items-center gap-3">
              <button type="button" (click)="fileInput.click()"
                class="neo-btn-outline !py-1.5 !px-3.5 !text-[12px]">
                <ng-icon name="lucideUploadCloud" size="13" />
                {{ avatarPreview() ? 'Cambiar foto' : 'Subir foto' }}
              </button>
              @if (avatarPreview()) {
                <button type="button" (click)="removeAvatar()"
                  class="text-[12px] text-text-muted hover:text-error transition-colors flex items-center gap-1.5">
                  <ng-icon name="lucideTrash2" size="12" />
                  Eliminar foto
                </button>
              }
            </div>
          </div>
        </div>

        <input #fileInput type="file" accept="image/jpeg,image/png,image/webp"
               class="hidden" (change)="onFileSelected($event)" />

        @if (avatarError()) {
          <div class="mt-4 flex items-center gap-2 rounded-[10px] bg-error/10 border border-error/30 px-3 py-2 text-[12px] text-error">
            <ng-icon name="lucideTriangleAlert" size="13" />{{ avatarError() }}
          </div>
        }
        @if (avatarDirty()) {
          <div class="mt-4 pt-4 border-t border-border flex items-center gap-3">
            <button type="button" (click)="saveAvatar()" [disabled]="savingAvatar()"
              class="neo-btn-accent disabled:opacity-50">
              @if (savingAvatar()) {
                <ng-icon name="lucideRefreshCw" size="13" class="neo-spin" /> Guardando…
              } @else {
                <ng-icon name="lucideCheck" size="13" /> Guardar foto
              }
            </button>
            @if (avatarSuccess()) {
              <span class="text-[12px] text-success flex items-center gap-1">
                <ng-icon name="lucideCircleCheck" size="13" /> Foto actualizada
              </span>
            }
          </div>
        }
      </div>

      <!-- ── Datos personales ────────────────────────────── -->
      <div class="neo-card-premium p-6 mb-4">
        <div class="flex items-start gap-3 mb-4">
          <div class="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
            <ng-icon name="lucideUser" size="15" class="text-accent" />
          </div>
          <div>
            <h2 class="text-sm font-semibold text-text-primary">Datos personales</h2>
            <p class="text-[12px] text-text-muted mt-0.5">Actualiza tu nombre y número de contacto.</p>
          </div>
        </div>

        @if (profileSuccess()) {
          <div class="mb-4 flex items-center gap-2 rounded-[10px] bg-success/10 border border-success/30 px-3.5 py-2.5 text-sm text-success">
            <ng-icon name="lucideCircleCheck" size="14" />
            Perfil actualizado correctamente
          </div>
        }
        @if (profileError()) {
          <div class="mb-4 flex items-center gap-2 rounded-[10px] bg-error/10 border border-error/30 px-3.5 py-2.5 text-sm text-error">
            <ng-icon name="lucideTriangleAlert" size="14" />
            {{ profileError() }}
          </div>
        }

        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" novalidate class="flex flex-col gap-4">

          <!-- Nombre + Apellido -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[12px] font-medium text-text-secondary mb-1.5">Nombre</label>
              <input type="text" formControlName="firstName"
                class="w-full rounded-[10px] bg-bg-elevated border border-border px-3.5 py-2.5 text-sm text-text-primary
                       outline-none transition-all focus:ring-2 focus:ring-accent/8 focus:border-accent" />
            </div>
            <div>
              <label class="block text-[12px] font-medium text-text-secondary mb-1.5">Apellido</label>
              <input type="text" formControlName="lastName"
                class="w-full rounded-[10px] bg-bg-elevated border border-border px-3.5 py-2.5 text-sm text-text-primary
                       outline-none transition-all focus:ring-2 focus:ring-accent/8 focus:border-accent" />
            </div>
          </div>

          <!-- Email (2/3) + Teléfono (1/3) -->
          <div class="grid grid-cols-3 gap-4">
            <div class="col-span-2">
              <label class="block text-[12px] font-medium text-text-secondary mb-1.5">Correo electrónico</label>
              <input type="email" [value]="(user$ | async)?.email ?? ''" disabled
                class="w-full rounded-[10px] bg-bg-elevated border border-dashed border-border px-3.5 py-2.5
                       text-sm text-text-muted cursor-not-allowed opacity-60" />
              <p class="text-[11px] text-text-dim mt-1">No se puede cambiar</p>
            </div>
            <div>
              <label class="block text-[12px] font-medium text-text-secondary mb-1.5">
                Teléfono <span class="text-text-muted font-normal">(opcional)</span>
              </label>
              <input type="tel" formControlName="phone" placeholder="3001234567"
                class="w-full rounded-[10px] bg-bg-elevated border border-border px-3.5 py-2.5 text-sm text-text-primary
                       placeholder:text-text-muted outline-none transition-all focus:ring-2 focus:ring-accent/8 focus:border-accent" />
            </div>
          </div>

          <div class="pt-1">
            <button type="submit" [disabled]="savingProfile()"
              class="neo-btn-accent disabled:opacity-50 disabled:cursor-not-allowed">
              @if (savingProfile()) {
                <ng-icon name="lucideRefreshCw" size="14" class="neo-spin" />
                Guardando…
              } @else {
                <ng-icon name="lucideCheck" size="14" />
                Guardar cambios
              }
            </button>
          </div>
        </form>
      </div>

      <!-- ── Cambiar contraseña ──────────────────────────── -->
      <div class="neo-card-premium p-6">
        <div class="flex items-start gap-3 mb-4">
          <div class="w-8 h-8 rounded-lg bg-bg-elevated border border-border flex items-center justify-center shrink-0">
            <ng-icon name="lucideLock" size="15" class="text-text-secondary" />
          </div>
          <div>
            <h2 class="text-sm font-semibold text-text-primary">Cambiar contraseña</h2>
            <p class="text-[12px] text-text-muted mt-0.5">Mínimo 8 caracteres.</p>
          </div>
        </div>

        @if (pwSuccess()) {
          <div class="mb-4 flex items-center gap-2 rounded-[10px] bg-success/10 border border-success/30 px-3.5 py-2.5 text-sm text-success">
            <ng-icon name="lucideCircleCheck" size="14" />
            Contraseña actualizada correctamente
          </div>
        }
        @if (pwError()) {
          <div class="mb-4 flex items-center gap-2 rounded-[10px] bg-error/10 border border-error/30 px-3.5 py-2.5 text-sm text-error">
            <ng-icon name="lucideTriangleAlert" size="14" />
            {{ pwError() }}
          </div>
        }

        <form [formGroup]="pwForm" (ngSubmit)="changePassword()" novalidate class="flex flex-col gap-4">
          <div>
            <label class="block text-[12px] font-medium text-text-secondary mb-1.5">Contraseña actual</label>
            <input type="password" formControlName="currentPassword"
              class="w-full rounded-[10px] bg-bg-elevated border px-3.5 py-2.5 text-sm text-text-primary
                     outline-none transition-all focus:ring-2 focus:ring-accent/8 focus:border-accent"
              [class.border-error]="pwForm.get('currentPassword')!.invalid && pwForm.get('currentPassword')!.touched"
              [class.border-border]="!(pwForm.get('currentPassword')!.invalid && pwForm.get('currentPassword')!.touched)" />
          </div>
          <div>
            <label class="block text-[12px] font-medium text-text-secondary mb-1.5">Nueva contraseña</label>
            <input type="password" formControlName="newPassword"
              class="w-full rounded-[10px] bg-bg-elevated border px-3.5 py-2.5 text-sm text-text-primary
                     outline-none transition-all focus:ring-2 focus:ring-accent/8 focus:border-accent"
              [class.border-error]="pwForm.get('newPassword')!.invalid && pwForm.get('newPassword')!.touched"
              [class.border-border]="!(pwForm.get('newPassword')!.invalid && pwForm.get('newPassword')!.touched)" />
            @if (pwForm.get('newPassword')!.invalid && pwForm.get('newPassword')!.touched) {
              <p class="mt-1 text-[11px] text-error">Mínimo 8 caracteres</p>
            }
          </div>
          <div class="pt-1">
            <button type="submit" [disabled]="savingPw()"
              class="neo-btn-outline !py-2.5 !px-5 disabled:opacity-50 disabled:cursor-not-allowed">
              @if (savingPw()) {
                <ng-icon name="lucideRefreshCw" size="14" class="neo-spin" />
                Cambiando…
              } @else {
                <ng-icon name="lucideLock" size="14" />
                Cambiar contraseña
              }
            </button>
          </div>
        </form>
      </div>

    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private store = inject(Store);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  user$ = this.store.select(selectUser);

  avatarPreview  = signal<string | null>(null);
  avatarDirty    = signal(false);
  savingAvatar   = signal(false);
  avatarSuccess  = signal(false);
  avatarError    = signal<string | null>(null);
  initials       = signal('');

  savingProfile  = signal(false);
  profileSuccess = signal(false);
  profileError   = signal<string | null>(null);
  savingPw       = signal(false);
  pwSuccess      = signal(false);
  pwError        = signal<string | null>(null);

  profileForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    phone:     [''],
  });

  pwForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword:     ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    this.user$.subscribe((user) => {
      if (user) {
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName:  user.lastName,
          phone:     user.phone,
        });
        const f = (user.firstName?.[0] ?? '').toUpperCase();
        const l = (user.lastName?.[0] ?? '').toUpperCase();
        this.initials.set(f + l || user.email[0].toUpperCase());
        if (user.avatarUrl && !this.avatarDirty()) {
          this.avatarPreview.set(user.avatarUrl);
        }
      }
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const side = Math.min(img.width, img.height);
        const ox = (img.width - side) / 2;
        const oy = (img.height - side) / 2;
        ctx.drawImage(img, ox, oy, side, side, 0, 0, size, size);
        this.avatarPreview.set(canvas.toDataURL('image/jpeg', 0.75));
        this.avatarDirty.set(true);
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
    (event.target as HTMLInputElement).value = '';
  }

  removeAvatar(): void {
    this.avatarPreview.set(null);
    this.avatarDirty.set(true);
  }

  saveAvatar(): void {
    this.savingAvatar.set(true);
    this.avatarError.set(null);
    this.userService.updateProfile({ avatarUrl: this.avatarPreview() ?? '' }).subscribe({
      next: (res) => {
        this.store.dispatch(AuthActions.loadUserSuccess({ user: res.data }));
        this.savingAvatar.set(false);
        this.avatarDirty.set(false);
        this.avatarSuccess.set(true);
        setTimeout(() => this.avatarSuccess.set(false), 3000);
      },
      error: (err) => {
        this.savingAvatar.set(false);
        this.avatarError.set(err?.error?.message ?? 'Error al guardar la foto');
      },
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
