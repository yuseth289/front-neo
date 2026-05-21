import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { WishlistService } from '../../core/account/wishlist.service';
import { Wishlist } from '../../shared/models/wishlist.models';

@Component({
  selector: 'app-wishlists-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, NgIcon],
  template: `
    <div class="max-w-2xl">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-xl font-bold text-text-primary">Mis wishlists</h1>
        <button (click)="toggleCreate()"
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors">
          <ng-icon name="lucidePlus" size="14" />
          Nueva
        </button>
      </div>

      <!-- Formulario nueva wishlist -->
      @if (showCreate()) {
        <div class="bg-bg-surface border border-border rounded-xl p-5 mb-5">
          <h2 class="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">Nueva wishlist</h2>
          <form [formGroup]="createForm" (ngSubmit)="create()" novalidate class="flex flex-col gap-4">
            <div>
              <label class="block text-sm text-text-secondary mb-1.5">Nombre</label>
              <input type="text" formControlName="name" placeholder="Ej: Juegos de navidad"
                class="w-full rounded-lg bg-bg-elevated border border-border px-3 py-2 text-text-primary text-sm
                       focus:outline-none focus:border-accent transition-colors"
                [class.border-error]="createForm.get('name')!.invalid && createForm.get('name')!.touched" />
            </div>
            <label class="flex items-center gap-2.5 cursor-pointer select-none">
              <input type="checkbox" formControlName="isPublic"
                class="w-4 h-4 rounded accent-[var(--color-accent)]" />
              <span class="text-sm text-text-secondary">Hacer pública (compartible)</span>
            </label>
            @if (createError()) {
              <p class="text-sm text-error flex items-center gap-1.5">
                <ng-icon name="lucideTriangleAlert" size="13" />{{ createError() }}
              </p>
            }
            <div class="flex gap-3">
              <button type="submit" [disabled]="creating()"
                class="px-5 py-2 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center gap-2">
                @if (creating()) { <ng-icon name="lucideRefreshCw" size="14" class="animate-spin" /> }
                Crear
              </button>
              <button type="button" (click)="toggleCreate()"
                class="px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary text-sm transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      }

      @if (loading()) {
        <div class="space-y-3">
          @for (_ of [1,2]; track $index) {
            <div class="h-20 rounded-xl bg-bg-surface border border-border animate-pulse"></div>
          }
        </div>
      } @else if (wishlists().length === 0 && !showCreate()) {
        <div class="flex flex-col items-center gap-3 py-16 text-text-muted">
          <ng-icon name="lucideHeart" size="40" />
          <p>No tienes wishlists todavía.</p>
        </div>
      } @else {
        <div class="flex flex-col gap-3">
          @for (wl of wishlists(); track wl.id) {
            <div class="bg-bg-surface border border-border rounded-xl p-4 flex items-center gap-4 hover:border-accent/30 transition-colors">
              <a [routerLink]="['/wishlists', wl.id]" class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                  <p class="text-sm font-medium text-text-primary truncate">{{ wl.name }}</p>
                  @if (wl.isPublic) {
                    <span class="text-[10px] font-bold uppercase tracking-wide bg-accent/15 text-accent px-1.5 py-0.5 rounded shrink-0">
                      Pública
                    </span>
                  }
                </div>
                <p class="text-xs text-text-muted">
                  {{ wl.items.length }} {{ wl.items.length === 1 ? 'producto' : 'productos' }}
                </p>
              </a>
              <button (click)="delete(wl.id)"
                class="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-bg-elevated transition-colors shrink-0">
                <ng-icon name="lucideTrash2" size="15" />
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class WishlistsListComponent implements OnInit {
  private wishlistService = inject(WishlistService);
  private fb = inject(FormBuilder);

  wishlists = signal<Wishlist[]>([]);
  loading = signal(true);
  showCreate = signal(false);
  creating = signal(false);
  createError = signal<string | null>(null);

  createForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    isPublic: [false],
  });

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.wishlistService.getAll().subscribe({
      next: (res) => { this.wishlists.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleCreate(): void {
    this.showCreate.update(v => !v);
    this.createForm.reset({ name: '', isPublic: false });
    this.createError.set(null);
  }

  create(): void {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    this.creating.set(true);
    this.createError.set(null);
    this.wishlistService.create(this.createForm.getRawValue()).subscribe({
      next: () => { this.showCreate.set(false); this.creating.set(false); this.load(); },
      error: (err) => { this.createError.set(err.error?.message ?? 'Error al crear'); this.creating.set(false); },
    });
  }

  delete(id: string): void {
    this.wishlistService.delete(id).subscribe({ next: () => this.load() });
  }
}
